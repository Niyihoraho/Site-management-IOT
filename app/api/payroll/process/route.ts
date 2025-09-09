import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schemas
const processPayrollSchema = z.object({
  payrollRecordIds: z.array(z.number().int().positive()),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CASH', 'MOBILE_MONEY', 'AIRTEL_MONEY', 'CHECK']),
  paymentReference: z.string().optional(),
  processedBy: z.string().optional()
})

// POST /api/payroll/process - Process payments for multiple payroll records
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = processPayrollSchema.parse(body)

    const { payrollRecordIds, paymentMethod, paymentReference, processedBy } = validatedData

    // Get payroll records
    const payrollRecords = await prisma.payrollRecord.findMany({
      where: {
        id: { in: payrollRecordIds },
        paymentStatus: { in: ['CALCULATED', 'APPROVED'] }
      },
      include: {
        worker: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            preferredPaymentMethod: true,
            bankAccount: true,
            mobileMoneyNumber: true,
            airtelMoneyNumber: true
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

    if (payrollRecords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid payroll records found for processing' },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    for (const record of payrollRecords) {
      try {
        // Update payroll record to PAID status
        const updatedRecord = await prisma.payrollRecord.update({
          where: { id: record.id },
          data: {
            paymentStatus: 'PAID',
            paymentMethod,
            paymentDate: new Date(),
            paymentReference: paymentReference || `PAY-${record.id}-${Date.now()}`
          }
        })

        results.push({
          payrollRecordId: record.id,
          workerName: `${record.worker.firstName} ${record.worker.lastName}`,
          employeeId: record.worker.employeeId,
          siteName: record.site.siteName,
          netPay: record.netPay,
          paymentMethod,
          paymentReference: updatedRecord.paymentReference,
          paymentDate: updatedRecord.paymentDate
        })
      } catch (error) {
        console.error(`Error processing payment for payroll record ${record.id}:`, error)
        errors.push({
          payrollRecordId: record.id,
          workerName: `${record.worker.firstName} ${record.worker.lastName}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Calculate summary
    const totalRecords = payrollRecordIds.length
    const successfulPayments = results.length
    const failedPayments = errors.length
    const totalAmount = results.reduce((sum, result) => sum + Number(result.netPay), 0)

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRecords,
          successfulPayments,
          failedPayments,
          totalAmount,
          paymentMethod,
          processedBy: processedBy || 'SYSTEM'
        },
        results,
        errors
      },
      message: `Payment processing completed. ${successfulPayments} successful, ${failedPayments} failed.`
    })
  } catch (error) {
    console.error('Error processing payroll payments:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to process payroll payments' },
      { status: 500 }
    )
  }
}
