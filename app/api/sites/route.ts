import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSiteSchema, getSitesQuerySchema } from "@/app/api/validation/site"

// GET /api/sites - Get all sites with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    // Validate query parameters
    const validatedQuery = getSitesQuerySchema.parse(queryParams)
    
    const { page, limit, status, isActive, search } = validatedQuery
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive
    }
    
    if (search) {
      where.OR = [
        { siteName: { contains: search, mode: 'insensitive' } },
        { siteCode: { contains: search, mode: 'insensitive' } },
        { province: { contains: search, mode: 'insensitive' } },
        { district: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get sites with pagination
    const [sites, total] = await Promise.all([
      prisma.constructionSite.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { workers: true }
          }
        }
      }),
      prisma.constructionSite.count({ where })
    ])

    // Transform data for frontend
    const transformedSites = sites.map(site => ({
      id: site.id,
      siteCode: site.siteCode,
      siteName: site.siteName,
      location: `${site.village}, ${site.cell}, ${site.sector}, ${site.district}, ${site.province}`,
      status: site.status,
      workers: site._count.workers,
      projectManager: site.projectManager,
      contactPhone: site.contactPhone,
      workingHoursStart: site.workingHoursStart,
      workingHoursEnd: site.workingHoursEnd,
      standardHoursPerDay: site.standardHoursPerDay,
      overtimeRateMultiplier: site.overtimeRateMultiplier,
      isActive: site.isActive,
      createdAt: site.createdAt,
      updatedAt: site.updatedAt
    }))

    return NextResponse.json({
      success: true,
      data: transformedSites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching sites:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch sites" },
      { status: 500 }
    )
  }
}

// POST /api/sites - Create a new site
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = createSiteSchema.parse(body)
    
    // Check if site code already exists
    const existingSite = await prisma.constructionSite.findUnique({
      where: { siteCode: validatedData.siteCode }
    })
    
    if (existingSite) {
      return NextResponse.json(
        { success: false, error: "Site code already exists" },
        { status: 400 }
      )
    }
    
    // Create new site
    const newSite = await prisma.constructionSite.create({
      data: validatedData,
      include: {
        _count: {
          select: { workers: true }
        }
      }
    })
    
    // Transform data for frontend
    const transformedSite = {
      id: newSite.id,
      siteCode: newSite.siteCode,
      siteName: newSite.siteName,
      location: `${newSite.village}, ${newSite.cell}, ${newSite.sector}, ${newSite.district}, ${newSite.province}`,
      status: newSite.status,
      workers: newSite._count.workers,
      projectManager: newSite.projectManager,
      contactPhone: newSite.contactPhone,
      workingHoursStart: newSite.workingHoursStart,
      workingHoursEnd: newSite.workingHoursEnd,
      standardHoursPerDay: newSite.standardHoursPerDay,
      overtimeRateMultiplier: newSite.overtimeRateMultiplier,
      isActive: newSite.isActive,
      createdAt: newSite.createdAt,
      updatedAt: newSite.updatedAt
    }
    
    return NextResponse.json({
      success: true,
      data: transformedSite,
      message: "Site created successfully"
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating site:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to create site" },
      { status: 500 }
    )
  }
}
