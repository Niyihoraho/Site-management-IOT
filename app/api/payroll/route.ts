import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schemas
const createPayrollSchema = z.object({
  workerId: z.number().int().positive(),
  siteId: z.number().int().positive(),
  payPeriodStart: z.string().datetime(),
  payPeriodEnd: z.string().datetime(),
  payPeriodType: z.enum(['WEEKLY', 'BI_WEEKLY', 'MONTHLY']),
  calculatedBy: z.string().optional()
})

const updatePayrollSchema = z.object({
  paymentStatus: z.enum(['PENDING', 'CALCULATED', 'APPROVED', 'PAID', 'CANCELLED']).optional(),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CASH', 'MOBILE_MONEY', 'AIRTEL_MONEY', 'CHECK']).optional(),
  paymentDate: z.string().datetime().optional(),
  paymentReference: z.string().optional(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().datetime().optional()
})

// GET /api/payroll - List payroll records with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const siteId = searchParams.get('siteId')
    const workerId = searchParams.get('workerId')
    const status = searchParams.get('status')
    const payPeriodType = searchParams.get('payPeriodType')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (siteId) where.siteId = parseInt(siteId)
    if (workerId) where.workerId = parseInt(workerId)
    if (status) where.paymentStatus = status
    if (payPeriodType) where.payPeriodType = payPeriodType
    
    if (dateFrom || dateTo) {
      where.payPeriodStart = {}
      if (dateFrom) where.payPeriodStart.gte = new Date(dateFrom)
      if (dateTo) where.payPeriodStart.lte = new Date(dateTo)
    }

    if (search) {
      where.OR = [
        { worker: { firstName: { contains: search, mode: 'insensitive' } } },
        { worker: { lastName: { contains: search, mode: 'insensitive' } } },
        { worker: { employeeId: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Get payroll records with related data
    const [payrollRecords, total] = await Promise.all([
      prisma.payrollRecord.findMany({
        where,
        include: {
          worker: {
            select: {
              id: true,
              employeeId: true,
              firstName: true,
              lastName: true,
              status: true,
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
        },
        orderBy: { payPeriodStart: 'desc' },
        skip,
        take: limit
      }),
      prisma.payrollRecord.count({ where })
    ])

    // Calculate summary statistics
    const summary = await prisma.payrollRecord.aggregate({
      where,
      _sum: {
        totalDaysWorked: true,
        totalHours: true,
        regularHours: true,
        overtimeHours: true,
        regularPay: true,
        overtimePay: true,
        grossPay: true,
        netPay: true
      },
      _avg: {
        dailyRate: true
      }
    })

    const statusCounts = await prisma.payrollRecord.groupBy({
      by: ['paymentStatus'],
      where,
      _count: { id: true },
      _sum: { netPay: true }
    })

    return NextResponse.json({
      success: true,
      data: payrollRecords,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      summary: {
        totalRecords: total,
        totalDaysWorked: summary._sum.totalDaysWorked || 0,
        totalHours: summary._sum.totalHours || 0,
        totalRegularHours: summary._sum.regularHours || 0,
        totalOvertimeHours: summary._sum.overtimeHours || 0,
        totalRegularPay: summary._sum.regularPay || 0,
        totalOvertimePay: summary._sum.overtimePay || 0,
        totalGrossPay: summary._sum.grossPay || 0,
        totalNetPay: summary._sum.netPay || 0,
        averageDailyRate: summary._avg.dailyRate || 0
      },
      statusBreakdown: statusCounts.map(item => ({
        status: item.paymentStatus,
        count: item._count.id,
        totalAmount: item._sum.netPay || 0
      }))
    })
  } catch (error) {
    console.error('Error fetching payroll records:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payroll records' },
      { status: 500 }
    )
  }
}

// POST /api/payroll - Create new payroll record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createPayrollSchema.parse(body)

    // Check if worker and site exist
    const [worker, site] = await Promise.all([
      prisma.worker.findUnique({ where: { id: validatedData.workerId } }),
      prisma.constructionSite.findUnique({ where: { id: validatedData.siteId } })
    ])

    if (!worker) {
      return NextResponse.json(
        { success: false, error: 'Worker not found' },
        { status: 404 }
      )
    }

    if (!site) {
      return NextResponse.json(
        { success: false, error: 'Site not found' },
        { status: 404 }
      )
    }

    // Check for existing payroll record for the same period
    const existingRecord = await prisma.payrollRecord.findUnique({
      where: {
        workerId_siteId_payPeriodStart: {
          workerId: validatedData.workerId,
          siteId: validatedData.siteId,
          payPeriodStart: new Date(validatedData.payPeriodStart)
        }
      }
    })

    if (existingRecord) {
      return NextResponse.json(
        { success: false, error: 'Payroll record already exists for this period' },
        { status: 409 }
      )
    }

    // Calculate payroll based on attendance records
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        workerId: validatedData.workerId,
        siteId: validatedData.siteId,
        attendanceDate: {
          gte: new Date(validatedData.payPeriodStart),
          lte: new Date(validatedData.payPeriodEnd)
        },
        status: { in: ['PRESENT', 'LATE', 'OVERTIME'] }
      },
      orderBy: { attendanceDate: 'asc' }
    })

    // Get worker's daily rate from site-specific job rate (with error handling)
    let siteJobRate = null
    try {
      siteJobRate = await prisma.siteJobRate.findUnique({
        where: {
          siteId_jobTypeId: {
            siteId: validatedData.siteId,
            jobTypeId: worker.jobTypeId
          }
        },
        include: { jobType: true }
      })
    } catch (error) {
      console.warn(`Could not fetch site job rate for site ${validatedData.siteId}, job type ${worker.jobTypeId}:`, error)
      // Continue with base job type rate
    }

    const dailyRate = siteJobRate?.siteSpecificRate || worker.jobType?.baseDailyRate || 0
    const overtimeMultiplier = siteJobRate?.jobType?.overtimeMultiplier || worker.jobType?.overtimeMultiplier || 1.5

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
        workerId: validatedData.workerId,
        siteId: validatedData.siteId,
        payPeriodStart: new Date(validatedData.payPeriodStart),
        payPeriodEnd: new Date(validatedData.payPeriodEnd),
        payPeriodType: validatedData.payPeriodType,
        totalDaysWorked,
        totalHours,
        regularHours,
        overtimeHours,
        dailyRate,
        regularPay,
        overtimePay,
        grossPay,
        netPay,
        calculatedBy: validatedData.calculatedBy || 'SYSTEM'
      },
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
      data: payrollRecord,
      message: 'Payroll record created successfully'
    })
  } catch (error) {
    console.error('Error creating payroll record:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create payroll record' },
      { status: 500 }
    )
  }
}
