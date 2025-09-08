import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/lib/generated/prisma"
import { 
  createAttendanceRecordSchema,
  getAttendanceRecordsQuerySchema,
  type CreateAttendanceRecordInput,
  type GetAttendanceRecordsQuery
} from "@/app/api/validation/attendance"

const prisma = new PrismaClient()

// GET /api/attendance - Get all attendance records with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const validatedQuery = getAttendanceRecordsQuerySchema.parse(queryParams)
    const { page, limit, workerId, siteId, status, dateFrom, dateTo, search } = validatedQuery
    
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {}
    
    if (workerId) where.workerId = workerId
    if (siteId) where.siteId = siteId
    if (status) where.status = status
    
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
    
    // Get attendance records with related data
    const [records, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { attendanceDate: 'desc' },
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
          },
          fingerprintLogs: {
            select: {
              id: true,
              matchResult: true,
              matchScore: true,
              scanQuality: true,
              scanTimestamp: true
            },
            orderBy: { scanTimestamp: 'desc' },
            take: 1
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
    console.error("Error fetching attendance records:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid query parameters",
        details: error.message
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch attendance records"
    }, { status: 500 })
  }
}

// POST /api/attendance - Create new attendance record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createAttendanceRecordSchema.parse(body)
    
    // Check if attendance record already exists for this worker, site, and date
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: {
        workerId_siteId_attendanceDate: {
          workerId: validatedData.workerId,
          siteId: validatedData.siteId,
          attendanceDate: validatedData.attendanceDate
        }
      }
    })
    
    if (existingRecord) {
      return NextResponse.json({
        success: false,
        error: "Attendance record already exists for this worker, site, and date"
      }, { status: 409 })
    }
    
    // Verify worker and site exist
    const [worker, site] = await Promise.all([
      prisma.worker.findUnique({
        where: { id: validatedData.workerId },
        select: { id: true, employeeId: true, firstName: true, lastName: true }
      }),
      prisma.constructionSite.findUnique({
        where: { id: validatedData.siteId },
        select: { id: true, siteName: true, siteCode: true }
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
    
    // Create attendance record
    const attendanceRecord = await prisma.attendanceRecord.create({
      data: validatedData,
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
      message: "Attendance record created successfully"
    }, { status: 201 })
    
  } catch (error) {
    console.error("Error creating attendance record:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid input data",
        details: error.message
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to create attendance record"
    }, { status: 500 })
  }
}
