import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schemas
const calculatePayrollSchema = z.object({
  siteId: z.number().int().positive().optional().nullable(),
  payPeriodStart: z.string().refine((val) => {
    // Accept both date (YYYY-MM-DD) and datetime (ISO) formats
    const date = new Date(val)
    return !isNaN(date.getTime())
  }, "Invalid date format"),
  payPeriodEnd: z.string().refine((val) => {
    // Accept both date (YYYY-MM-DD) and datetime (ISO) formats
    const date = new Date(val)
    return !isNaN(date.getTime())
  }, "Invalid date format"),
  payPeriodType: z.enum(['WEEKLY', 'BI_WEEKLY', 'MONTHLY']),
  calculatedBy: z.string().optional()
})

// POST /api/payroll/calculate - Calculate payroll for all workers or specific site
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = calculatePayrollSchema.parse(body)

    const { siteId, payPeriodStart, payPeriodEnd, payPeriodType, calculatedBy } = validatedData
    
    // Convert date strings to proper datetime format
    const startDate = new Date(payPeriodStart)
    const endDate = new Date(payPeriodEnd)
    
    // Set end date to end of day to include the full day
    endDate.setHours(23, 59, 59, 999)

    // Build where clause for workers
    const workerWhere: any = { status: 'ACTIVE' }
    if (siteId) {
      workerWhere.assignedSiteId = siteId
    }

    // Get all active workers
    const workers = await prisma.worker.findMany({
      where: workerWhere,
      include: {
        assignedSite: {
          select: {
            id: true,
            siteCode: true,
            siteName: true
          }
        },
        jobType: {
          select: {
            id: true,
            jobCode: true,
            jobName: true,
            baseDailyRate: true,
            overtimeMultiplier: true
          }
        }
      }
    })

    const results = []
    const errors = []

    for (const worker of workers) {
      try {
        // Check if payroll record already exists for this period
        const existingRecord = await prisma.payrollRecord.findUnique({
          where: {
            workerId_siteId_payPeriodStart: {
              workerId: worker.id,
              siteId: worker.assignedSiteId,
              payPeriodStart: startDate
            }
          }
        })

        if (existingRecord) {
          errors.push({
            workerId: worker.id,
            workerName: `${worker.firstName} ${worker.lastName}`,
            error: 'Payroll record already exists for this period'
          })
          continue
        }

        // Get attendance records for this worker and period
        const attendanceRecords = await prisma.attendanceRecord.findMany({
          where: {
            workerId: worker.id,
            siteId: worker.assignedSiteId,
            attendanceDate: {
              gte: startDate,
              lte: endDate
            },
            status: { in: ['PRESENT', 'LATE', 'OVERTIME'] }
          },
          orderBy: { attendanceDate: 'asc' }
        })

        // Get site-specific job rate (with error handling)
        let siteJobRate = null
        try {
          siteJobRate = await prisma.siteJobRate.findUnique({
            where: {
              siteId_jobTypeId: {
                siteId: worker.assignedSiteId,
                jobTypeId: worker.jobTypeId
              }
            }
          })
        } catch (error) {
          console.warn(`Could not fetch site job rate for site ${worker.assignedSiteId}, job type ${worker.jobTypeId}:`, error)
          // Continue with base job type rate
        }

        const dailyRate = siteJobRate?.siteSpecificRate || worker.jobType.baseDailyRate
        const overtimeMultiplier = worker.jobType.overtimeMultiplier

        // Calculate totals
        const totalDaysWorked = attendanceRecords.length
        const totalHours = attendanceRecords.reduce((sum, record) => sum + Number(record.totalHours || 0), 0)
        const regularHours = attendanceRecords.reduce((sum, record) => sum + Number(record.regularHours || 0), 0)
        const overtimeHours = attendanceRecords.reduce((sum, record) => sum + Number(record.overtimeHours || 0), 0)

        const regularPay = totalDaysWorked * Number(dailyRate)
        const overtimePay = Number(overtimeHours) * Number(dailyRate) * Number(overtimeMultiplier)
        const grossPay = regularPay + overtimePay
        const netPay = grossPay // No deductions for now

        // Create payroll record
        const payrollRecord = await prisma.payrollRecord.create({
          data: {
            workerId: worker.id,
            siteId: worker.assignedSiteId,
            payPeriodStart: startDate,
            payPeriodEnd: endDate,
            payPeriodType,
            totalDaysWorked,
            totalHours,
            regularHours,
            overtimeHours,
            dailyRate,
            regularPay,
            overtimePay,
            grossPay,
            netPay,
            calculatedBy: calculatedBy || 'SYSTEM'
          },
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
                siteCode: true,
                siteName: true
              }
            }
          }
        })

        results.push({
          workerId: worker.id,
          workerName: `${worker.firstName} ${worker.lastName}`,
          employeeId: worker.employeeId,
          siteName: worker.assignedSite.siteName,
          totalDaysWorked,
          totalHours,
          regularPay,
          overtimePay,
          grossPay,
          netPay,
          payrollRecordId: payrollRecord.id
        })
      } catch (error) {
        console.error(`Error calculating payroll for worker ${worker.id}:`, error)
        errors.push({
          workerId: worker.id,
          workerName: `${worker.firstName} ${worker.lastName}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Calculate summary
    const totalWorkers = workers.length
    const successfulCalculations = results.length
    const failedCalculations = errors.length
    const totalGrossPay = results.reduce((sum, result) => sum + result.grossPay, 0)
    const totalNetPay = results.reduce((sum, result) => sum + result.netPay, 0)

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalWorkers,
          successfulCalculations,
          failedCalculations,
          totalGrossPay,
          totalNetPay,
          payPeriod: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
          payPeriodType
        },
        results,
        errors
      },
      message: `Payroll calculation completed. ${successfulCalculations} successful, ${failedCalculations} failed.`
    })
  } catch (error) {
    console.error('Error calculating payroll:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to calculate payroll' },
      { status: 500 }
    )
  }
}
