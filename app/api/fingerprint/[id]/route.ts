import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { 
  updateFingerprintTemplateSchema,
  getFingerprintTemplateByIdSchema,
  deleteFingerprintTemplateSchema
} from "@/app/api/validation/fingerprint"

// GET /api/fingerprint/[id] - Get fingerprint template by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const validatedParams = getFingerprintTemplateByIdSchema.parse({ id: idParam })
    const { id } = validatedParams
    
    const template = await prisma.fingerprintTemplate.findUnique({
      where: { id },
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
            scanTimestamp: true,
            device: {
              select: {
                id: true,
                deviceName: true,
                deviceId: true
              }
            }
          },
          orderBy: { scanTimestamp: 'desc' },
          take: 10
        }
      }
    })
    
    if (!template) {
      return NextResponse.json({
        success: false,
        error: "Fingerprint template not found"
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: template
    })
    
  } catch (error: any) {
    console.error("Error fetching fingerprint template:", error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid template ID",
        details: error.errors.map((err: any) => err.message).join(", ")
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch fingerprint template"
    }, { status: 500 })
  }
}

// PUT /api/fingerprint/[id] - Update fingerprint template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const body = await request.json()
    
    const validatedParams = getFingerprintTemplateByIdSchema.parse({ id: idParam })
    const { id } = validatedParams
    
    const validatedData = updateFingerprintTemplateSchema.parse({ id, ...body })
    
    // Check if template exists
    const existingTemplate = await prisma.fingerprintTemplate.findUnique({
      where: { id }
    })
    
    if (!existingTemplate) {
      return NextResponse.json({
        success: false,
        error: "Fingerprint template not found"
      }, { status: 404 })
    }
    
    // Update template
    const updatedTemplate = await prisma.fingerprintTemplate.update({
      where: { id },
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
      data: updatedTemplate,
      message: "Fingerprint template updated successfully"
    })
    
  } catch (error: any) {
    console.error("Error updating fingerprint template:", error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid input data",
        details: error.errors.map((err: any) => err.message).join(", ")
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to update fingerprint template"
    }, { status: 500 })
  }
}

// DELETE /api/fingerprint/[id] - Delete fingerprint template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const validatedParams = deleteFingerprintTemplateSchema.parse({ id: idParam })
    const { id } = validatedParams
    
    // Check if template exists
    const existingTemplate = await prisma.fingerprintTemplate.findUnique({
      where: { id }
    })
    
    if (!existingTemplate) {
      return NextResponse.json({
        success: false,
        error: "Fingerprint template not found"
      }, { status: 404 })
    }
    
    // Check if template has associated logs
    const logCount = await prisma.fingerprintLog.count({
      where: { matchedTemplateId: id }
    })
    
    if (logCount > 0) {
      return NextResponse.json({
        success: false,
        error: "Cannot delete template with associated logs. Consider deactivating instead."
      }, { status: 400 })
    }
    
    // Delete template
    await prisma.fingerprintTemplate.delete({
      where: { id }
    })
    
    return NextResponse.json({
      success: true,
      message: "Fingerprint template deleted successfully"
    })
    
  } catch (error: any) {
    console.error("Error deleting fingerprint template:", error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid template ID",
        details: error.errors.map((err: any) => err.message).join(", ")
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to delete fingerprint template"
    }, { status: 500 })
  }
}

