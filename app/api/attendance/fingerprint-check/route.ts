import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/lib/generated/prisma"
import { 
  fingerprintScanRequestSchema,
  createFingerprintLogSchema,
  type FingerprintScanRequestInput,
  type CreateFingerprintLogInput
} from "@/app/api/validation/fingerprint"

const prisma = new PrismaClient()

// POST /api/attendance/fingerprint-check - Integrated fingerprint check for attendance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = fingerprintScanRequestSchema.parse(body)
    
    const { workerId, siteId, deviceId, scanData, scanQuality, fingerPosition, hand } = validatedData
    
    // Verify worker, site, and device exist
    const [worker, site, device] = await Promise.all([
      prisma.worker.findUnique({
        where: { id: workerId },
        select: { 
          id: true, 
          employeeId: true, 
          firstName: true, 
          lastName: true,
          status: true,
          assignedSiteId: true
        }
      }),
      prisma.constructionSite.findUnique({
        where: { id: siteId },
        select: { 
          id: true, 
          siteName: true, 
          siteCode: true,
          workingHoursStart: true,
          workingHoursEnd: true,
          standardHoursPerDay: true,
          overtimeRateMultiplier: true
        }
      }),
      prisma.fingerprintDevice.findUnique({
        where: { id: deviceId },
        select: { 
          id: true, 
          deviceName: true, 
          deviceId: true,
          isActive: true,
          isOnline: true
        }
      })
    ])
    
    if (!worker) {
      return NextResponse.json({
        success: false,
        error: "Worker not found"
      }, { status: 404 })
    }
    
    if (!site) {
      return NextResponse.json({
        success: false,
        error: "Site not found"
      }, { status: 404 })
    }
    
    if (!device) {
      return NextResponse.json({
        success: false,
        error: "Fingerprint device not found"
      }, { status: 404 })
    }
    
    if (worker.status !== 'ACTIVE') {
      return NextResponse.json({
        success: false,
        error: "Worker is not active"
      }, { status: 400 })
    }
    
    if (!device.isActive) {
      return NextResponse.json({
        success: false,
        error: "Fingerprint device is not active"
      }, { status: 400 })
    }
    
    if (!device.isOnline) {
      return NextResponse.json({
        success: false,
        error: "Fingerprint device is offline"
      }, { status: 400 })
    }
    
    // Check if worker is assigned to this site
    if (worker.assignedSiteId !== siteId) {
      return NextResponse.json({
        success: false,
        error: "Worker is not assigned to this site"
      }, { status: 400 })
    }
    
    // Get fingerprint templates for this worker
    const templates = await prisma.fingerprintTemplate.findMany({
      where: {
        workerId,
        isActive: true,
        ...(fingerPosition && { fingerPosition }),
        ...(hand && { hand })
      },
      orderBy: { qualityScore: 'desc' }
    })
    
    if (templates.length === 0) {
      // Log failed scan attempt
      const logData: CreateFingerprintLogInput = {
        workerId,
        deviceId,
        matchResult: 'NO_MATCH',
        scanQuality: scanQuality || 0,
        errorMessage: 'No fingerprint templates found for worker'
      }
      
      await prisma.fingerprintLog.create({ data: logData })
      
      return NextResponse.json({
        success: false,
        error: "No fingerprint templates found for this worker",
        matchResult: 'NO_MATCH'
      }, { status: 404 })
    }
    
    // Simulate fingerprint matching
    const matchResults = await simulateFingerprintMatching(scanData, templates, 80)
    const bestMatch = matchResults.reduce((best, current) => 
      current.matchScore > best.matchScore ? current : best
    )
    
    // Create fingerprint log
    const logData: CreateFingerprintLogInput = {
      workerId,
      deviceId,
      matchScore: bestMatch.matchScore,
      matchedTemplateId: bestMatch.templateId,
      scanQuality: bestMatch.scanQuality,
      matchResult: bestMatch.matchResult,
      errorMessage: bestMatch.errorMessage
    }
    
    const fingerprintLog = await prisma.fingerprintLog.create({ data: logData })
    
    // If fingerprint verification failed, return error
    if (bestMatch.matchResult !== 'SUCCESS') {
      return NextResponse.json({
        success: false,
        error: bestMatch.errorMessage || "Fingerprint verification failed",
        data: {
          matchScore: bestMatch.matchScore,
          scanQuality: bestMatch.scanQuality,
          matchResult: bestMatch.matchResult,
          fingerprintVerified: false
        }
      }, { status: 400 })
    }
    
    // Fingerprint verification successful - process attendance
    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    
    // Find today's attendance record
    let attendanceRecord = await prisma.attendanceRecord.findUnique({
      where: {
        workerId_siteId_attendanceDate: {
          workerId,
          siteId,
          attendanceDate: today
        }
      }
    })
    
    let attendanceAction = null
    let updatedAttendanceRecord = null
    
    if (!attendanceRecord) {
      // Create new attendance record for check-in
      updatedAttendanceRecord = await prisma.attendanceRecord.create({
        data: {
          workerId,
          siteId,
          attendanceDate: today,
          checkInTime: now,
          status: 'PRESENT',
          checkOutMethod: 'FINGERPRINT',
          fingerprintVerified: true
        },
        include: {
          worker: {
            select: {
              id: true,
              employeeId: true,
              firstName: true,
              lastName: true
            }
          },
          site: {
            select: {
              id: true,
              siteName: true,
              siteCode: true
            }
          }
        }
      })
      
      attendanceAction = 'check-in'
    } else if (!attendanceRecord.checkInTime) {
      // Update existing record with check-in
      updatedAttendanceRecord = await prisma.attendanceRecord.update({
        where: { id: attendanceRecord.id },
        data: {
          checkInTime: now,
          status: 'PRESENT',
          checkOutMethod: 'FINGERPRINT',
          fingerprintVerified: true
        },
        include: {
          worker: {
            select: {
              id: true,
              employeeId: true,
              firstName: true,
              lastName: true
            }
          },
          site: {
            select: {
              id: true,
              siteName: true,
              siteCode: true
            }
          }
        }
      })
      
      attendanceAction = 'check-in'
    } else if (!attendanceRecord.checkOutTime) {
      // Process check-out
      const checkInTime = new Date(attendanceRecord.checkInTime)
      
      // Calculate working hours
      const totalHoursWorked = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)
      
      // Calculate regular and overtime hours
      const standardHours = Number(site.standardHoursPerDay)
      const regularHours = Math.min(totalHoursWorked, standardHours)
      const overtimeHours = Math.max(0, totalHoursWorked - standardHours)
      
      // Determine attendance status
      let status = attendanceRecord.status
      
      // Check if worker was late (check-in after working hours start)
      const workingHoursStart = site.workingHoursStart.split(':')
      const workingStartTime = new Date(checkInTime)
      workingStartTime.setHours(parseInt(workingHoursStart[0]), parseInt(workingHoursStart[1]), 0, 0)
      
      if (checkInTime > workingStartTime && status === 'PRESENT') {
        status = 'LATE'
      }
      
      // Check for early departure
      const workingHoursEnd = site.workingHoursEnd.split(':')
      const workingEndTime = new Date(now)
      workingEndTime.setHours(parseInt(workingHoursEnd[0]), parseInt(workingHoursEnd[1]), 0, 0)
      
      if (now < workingEndTime && totalHoursWorked < standardHours * 0.5) {
        status = 'EARLY_DEPARTURE'
      } else if (overtimeHours > 0) {
        status = 'OVERTIME'
      }
      
      // Update attendance record with check-out
      updatedAttendanceRecord = await prisma.attendanceRecord.update({
        where: { id: attendanceRecord.id },
        data: {
          checkOutTime: now,
          totalHours: totalHoursWorked,
          regularHours: regularHours,
          overtimeHours: overtimeHours,
          status,
          checkOutMethod: 'FINGERPRINT',
          fingerprintVerified: true
        },
        include: {
          worker: {
            select: {
              id: true,
              employeeId: true,
              firstName: true,
              lastName: true
            }
          },
          site: {
            select: {
              id: true,
              siteName: true,
              siteCode: true
            }
          }
        }
      })
      
      attendanceAction = 'check-out'
    } else {
      // Already checked in and out today
      attendanceAction = 'already-completed'
      updatedAttendanceRecord = attendanceRecord
    }
    
    // Update fingerprint log with attendance record ID
    await prisma.fingerprintLog.update({
      where: { id: fingerprintLog.id },
      data: { attendanceRecordId: updatedAttendanceRecord?.id }
    })
    
    // Return successful result
    return NextResponse.json({
      success: true,
      data: {
        worker,
        site,
        device,
        attendanceRecord: updatedAttendanceRecord,
        fingerprintLog: {
          id: fingerprintLog.id,
          matchScore: bestMatch.matchScore,
          scanQuality: bestMatch.scanQuality,
          matchResult: bestMatch.matchResult
        },
        attendanceAction,
        fingerprintVerified: true
      },
      message: `Fingerprint verification successful - ${attendanceAction}`,
      summary: attendanceAction === 'check-out' ? {
        totalHours: updatedAttendanceRecord?.totalHours?.toFixed(2),
        regularHours: updatedAttendanceRecord?.regularHours?.toFixed(2),
        overtimeHours: updatedAttendanceRecord?.overtimeHours?.toFixed(2),
        status: updatedAttendanceRecord?.status
      } : undefined
    })
    
  } catch (error) {
    console.error("Error processing fingerprint attendance check:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid input data",
        details: error.message
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to process fingerprint attendance check"
    }, { status: 500 })
  }
}

// Simulate fingerprint matching algorithm
async function simulateFingerprintMatching(
  scanData: string, 
  templates: any[], 
  minMatchScore: number
): Promise<Array<{
  templateId: number;
  matchScore: number;
  scanQuality: number;
  matchResult: string;
  errorMessage?: string;
}>> {
  const results = []
  
  for (const template of templates) {
    // Simulate scan quality (random between 70-100)
    const scanQuality = Math.floor(Math.random() * 31) + 70
    
    // Simulate match score based on template quality and scan quality
    const baseScore = Math.min(template.qualityScore, scanQuality)
    const matchScore = Math.floor(baseScore * (0.8 + Math.random() * 0.4)) // 80-120% of base score
    
    let matchResult: string
    let errorMessage: string | undefined
    
    if (scanQuality < 60) {
      matchResult = 'POOR_QUALITY'
      errorMessage = 'Scan quality too low'
    } else if (matchScore >= minMatchScore) {
      matchResult = 'SUCCESS'
    } else if (matchScore < 50) {
      matchResult = 'NO_MATCH'
      errorMessage = 'No matching fingerprint found'
    } else {
      matchResult = 'NO_MATCH'
      errorMessage = 'Match score below threshold'
    }
    
    results.push({
      templateId: template.id,
      matchScore,
      scanQuality,
      matchResult,
      errorMessage
    })
  }
  
  return results
}
