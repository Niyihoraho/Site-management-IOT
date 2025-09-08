import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createJobTypeSchema, getJobTypesQuerySchema } from "@/app/api/validation/job-type"

// GET /api/job-types - Get all job types with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    // Set default values for page and limit if not provided
    if (!queryParams.page) queryParams.page = "1"
    if (!queryParams.limit) queryParams.limit = "10"
    
    // Parse query parameters with defaults
    const page = parseInt(queryParams.page) || 1
    const limit = parseInt(queryParams.limit) || 10
    const category = queryParams.category
    const isActive = queryParams.isActive === "true" ? true : queryParams.isActive === "false" ? false : undefined
    const search = queryParams.search
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (category) {
      where.category = category
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive
    }
    
    if (search) {
      where.OR = [
        { jobName: { contains: search, mode: 'insensitive' } },
        { jobCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get job types with pagination
    const [jobTypes, total] = await Promise.all([
      prisma.jobType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' }, // Use id instead of createdAt to avoid datetime issues
        include: {
          _count: {
            select: { workers: true }
          }
        }
      }),
      prisma.jobType.count({ where })
    ])

    // Transform data for frontend
    const transformedJobTypes = jobTypes.map(jobType => {
      // Safely handle datetime fields
      const safeDate = (date: any) => {
        try {
          if (!date) return new Date().toISOString()
          const d = new Date(date)
          return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
        } catch {
          return new Date().toISOString()
        }
      }

      return {
        id: jobType.id,
        jobCode: jobType.jobCode,
        jobName: jobType.jobName,
        description: jobType.description,
        category: jobType.category,
        baseDailyRate: Number(jobType.baseDailyRate),
        overtimeMultiplier: Number(jobType.overtimeMultiplier),
        isActive: jobType.isActive,
        workers: jobType._count.workers,
        createdAt: safeDate(jobType.createdAt),
        updatedAt: safeDate(jobType.updatedAt)
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedJobTypes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching job types:", error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch job types",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// POST /api/job-types - Create a new job type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = createJobTypeSchema.parse(body)
    
    // Check if job code already exists
    const existingJobType = await prisma.jobType.findUnique({
      where: { jobCode: validatedData.jobCode }
    })
    
    if (existingJobType) {
      return NextResponse.json(
        { success: false, error: "Job code already exists" },
        { status: 400 }
      )
    }
    
    // Create new job type
    const newJobType = await prisma.jobType.create({
      data: validatedData,
      include: {
        _count: {
          select: { workers: true }
        }
      }
    })
    
    // Transform data for frontend
    const transformedJobType = {
      id: newJobType.id,
      jobCode: newJobType.jobCode,
      jobName: newJobType.jobName,
      description: newJobType.description,
      category: newJobType.category,
      baseDailyRate: Number(newJobType.baseDailyRate),
      overtimeMultiplier: Number(newJobType.overtimeMultiplier),
      isActive: newJobType.isActive,
      workers: newJobType._count.workers,
      createdAt: newJobType.createdAt,
      updatedAt: newJobType.updatedAt
    }
    
    return NextResponse.json({
      success: true,
      data: transformedJobType,
      message: "Job type created successfully"
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating job type:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to create job type" },
      { status: 500 }
    )
  }
}
