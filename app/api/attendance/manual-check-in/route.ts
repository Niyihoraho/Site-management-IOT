import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/lib/generated/prisma"
import { 
  checkInSchema,
  type CheckInInput
} from "@/app/api/validation/attendance"

const prisma = new PrismaClient()

// POST /api/attendance/manual-check-in - Manual check in worker
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
      
      // Update existing record with manual check-in
      const updatedRecord = await prisma.attendanceRecord.update({
        where: { id: existingRecord.id },
        data: { 
          checkInTime: new Date(checkInTime),
          status: 'PRESENT',
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
        message: "Manual check-in successful"
      })
    }
    
    // Create new attendance record with manual check-in
    const attendanceRecord = await prisma.attendanceRecord.create({
      data: {
        workerId,
        siteId,
        attendanceDate,
        checkInTime: new Date(checkInTime),
        status: 'PRESENT',
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
      data: attendanceRecord,
      message: "Manual check-in successful"
    }, { status: 201 })
    
  } catch (error) {
    console.error("Error processing manual check-in:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid input data",
        details: error.message
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to process manual check-in"
    }, { status: 500 })
  }
}

// GET /api/attendance/manual-check-in - Get manual check-in records
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
    
    // Build where clause for manual check-ins
    const where: any = {
      checkOutMethod: 'MANUAL',
      fingerprintVerified: false
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
    
    // Get manual check-in records
    const [records, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { checkInTime: 'desc' },
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
    console.error("Error fetching manual check-in records:", error)
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch manual check-in records"
    }, { status: 500 })
  }
}
