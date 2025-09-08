import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateWorkerSchema, getWorkerByIdSchema, deleteWorkerSchema } from "@/app/api/validation/worker"

// GET /api/workers/[id] - Get worker by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const validatedParams = getWorkerByIdSchema.parse({ id: idParam })
    const { id } = validatedParams
    
    const worker = await prisma.worker.findUnique({
      where: { id },
      include: {
        assignedSite: {
          select: {
            id: true,
            siteName: true,
            siteCode: true
          }
        },
        jobType: {
          select: {
            id: true,
            jobName: true,
            baseDailyRate: true,
            overtimeMultiplier: true
          }
        }
      }
    })
    
    if (!worker) {
      return NextResponse.json({
        success: false,
        error: "Worker not found"
      }, { status: 404 })
    }
    
    // Transform the response
    const transformedWorker = {
      id: worker.id,
      employeeId: worker.employeeId,
      firstName: worker.firstName,
      lastName: worker.lastName,
      phone: worker.phone,
      email: worker.email,
      nationalId: worker.nationalId,
      jobType: worker.jobType?.jobName || 'Unknown',
      jobTypeId: worker.jobTypeId,
      dailyRate: worker.jobType?.baseDailyRate ? Number(worker.jobType.baseDailyRate) : 0,
      overtimeRate: worker.jobType?.overtimeMultiplier ? Number(worker.jobType.overtimeMultiplier) : null,
      siteSpecificRate: null, // Will be looked up from SiteJobRate table if needed
      status: worker.status,
      bankAccount: worker.bankAccount,
      bankName: worker.bankName,
      mobileMoneyNumber: worker.mobileMoneyNumber,
      mobileMoneyProvider: worker.mobileMoneyProvider,
      airtelMoneyNumber: worker.airtelMoneyNumber,
      airtelMoneyProvider: worker.airtelMoneyProvider,
      preferredPaymentMethod: worker.preferredPaymentMethod,
      emergencyContactName: worker.emergencyContactName,
      emergencyContactPhone: worker.emergencyContactPhone,
      assignedSiteId: worker.assignedSiteId,
      site: worker.assignedSite ? {
        id: worker.assignedSite.id,
        siteName: worker.assignedSite.siteName,
        siteCode: worker.assignedSite.siteCode
      } : null,
      createdAt: worker.createdAt,
      updatedAt: worker.updatedAt
    }
    
    return NextResponse.json({
      success: true,
      data: transformedWorker
    })
    
  } catch (error: any) {
    console.error("Error fetching worker:", error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid worker ID",
        details: error.errors.map((err: any) => err.message).join(", ")
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch worker"
    }, { status: 500 })
  }
}

// PUT /api/workers/[id] - Update worker
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const body = await request.json()
    
    const validatedParams = getWorkerByIdSchema.parse({ id: idParam })
    const { id } = validatedParams
    
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: "Invalid worker ID"
      }, { status: 400 })
    }
    
    const validatedData = updateWorkerSchema.parse({ id, ...body })
    
    // Check if worker exists
    const existingWorker = await prisma.worker.findUnique({
      where: { id }
    })
    
    if (!existingWorker) {
      return NextResponse.json({
        success: false,
        error: "Worker not found"
      }, { status: 404 })
    }
    
    // Check if employee ID already exists (if being updated)
    if (validatedData.employeeId && validatedData.employeeId !== existingWorker.employeeId) {
      const duplicateEmployeeId = await prisma.worker.findUnique({
        where: { employeeId: validatedData.employeeId }
      })
      
      if (duplicateEmployeeId) {
        return NextResponse.json({
          success: false,
          error: "Employee ID already exists"
        }, { status: 400 })
      }
    }
    
    // Check if national ID already exists (if being updated)
    if (validatedData.nationalId && validatedData.nationalId !== existingWorker.nationalId) {
      const duplicateNationalId = await prisma.worker.findUnique({
        where: { nationalId: validatedData.nationalId }
      })
      
      if (duplicateNationalId) {
        return NextResponse.json({
          success: false,
          error: "National ID already exists"
        }, { status: 400 })
      }
    }
    
    // Verify site exists (if being updated)
    if (validatedData.assignedSiteId) {
      const site = await prisma.constructionSite.findUnique({
        where: { id: validatedData.assignedSiteId }
      })
      
      if (!site) {
        return NextResponse.json({
          success: false,
          error: "Site not found"
        }, { status: 400 })
      }
    }
    
    // Verify job type exists (if being updated)
    if (validatedData.jobTypeId) {
      const jobType = await prisma.jobType.findUnique({
        where: { id: validatedData.jobTypeId }
      })
      
      if (!jobType) {
        return NextResponse.json({
          success: false,
          error: "Job type not found"
        }, { status: 400 })
      }
    }
    
    // Update worker
    const updatedWorker = await prisma.worker.update({
      where: { id },
      data: validatedData,
      include: {
        assignedSite: {
          select: {
            id: true,
            siteName: true,
            siteCode: true
          }
        },
        jobType: {
          select: {
            id: true,
            jobName: true,
            baseDailyRate: true,
            overtimeMultiplier: true
          }
        }
      }
    })
    
    // Transform the response
    const transformedWorker = {
      id: updatedWorker.id,
      employeeId: updatedWorker.employeeId,
      firstName: updatedWorker.firstName,
      lastName: updatedWorker.lastName,
      phone: updatedWorker.phone,
      email: updatedWorker.email,
      nationalId: updatedWorker.nationalId,
      jobType: updatedWorker.jobType?.jobName || 'Unknown',
      jobTypeId: updatedWorker.jobTypeId,
      dailyRate: updatedWorker.jobType?.baseDailyRate ? Number(updatedWorker.jobType.baseDailyRate) : 0,
      overtimeRate: updatedWorker.jobType?.overtimeMultiplier ? Number(updatedWorker.jobType.overtimeMultiplier) : null,
      siteSpecificRate: null, // Will be looked up from SiteJobRate table if needed
      status: updatedWorker.status,
      bankAccount: updatedWorker.bankAccount,
      bankName: updatedWorker.bankName,
      mobileMoneyNumber: updatedWorker.mobileMoneyNumber,
      mobileMoneyProvider: updatedWorker.mobileMoneyProvider,
      airtelMoneyNumber: updatedWorker.airtelMoneyNumber,
      airtelMoneyProvider: updatedWorker.airtelMoneyProvider,
      preferredPaymentMethod: updatedWorker.preferredPaymentMethod,
      emergencyContactName: updatedWorker.emergencyContactName,
      emergencyContactPhone: updatedWorker.emergencyContactPhone,
      assignedSiteId: updatedWorker.assignedSiteId,
      site: updatedWorker.assignedSite ? {
        id: updatedWorker.assignedSite.id,
        siteName: updatedWorker.assignedSite.siteName,
        siteCode: updatedWorker.assignedSite.siteCode
      } : null,
      createdAt: updatedWorker.createdAt,
      updatedAt: updatedWorker.updatedAt
    }
    
    return NextResponse.json({
      success: true,
      data: transformedWorker
    })
    
  } catch (error: any) {
    console.error("Error updating worker:", error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid worker data",
        details: error.errors.map((err: any) => err.message).join(", ")
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to update worker"
    }, { status: 500 })
  }
}

// DELETE /api/workers/[id] - Delete worker
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const validatedParams = deleteWorkerSchema.parse({ id: idParam })
    const { id } = validatedParams
    
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: "Invalid worker ID"
      }, { status: 400 })
    }
    
    // Check if worker exists
    const existingWorker = await prisma.worker.findUnique({
      where: { id }
    })
    
    if (!existingWorker) {
      return NextResponse.json({
        success: false,
        error: "Worker not found"
      }, { status: 404 })
    }
    
    // Check if worker has attendance records
    const attendanceCount = await prisma.attendanceRecord.count({
      where: { workerId: id }
    })
    
    if (attendanceCount > 0) {
      return NextResponse.json({
        success: false,
        error: "Cannot delete worker with attendance records. Consider deactivating instead."
      }, { status: 400 })
    }
    
    // Check if worker has payroll records
    const payrollCount = await prisma.payrollRecord.count({
      where: { workerId: id }
    })
    
    if (payrollCount > 0) {
      return NextResponse.json({
        success: false,
        error: "Cannot delete worker with payroll records. Consider deactivating instead."
      }, { status: 400 })
    }
    
    // Delete worker
    await prisma.worker.delete({
      where: { id }
    })
    
    return NextResponse.json({
      success: true,
      message: "Worker deleted successfully"
    })
    
  } catch (error: any) {
    console.error("Error deleting worker:", error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid worker ID",
        details: error.errors.map((err: any) => err.message).join(", ")
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to delete worker"
    }, { status: 500 })
  }
}

