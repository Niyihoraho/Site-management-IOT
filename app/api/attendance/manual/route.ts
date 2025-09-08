import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/lib/generated/prisma"

const prisma = new PrismaClient()

// GET /api/attendance/manual - Get all manual attendance records
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
    const type = queryParams.type // 'check-in', 'check-out', or 'all'
    
    const skip = (page - 1) * limit
    
    // Build where clause for manual attendance records
    const where: any = {
      checkOutMethod: 'MANUAL',
      fingerprintVerified: false
    }
    
    // Filter by type if specified
    if (type === 'check-in') {
      where.checkInTime = { not: null }
      where.checkOutTime = null
    } else if (type === 'check-out') {
      where.checkOutTime = { not: null }
    }
    // If type is 'all' or not specified, show all manual records
    
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
    
    // Get manual attendance records
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
          }
        }
      }),
      prisma.attendanceRecord.count({ where })
    ])
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1
    
    // Get summary statistics
    const summary = await prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: {
        checkOutMethod: 'MANUAL',
        fingerprintVerified: false,
        ...(dateFrom || dateTo ? {
          attendanceDate: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {})
          }
        } : {})
      },
      _count: {
        status: true
      }
    })
    
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
      },
      summary: {
        totalManualRecords: total,
        statusBreakdown: summary.reduce((acc, item) => {
          acc[item.status] = item._count.status
          return acc
        }, {} as Record<string, number>)
      }
    })
    
  } catch (error) {
    console.error("Error fetching manual attendance records:", error)
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch manual attendance records"
    }, { status: 500 })
  }
}
