import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { 
  updateFingerprintDeviceSchema,
  getFingerprintDeviceByIdSchema,
  deleteFingerprintDeviceSchema
} from "@/app/api/validation/fingerprint"

// GET /api/fingerprint/devices/[id] - Get fingerprint device by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const validatedParams = getFingerprintDeviceByIdSchema.parse({ id: idParam })
    const { id } = validatedParams
    
    const device = await prisma.fingerprintDevice.findUnique({
      where: { id },
      include: {
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
            scanTimestamp: true,
            workerId: true
          },
          orderBy: { scanTimestamp: 'desc' },
          take: 10
        },
        _count: {
          select: {
            fingerprintLogs: true
          }
        }
      }
    })
    
    if (!device) {
      return NextResponse.json({
        success: false,
        error: "Fingerprint device not found"
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: device
    })
    
  } catch (error: any) {
    console.error("Error fetching fingerprint device:", error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid device ID",
        details: error.errors.map((err: any) => err.message).join(", ")
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch fingerprint device"
    }, { status: 500 })
  }
}

// PUT /api/fingerprint/devices/[id] - Update fingerprint device
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const body = await request.json()
    
    const validatedParams = getFingerprintDeviceByIdSchema.parse({ id: idParam })
    const { id } = validatedParams
    
    const validatedData = updateFingerprintDeviceSchema.parse({ id, ...body })
    
    // Check if device exists
    const existingDevice = await prisma.fingerprintDevice.findUnique({
      where: { id }
    })
    
    if (!existingDevice) {
      return NextResponse.json({
        success: false,
        error: "Fingerprint device not found"
      }, { status: 404 })
    }
    
    // Check if device ID already exists (if being updated)
    if (validatedData.deviceName && validatedData.deviceName !== existingDevice.deviceName) {
      const duplicateDevice = await prisma.fingerprintDevice.findFirst({
        where: { 
          deviceName: validatedData.deviceName,
          id: { not: id }
        }
      })
      
      if (duplicateDevice) {
        return NextResponse.json({
          success: false,
          error: "Device name already exists"
        }, { status: 409 })
      }
    }
    
    // Check if serial number already exists (if being updated)
    if (validatedData.serialNumber && validatedData.serialNumber !== existingDevice.serialNumber) {
      const duplicateSerial = await prisma.fingerprintDevice.findFirst({
        where: { 
          serialNumber: validatedData.serialNumber,
          id: { not: id }
        }
      })
      
      if (duplicateSerial) {
        return NextResponse.json({
          success: false,
          error: "Serial number already exists"
        }, { status: 409 })
      }
    }
    
    // Verify site exists (if being updated)
    if (validatedData.siteId) {
      const site = await prisma.constructionSite.findUnique({
        where: { id: validatedData.siteId }
      })
      
      if (!site) {
        return NextResponse.json({
          success: false,
          error: "Site not found"
        }, { status: 404 })
      }
    }
    
    // Update device
    const updatedDevice = await prisma.fingerprintDevice.update({
      where: { id },
      data: validatedData,
      include: {
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
      data: updatedDevice,
      message: "Fingerprint device updated successfully"
    })
    
  } catch (error: any) {
    console.error("Error updating fingerprint device:", error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid input data",
        details: error.errors.map((err: any) => err.message).join(", ")
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to update fingerprint device"
    }, { status: 500 })
  }
}

// DELETE /api/fingerprint/devices/[id] - Delete fingerprint device
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const validatedParams = deleteFingerprintDeviceSchema.parse({ id: idParam })
    const { id } = validatedParams
    
    // Check if device exists
    const existingDevice = await prisma.fingerprintDevice.findUnique({
      where: { id }
    })
    
    if (!existingDevice) {
      return NextResponse.json({
        success: false,
        error: "Fingerprint device not found"
      }, { status: 404 })
    }
    
    // Check if device has associated logs
    const logCount = await prisma.fingerprintLog.count({
      where: { deviceId: id }
    })
    
    if (logCount > 0) {
      return NextResponse.json({
        success: false,
        error: "Cannot delete device with associated logs. Consider deactivating instead."
      }, { status: 400 })
    }
    
    // Delete device
    await prisma.fingerprintDevice.delete({
      where: { id }
    })
    
    return NextResponse.json({
      success: true,
      message: "Fingerprint device deleted successfully"
    })
    
  } catch (error: any) {
    console.error("Error deleting fingerprint device:", error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid device ID",
        details: error.errors.map((err: any) => err.message).join(", ")
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to delete fingerprint device"
    }, { status: 500 })
  }
}

