import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schemas
const updatePayrollSchema = z.object({
  paymentStatus: z.enum(['PENDING', 'CALCULATED', 'APPROVED', 'PAID', 'CANCELLED']).optional(),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CASH', 'MOBILE_MONEY', 'AIRTEL_MONEY', 'CHECK']).optional(),
  paymentDate: z.string().datetime().optional(),
  paymentReference: z.string().optional(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().datetime().optional()
})

// GET /api/payroll/[id] - Get specific payroll record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payroll record ID' },
        { status: 400 }
      )
    }

    const payrollRecord = await prisma.payrollRecord.findUnique({
      where: { id },
      include: {
        worker: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            status: true,
            phone: true,
            email: true,
            preferredPaymentMethod: true,
            bankAccount: true,
            bankName: true,
            mobileMoneyNumber: true,
            mobileMoneyProvider: true,
            airtelMoneyNumber: true,
            airtelMoneyProvider: true
          }
        },
        site: {
          select: {
            id: true,
            siteCode: true,
            siteName: true,
            province: true,
            district: true
          }
        }
      }
    })

    if (!payrollRecord) {
      return NextResponse.json(
        { success: false, error: 'Payroll record not found' },
        { status: 404 }
      )
    }

    // Get attendance records for this payroll period
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        workerId: payrollRecord.workerId,
        siteId: payrollRecord.siteId,
        attendanceDate: {
          gte: payrollRecord.payPeriodStart,
          lte: payrollRecord.payPeriodEnd
        }
      },
      orderBy: { attendanceDate: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...payrollRecord,
        attendanceRecords
      }
    })
  } catch (error) {
    console.error('Error fetching payroll record:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payroll record' },
      { status: 500 }
    )
  }
}

// PUT /api/payroll/[id] - Update payroll record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payroll record ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updatePayrollSchema.parse(body)

    // Check if payroll record exists
    const existingRecord = await prisma.payrollRecord.findUnique({
      where: { id }
    })

    if (!existingRecord) {
      return NextResponse.json(
        { success: false, error: 'Payroll record not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = { ...validatedData }
    
    // Convert date strings to Date objects
    if (validatedData.paymentDate) {
      updateData.paymentDate = new Date(validatedData.paymentDate)
    }
    if (validatedData.approvedAt) {
      updateData.approvedAt = new Date(validatedData.approvedAt)
    }

    // Update payroll record
    const updatedRecord = await prisma.payrollRecord.update({
      where: { id },
      data: updateData,
      include: {
        worker: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            status: true,
            preferredPaymentMethod: true
          }
        },
        site: {
          select: {
            id: true,
            siteCode: true,
            siteName: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: 'Payroll record updated successfully'
    })
  } catch (error) {
    console.error('Error updating payroll record:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update payroll record' },
      { status: 500 }
    )
  }
}

// DELETE /api/payroll/[id] - Delete payroll record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payroll record ID' },
        { status: 400 }
      )
    }

    // Check if payroll record exists
    const existingRecord = await prisma.payrollRecord.findUnique({
      where: { id }
    })

    if (!existingRecord) {
      return NextResponse.json(
        { success: false, error: 'Payroll record not found' },
        { status: 404 }
      )
    }

    // Check if record is already paid
    if (existingRecord.paymentStatus === 'PAID') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete paid payroll record' },
        { status: 400 }
      )
    }

    // Delete payroll record
    await prisma.payrollRecord.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Payroll record deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting payroll record:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete payroll record' },
      { status: 500 }
    )
  }
}
