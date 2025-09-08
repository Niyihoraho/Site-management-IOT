import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/lib/generated/prisma"
import { 
  updateAttendanceRecordSchema,
  getAttendanceRecordByIdSchema,
  deleteAttendanceRecordSchema,
  type UpdateAttendanceRecordInput,
  type GetAttendanceRecordByIdQuery,
  type DeleteAttendanceRecordQuery
} from "@/app/api/validation/attendance"

const prisma = new PrismaClient()

// GET /api/attendance/[id] - Get attendance record by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const validatedParams = getAttendanceRecordByIdSchema.parse({ id: resolvedParams.id })
    
    const attendanceRecord = await prisma.attendanceRecord.findUnique({
      where: { id: validatedParams.id },
      include: {
        worker: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            status: true,
            phone: true,
            email: true
          }
        },
        site: {
          select: {
            id: true,
            siteName: true,
            siteCode: true,
            workingHoursStart: true,
            workingHoursEnd: true,
            standardHoursPerDay: true
          }
        },
        fingerprintLogs: {
          select: {
            id: true,
            matchResult: true,
            matchScore: true,
            scanQuality: true,
            scanTimestamp: true,
            errorMessage: true,
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
          },
          orderBy: { scanTimestamp: 'desc' }
        }
      }
    })
    
    if (!attendanceRecord) {
      return NextResponse.json({
        success: false,
        error: "Attendance record not found"
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: attendanceRecord
    })
    
  } catch (error) {
    console.error("Error fetching attendance record:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid ID parameter",
        details: error.message
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch attendance record"
    }, { status: 500 })
  }
}

// PUT /api/attendance/[id] - Update attendance record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const resolvedParams = await params
    const validatedParams = getAttendanceRecordByIdSchema.parse({ id: resolvedParams.id })
    const validatedData = updateAttendanceRecordSchema.parse({ 
      id: validatedParams.id, 
      ...body 
    })
    
    // Check if attendance record exists
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: { id: validatedParams.id }
    })
    
    if (!existingRecord) {
      return NextResponse.json({
        success: false,
        error: "Attendance record not found"
      }, { status: 404 })
    }
    
    // Update attendance record
    const updatedRecord = await prisma.attendanceRecord.update({
      where: { id: validatedParams.id },
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
    })
    
    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: "Attendance record updated successfully"
    })
    
  } catch (error) {
    console.error("Error updating attendance record:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid input data",
        details: error.message
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to update attendance record"
    }, { status: 500 })
  }
}

// DELETE /api/attendance/[id] - Delete attendance record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const validatedParams = deleteAttendanceRecordSchema.parse({ id: resolvedParams.id })
    
    // Check if attendance record exists
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: { id: validatedParams.id }
    })
    
    if (!existingRecord) {
      return NextResponse.json({
        success: false,
        error: "Attendance record not found"
      }, { status: 404 })
    }
    
    // Delete attendance record (fingerprint logs will be cascade deleted)
    await prisma.attendanceRecord.delete({
      where: { id: validatedParams.id }
    })
    
    return NextResponse.json({
      success: true,
      message: "Attendance record deleted successfully"
    })
    
  } catch (error) {
    console.error("Error deleting attendance record:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid ID parameter",
        details: error.message
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to delete attendance record"
    }, { status: 500 })
  }
}
