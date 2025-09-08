import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/lib/generated/prisma"
import { 
  checkInSchema,
  type CheckInInput
} from "@/app/api/validation/attendance"

const prisma = new PrismaClient()

// POST /api/attendance/check-in - Check in worker
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = checkInSchema.parse(body)
    
    const { workerId, siteId, checkInTime } = validatedData
    
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
          workingHoursEnd: true
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
    
    // Check if worker is assigned to this site
    if (worker.assignedSiteId !== siteId) {
      return NextResponse.json({
        success: false,
        error: "Worker is not assigned to this site"
      }, { status: 400 })
    }
    
    // Get today's date for attendance record
    const attendanceDate = new Date(checkInTime)
    attendanceDate.setHours(0, 0, 0, 0)
    
    // Check if attendance record already exists for today
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: {
        workerId_siteId_attendanceDate: {
          workerId,
          siteId,
          attendanceDate
        }
      }
    })
    
    if (existingRecord) {
      if (existingRecord.checkInTime) {
        return NextResponse.json({
          success: false,
          error: "Worker has already checked in today"
        }, { status: 409 })
      }
      
      // Update existing record with check-in time
      const updatedRecord = await prisma.attendanceRecord.update({
        where: { id: existingRecord.id },
        data: { 
          checkInTime: new Date(checkInTime),
          status: 'PRESENT'
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
        message: "Check-in successful"
      })
    }
    
    // Create new attendance record
    const attendanceRecord = await prisma.attendanceRecord.create({
      data: {
        workerId,
        siteId,
        attendanceDate,
        checkInTime: new Date(checkInTime),
        status: 'PRESENT'
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
      data: attendanceRecord,
      message: "Check-in successful"
    }, { status: 201 })
    
  } catch (error) {
    console.error("Error processing check-in:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid input data",
        details: error.message
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to process check-in"
    }, { status: 500 })
  }
}
