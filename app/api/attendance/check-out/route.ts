import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/lib/generated/prisma"
import { 
  checkOutSchema,
  type CheckOutInput
} from "@/app/api/validation/attendance"

const prisma = new PrismaClient()

// POST /api/attendance/check-out - Check out worker
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = checkOutSchema.parse(body)
    
    const { workerId, siteId, checkOutTime, checkOutMethod, fingerprintVerified } = validatedData
    
    // Verify worker and site exist
    const [worker, site] = await Promise.all([
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
    
    if (worker.status !== 'ACTIVE') {
      return NextResponse.json({
        success: false,
        error: "Worker is not active"
      }, { status: 400 })
    }
    
    // Get today's date for attendance record
    const attendanceDate = new Date(checkOutTime)
    attendanceDate.setHours(0, 0, 0, 0)
    
    // Find today's attendance record
    const attendanceRecord = await prisma.attendanceRecord.findUnique({
      where: {
        workerId_siteId_attendanceDate: {
          workerId,
          siteId,
          attendanceDate
        }
      }
    })
    
    if (!attendanceRecord) {
      return NextResponse.json({
        success: false,
        error: "No attendance record found for today. Worker must check in first."
      }, { status: 404 })
    }
    
    if (!attendanceRecord.checkInTime) {
      return NextResponse.json({
        success: false,
        error: "Worker has not checked in today"
      }, { status: 400 })
    }
    
    if (attendanceRecord.checkOutTime) {
      return NextResponse.json({
        success: false,
        error: "Worker has already checked out today"
      }, { status: 409 })
    }
    
    // Calculate working hours
    const checkInTime = new Date(attendanceRecord.checkInTime)
    const checkOutTimeDate = new Date(checkOutTime)
    
    // Calculate total hours worked (in hours)
    const totalHoursWorked = (checkOutTimeDate.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)
    
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
    const workingEndTime = new Date(checkOutTimeDate)
    workingEndTime.setHours(parseInt(workingHoursEnd[0]), parseInt(workingHoursEnd[1]), 0, 0)
    
    if (checkOutTimeDate < workingEndTime && totalHoursWorked < standardHours * 0.5) {
      status = 'EARLY_DEPARTURE'
    } else if (overtimeHours > 0) {
      status = 'OVERTIME'
    }
    
    // Update attendance record
    const updatedRecord = await prisma.attendanceRecord.update({
      where: { id: attendanceRecord.id },
      data: {
        checkOutTime: checkOutTimeDate,
        totalHours: totalHoursWorked,
        regularHours: regularHours,
        overtimeHours: overtimeHours,
        status,
        checkOutMethod,
        fingerprintVerified
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
    
    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: "Check-out successful",
      summary: {
        totalHours: totalHoursWorked.toFixed(2),
        regularHours: regularHours.toFixed(2),
        overtimeHours: overtimeHours.toFixed(2),
        status
      }
    })
    
  } catch (error) {
    console.error("Error processing check-out:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid input data",
        details: error.message
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to process check-out"
    }, { status: 500 })
  }
}
