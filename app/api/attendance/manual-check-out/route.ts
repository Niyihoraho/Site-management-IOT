import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/lib/generated/prisma"
import { 
  checkOutSchema,
  type CheckOutInput
} from "@/app/api/validation/attendance"

const prisma = new PrismaClient()

// POST /api/attendance/manual-check-out - Manual check out worker
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
    
    // Update attendance record with manual check-out
    const updatedRecord = await prisma.attendanceRecord.update({
      where: { id: attendanceRecord.id },
      data: {
        checkOutTime: checkOutTimeDate,
        totalHours: totalHoursWorked,
        regularHours: regularHours,
        overtimeHours: overtimeHours,
        status,
        checkOutMethod: 'MANUAL',
        fingerprintVerified: false
      },
      include: {
        worker: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            status: true,
            assignedSiteId: true
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
      message: "Manual check-out successful",
      summary: {
        totalHours: totalHoursWorked.toFixed(2),
        regularHours: regularHours.toFixed(2),
        overtimeHours: overtimeHours.toFixed(2),
        status
      }
    })
    
  } catch (error) {
    console.error("Error processing manual check-out:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid input data",
        details: error.message
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to process manual check-out"
    }, { status: 500 })
  }
}

// GET /api/attendance/manual-check-out - Get manual check-out records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const page = parseInt(queryParams.page || '1')
    const limit = parseInt(queryParams.limit || '10')
    const workerId = queryParams.workerId ? parseInt(queryParams.workerId) : undefined
    const siteId = queryParams.siteId ? parseInt(queryParams.siteId) : undefined
    const dateFrom = queryParams.dateFrom
    const dateTo = queryParams.dateTo
    const search = queryParams.search
    
    const skip = (page - 1) * limit
    
    // Build where clause for manual check-outs
    const where: any = {
      checkOutMethod: 'MANUAL',
      fingerprintVerified: false,
      checkOutTime: { not: null }
    }
    
    if (workerId) where.workerId = workerId
    if (siteId) where.siteId = siteId
    
    if (dateFrom || dateTo) {
      where.attendanceDate = {}
      if (dateFrom) where.attendanceDate.gte = new Date(dateFrom)
      if (dateTo) where.attendanceDate.lte = new Date(dateTo)
    }
    
    if (search) {
      where.OR = [
        {
          worker: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { employeeId: { contains: search, mode: 'insensitive' } }
            ]
          }
        },
        {
          site: {
            siteName: { contains: search, mode: 'insensitive' }
          }
        }
      ]
    }
    
    // Get manual check-out records
    const [records, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { checkOutTime: 'desc' },
        include: {
          worker: {
            select: {
              id: true,
              employeeId: true,
              firstName: true,
              lastName: true,
              status: true
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
      }),
      prisma.attendanceRecord.count({ where })
    ])
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1
    
    return NextResponse.json({
      success: true,
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    })
    
  } catch (error) {
    console.error("Error fetching manual check-out records:", error)
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch manual check-out records"
    }, { status: 500 })
  }
}
