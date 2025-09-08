import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/lib/generated/prisma"
import { 
  getFingerprintLogsQuerySchema,
  type GetFingerprintLogsQuery
} from "@/app/api/validation/fingerprint"

const prisma = new PrismaClient()

// GET /api/fingerprint/logs - Get all fingerprint logs with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const validatedQuery = getFingerprintLogsQuerySchema.parse(queryParams)
    const { page, limit, workerId, deviceId, matchResult, dateFrom, dateTo } = validatedQuery
    
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {}
    
    if (workerId) where.workerId = workerId
    if (deviceId) where.deviceId = deviceId
    if (matchResult) where.matchResult = matchResult
    
    if (dateFrom || dateTo) {
      where.scanTimestamp = {}
      if (dateFrom) where.scanTimestamp.gte = new Date(dateFrom)
      if (dateTo) where.scanTimestamp.lte = new Date(dateTo)
    }
    
    // Get fingerprint logs with related data
    const [logs, total] = await Promise.all([
      prisma.fingerprintLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scanTimestamp: 'desc' },
        include: {
          device: {
            select: {
              id: true,
              deviceName: true,
              deviceId: true
            }
          },
          matchedTemplate: {
            select: {
              id: true,
              fingerPosition: true,
              hand: true,
              qualityScore: true
            }
          }
        }
      }),
      prisma.fingerprintLog.count({ where })
    ])
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1
    
    return NextResponse.json({
      success: true,
      data: logs,
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
    console.error("Error fetching fingerprint logs:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid query parameters",
        details: error.message
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch fingerprint logs"
    }, { status: 500 })
  }
}
