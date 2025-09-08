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

// GET /api/attendance/manual/[id] - Get manual attendance record by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const validatedParams = getAttendanceRecordByIdSchema.parse({ id: resolvedParams.id })
    
    const attendanceRecord = await prisma.attendanceRecord.findUnique({
      where: { 
        id: validatedParams.id,
        checkOutMethod: 'MANUAL',
        fingerprintVerified: false
      },
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
        }
      }
    })
    
    if (!attendanceRecord) {
      return NextResponse.json({
        success: false,
        error: "Manual attendance record not found"
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: attendanceRecord
    })
    
  } catch (error) {
    console.error("Error fetching manual attendance record:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid ID parameter",
        details: error.message
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch manual attendance record"
    }, { status: 500 })
  }
}

// PUT /api/attendance/manual/[id] - Update manual attendance record
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
    
    // Check if manual attendance record exists
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: { 
        id: validatedParams.id,
        checkOutMethod: 'MANUAL',
        fingerprintVerified: false
      }
    })
    
    if (!existingRecord) {
      return NextResponse.json({
        success: false,
        error: "Manual attendance record not found"
      }, { status: 404 })
    }
    
    // Update manual attendance record
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
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: "Manual attendance record updated successfully"
    })
    
  } catch (error) {
    console.error("Error updating manual attendance record:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid input data",
        details: error.message
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to update manual attendance record"
    }, { status: 500 })
  }
}

// DELETE /api/attendance/manual/[id] - Delete manual attendance record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const validatedParams = deleteAttendanceRecordSchema.parse({ id: resolvedParams.id })
    
    // Check if manual attendance record exists
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: { 
        id: validatedParams.id,
        checkOutMethod: 'MANUAL',
        fingerprintVerified: false
      }
    })
    
    if (!existingRecord) {
      return NextResponse.json({
        success: false,
        error: "Manual attendance record not found"
      }, { status: 404 })
    }
    
    // Delete manual attendance record
    await prisma.attendanceRecord.delete({
      where: { id: validatedParams.id }
    })
    
    return NextResponse.json({
      success: true,
      message: "Manual attendance record deleted successfully"
    })
    
  } catch (error) {
    console.error("Error deleting manual attendance record:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid ID parameter",
        details: error.message
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to delete manual attendance record"
    }, { status: 500 })
  }
}
