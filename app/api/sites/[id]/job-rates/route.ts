import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema
const createSiteJobRateSchema = z.object({
  jobTypeId: z.number().int().positive(),
  siteSpecificRate: z.number().positive()
})

// GET /api/sites/[id]/job-rates - Get job rates for a specific site
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const siteId = parseInt(resolvedParams.id)

    if (isNaN(siteId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid site ID' },
        { status: 400 }
      )
    }

    const siteJobRates = await prisma.siteJobRate.findMany({
      where: { siteId },
      include: {
        jobType: {
          select: {
            id: true,
            jobCode: true,
            jobName: true,
            baseDailyRate: true,
            overtimeMultiplier: true
          }
        }
      },
      orderBy: { jobType: { jobName: 'asc' } }
    })

    return NextResponse.json({
      success: true,
      data: siteJobRates
    })
  } catch (error) {
    console.error('Error fetching site job rates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch site job rates' },
      { status: 500 }
    )
  }
}

// POST /api/sites/[id]/job-rates - Create a new site job rate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const siteId = parseInt(resolvedParams.id)

    if (isNaN(siteId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid site ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = createSiteJobRateSchema.parse(body)

    // Check if site exists
    const site = await prisma.constructionSite.findUnique({
      where: { id: siteId }
    })

    if (!site) {
      return NextResponse.json(
        { success: false, error: 'Site not found' },
        { status: 404 }
      )
    }

    // Check if job type exists
    const jobType = await prisma.jobType.findUnique({
      where: { id: validatedData.jobTypeId }
    })

    if (!jobType) {
      return NextResponse.json(
        { success: false, error: 'Job type not found' },
        { status: 404 }
      )
    }

    // Check if site job rate already exists
    const existingRate = await prisma.siteJobRate.findUnique({
      where: {
        siteId_jobTypeId: {
          siteId,
          jobTypeId: validatedData.jobTypeId
        }
      }
    })

    if (existingRate) {
      return NextResponse.json(
        { success: false, error: 'Site job rate already exists for this job type' },
        { status: 409 }
      )
    }

    // Create site job rate
    const siteJobRate = await prisma.siteJobRate.create({
      data: {
        siteId,
        jobTypeId: validatedData.jobTypeId,
        siteSpecificRate: validatedData.siteSpecificRate
      },
      include: {
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

    return NextResponse.json({
      success: true,
      data: siteJobRate,
      message: 'Site job rate created successfully'
    })
  } catch (error) {
    console.error('Error creating site job rate:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create site job rate' },
      { status: 500 }
    )
  }
}
