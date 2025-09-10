import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { 
  createFingerprintLogSchema,
  getFingerprintLogsQuerySchema,
  type CreateFingerprintLogInput,
  type GetFingerprintLogsQuery
} from "@/app/api/validation/fingerprint"

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

// POST /api/fingerprint/logs - Create new fingerprint log
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createFingerprintLogSchema.parse(body)
    
    // Verify worker exists (if provided)
    if (validatedData.workerId) {
      const worker = await prisma.worker.findUnique({
        where: { id: validatedData.workerId },
        select: { id: true, employeeId: true, firstName: true, lastName: true }
      })
      
      if (!worker) {
        return NextResponse.json({
          success: false,
          error: "Worker not found"
        }, { status: 404 })
      }
    }
    
    // Verify device exists (if provided)
    if (validatedData.deviceId) {
      const device = await prisma.fingerprintDevice.findUnique({
        where: { id: validatedData.deviceId },
        select: { id: true, deviceName: true, deviceId: true }
      })
      
      if (!device) {
        return NextResponse.json({
          success: false,
          error: "Device not found"
        }, { status: 404 })
      }
    }
    
    // Verify template exists (if provided)
    if (validatedData.matchedTemplateId) {
      const template = await prisma.fingerprintTemplate.findUnique({
        where: { id: validatedData.matchedTemplateId },
        select: { id: true, workerId: true, fingerPosition: true, hand: true }
      })
      
      if (!template) {
        return NextResponse.json({
          success: false,
          error: "Template not found"
        }, { status: 404 })
      }
    }
    
    // Create fingerprint log
    const fingerprintLog = await prisma.fingerprintLog.create({
      data: validatedData,
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
    })
    
    return NextResponse.json({
      success: true,
      data: fingerprintLog,
      message: "Fingerprint log created successfully"
    }, { status: 201 })
    
  } catch (error) {
    console.error("Error creating fingerprint log:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid input data",
        details: error.message
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to create fingerprint log"
    }, { status: 500 })
  }
}