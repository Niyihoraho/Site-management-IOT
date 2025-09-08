import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createWorkerSchema, getWorkersQuerySchema } from "@/app/api/validation/worker"

// GET /api/workers - List workers with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const validatedQuery = getWorkersQuerySchema.parse(queryParams)
    const { page, limit, status, jobTypeId, siteId, search } = validatedQuery
    
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (jobTypeId) {
      where.jobTypeId = jobTypeId
    }
    
    if (siteId) {
      where.assignedSiteId = siteId
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    // Get workers with site and job type information
    const [workers, total] = await Promise.all([
      prisma.worker.findMany({
        where,
        skip,
        take: limit,
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
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.worker.count({ where })
    ])
    
    // Transform the data to match frontend expectations
    const transformedWorkers = workers.map(worker => ({
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
    }))
    
    return NextResponse.json({
      success: true,
      data: transformedWorkers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
    
  } catch (error: any) {
    console.error("Error fetching workers:", error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid query parameters",
        details: error.errors.map((err: any) => err.message).join(", ")
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch workers"
    }, { status: 500 })
  }
}

// POST /api/workers - Create a new worker
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validatedData = createWorkerSchema.parse(body)
    
    // Check if employee ID already exists
    const existingWorker = await prisma.worker.findUnique({
      where: { employeeId: validatedData.employeeId }
    })
    
    if (existingWorker) {
      return NextResponse.json({
        success: false,
        error: "Employee ID already exists"
      }, { status: 400 })
    }
    
    // Check if national ID already exists (if provided)
    if (validatedData.nationalId) {
      const existingNationalId = await prisma.worker.findUnique({
        where: { nationalId: validatedData.nationalId }
      })
      
      if (existingNationalId) {
        return NextResponse.json({
          success: false,
          error: "National ID already exists"
        }, { status: 400 })
      }
    }
    
    // Verify site exists
    const site = await prisma.constructionSite.findUnique({
      where: { id: validatedData.assignedSiteId }
    })
    
    if (!site) {
      return NextResponse.json({
        success: false,
        error: "Site not found"
      }, { status: 400 })
    }
    
    // Verify job type exists
    const jobType = await prisma.jobType.findUnique({
      where: { id: validatedData.jobTypeId }
    })
    
    if (!jobType) {
      return NextResponse.json({
        success: false,
        error: "Job type not found"
      }, { status: 400 })
    }
    
    // Create worker
    const worker = await prisma.worker.create({
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
    }, { status: 201 })
    
  } catch (error: any) {
    console.error("Error creating worker:", error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid worker data",
        details: error.errors.map((err: any) => err.message).join(", ")
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to create worker"
    }, { status: 500 })
  }
}

