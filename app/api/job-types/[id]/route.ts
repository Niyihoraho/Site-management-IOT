import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateJobTypeSchema, getJobTypeByIdSchema, deleteJobTypeSchema } from "@/app/api/validation/job-type"

// GET /api/job-types/[id] - Get job type by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    
    // Validate ID
    const validatedId = getJobTypeByIdSchema.parse({ id })
    
    const jobType = await prisma.jobType.findUnique({
      where: { id: validatedId.id },
      include: {
        _count: {
          select: { workers: true }
        }
      }
    })
    
    if (!jobType) {
      return NextResponse.json(
        { success: false, error: "Job type not found" },
        { status: 404 }
      )
    }
    
    // Transform data for frontend
    const transformedJobType = {
      id: jobType.id,
      jobCode: jobType.jobCode,
      jobName: jobType.jobName,
      description: jobType.description,
      category: jobType.category,
      baseDailyRate: Number(jobType.baseDailyRate),
      overtimeMultiplier: Number(jobType.overtimeMultiplier),
      isActive: jobType.isActive,
      workers: jobType._count.workers,
      createdAt: jobType.createdAt,
      updatedAt: jobType.updatedAt
    }
    
    return NextResponse.json({
      success: true,
      data: transformedJobType
    })
  } catch (error) {
    console.error("Error fetching job type:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: "Invalid job type ID" },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to fetch job type" },
      { status: 500 }
    )
  }
}

// PUT /api/job-types/[id] - Update job type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    const body = await request.json()
    
    // Validate ID and request body
    const validatedId = getJobTypeByIdSchema.parse({ id })
    const validatedData = updateJobTypeSchema.parse({ id: validatedId.id, ...body })
    
    // Check if job type exists
    const existingJobType = await prisma.jobType.findUnique({
      where: { id: validatedId.id }
    })
    
    if (!existingJobType) {
      return NextResponse.json(
        { success: false, error: "Job type not found" },
        { status: 404 }
      )
    }
    
    // Check if job code already exists (if being updated)
    if (validatedData.jobCode && validatedData.jobCode !== existingJobType.jobCode) {
      const duplicateJobType = await prisma.jobType.findUnique({
        where: { jobCode: validatedData.jobCode }
      })
      
      if (duplicateJobType) {
        return NextResponse.json(
          { success: false, error: "Job code already exists" },
          { status: 400 }
        )
      }
    }
    
    // Update job type
    const updatedJobType = await prisma.jobType.update({
      where: { id: validatedId.id },
      data: validatedData,
      include: {
        _count: {
          select: { workers: true }
        }
      }
    })
    
    // Transform data for frontend
    const transformedJobType = {
      id: updatedJobType.id,
      jobCode: updatedJobType.jobCode,
      jobName: updatedJobType.jobName,
      description: updatedJobType.description,
      category: updatedJobType.category,
      baseDailyRate: Number(updatedJobType.baseDailyRate),
      overtimeMultiplier: Number(updatedJobType.overtimeMultiplier),
      isActive: updatedJobType.isActive,
      workers: updatedJobType._count.workers,
      createdAt: updatedJobType.createdAt,
      updatedAt: updatedJobType.updatedAt
    }
    
    return NextResponse.json({
      success: true,
      data: transformedJobType,
      message: "Job type updated successfully"
    })
  } catch (error) {
    console.error("Error updating job type:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to update job type" },
      { status: 500 }
    )
  }
}

// DELETE /api/job-types/[id] - Delete job type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    
    // Validate ID
    const validatedId = deleteJobTypeSchema.parse({ id })
    
    // Check if job type exists
    const existingJobType = await prisma.jobType.findUnique({
      where: { id: validatedId.id },
      include: {
        _count: {
          select: { workers: true }
        }
      }
    })
    
    if (!existingJobType) {
      return NextResponse.json(
        { success: false, error: "Job type not found" },
        { status: 404 }
      )
    }
    
    // Check if job type has associated workers
    if (existingJobType._count.workers > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete job type with associated workers" },
        { status: 400 }
      )
    }
    
    // Delete job type
    await prisma.jobType.delete({
      where: { id: validatedId.id }
    })
    
    return NextResponse.json({
      success: true,
      message: "Job type deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting job type:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: "Invalid job type ID" },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to delete job type" },
      { status: 500 }
    )
  }
}
