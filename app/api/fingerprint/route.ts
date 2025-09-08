import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/lib/generated/prisma"
import { 
  createFingerprintTemplateSchema,
  getFingerprintTemplatesQuerySchema,
  type CreateFingerprintTemplateInput,
  type GetFingerprintTemplatesQuery
} from "@/app/api/validation/fingerprint"

const prisma = new PrismaClient()

// GET /api/fingerprint - Get all fingerprint templates with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const validatedQuery = getFingerprintTemplatesQuerySchema.parse(queryParams)
    const { page, limit, workerId, fingerPosition, hand, isActive } = validatedQuery
    
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {}
    
    if (workerId) where.workerId = workerId
    if (fingerPosition) where.fingerPosition = fingerPosition
    if (hand) where.hand = hand
    if (isActive !== undefined) where.isActive = isActive
    
    // Get fingerprint templates with related data
    const [templates, total] = await Promise.all([
      prisma.fingerprintTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { enrollmentDate: 'desc' },
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
          fingerprintLogs: {
            select: {
              id: true,
              matchResult: true,
              matchScore: true,
              scanTimestamp: true
            },
            orderBy: { scanTimestamp: 'desc' },
            take: 5
          }
        }
      }),
      prisma.fingerprintTemplate.count({ where })
    ])
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1
    
    return NextResponse.json({
      success: true,
      data: templates,
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
    console.error("Error fetching fingerprint templates:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid query parameters",
        details: error.message
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch fingerprint templates"
    }, { status: 500 })
  }
}

// POST /api/fingerprint - Create new fingerprint template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createFingerprintTemplateSchema.parse(body)
    
    // Verify worker exists
    const worker = await prisma.worker.findUnique({
      where: { id: validatedData.workerId },
      select: { 
        id: true, 
        employeeId: true, 
        firstName: true, 
        lastName: true,
        status: true
      }
    })
    
    if (!worker) {
      return NextResponse.json({
        success: false,
        error: "Worker not found"
      }, { status: 404 })
    }
    
    if (worker.status !== 'ACTIVE') {
      return NextResponse.json({
        success: false,
        error: "Worker is not active"
      }, { status: 400 })
    }
    
    // Check if template already exists for this worker, finger position, and hand
    const existingTemplate = await prisma.fingerprintTemplate.findFirst({
      where: {
        workerId: validatedData.workerId,
        fingerPosition: validatedData.fingerPosition,
        hand: validatedData.hand,
        isActive: true
      }
    })
    
    if (existingTemplate) {
      return NextResponse.json({
        success: false,
        error: `Fingerprint template already exists for ${validatedData.hand} ${validatedData.fingerPosition}`
      }, { status: 409 })
    }
    
    // Create fingerprint template
    const fingerprintTemplate = await prisma.fingerprintTemplate.create({
      data: validatedData,
      include: {
        worker: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            status: true
          }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: fingerprintTemplate,
      message: "Fingerprint template created successfully"
    }, { status: 201 })
    
  } catch (error) {
    console.error("Error creating fingerprint template:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid input data",
        details: error.message
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to create fingerprint template"
    }, { status: 500 })
  }
}
