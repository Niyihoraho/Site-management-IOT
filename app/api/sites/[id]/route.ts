import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateSiteSchema, getSiteByIdSchema, deleteSiteSchema } from "@/app/api/validation/site"

// GET /api/sites/[id] - Get a specific site by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    
    // Validate ID
    const validatedId = getSiteByIdSchema.parse({ id })
    
    const site = await prisma.constructionSite.findUnique({
      where: { id: validatedId.id },
      include: {
        _count: {
          select: { workers: true }
        }
      }
    })
    
    if (!site) {
      return NextResponse.json(
        { success: false, error: "Site not found" },
        { status: 404 }
      )
    }
    
    // Transform data for frontend
    const transformedSite = {
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
    }
    
    return NextResponse.json({
      success: true,
      data: transformedSite
    })
  } catch (error) {
    console.error("Error fetching site:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: "Invalid site ID" },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to fetch site" },
      { status: 500 }
    )
  }
}

// PUT /api/sites/[id] - Update a specific site
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    const body = await request.json()
    
    // Check if ID is valid
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid site ID format" },
        { status: 400 }
      )
    }
    
    // Validate ID and request body
    const validatedId = getSiteByIdSchema.parse({ id })
    const validatedData = updateSiteSchema.parse({ id: validatedId.id, ...body })
    
    // Check if site exists
    const existingSite = await prisma.constructionSite.findUnique({
      where: { id: validatedId.id }
    })
    
    if (!existingSite) {
      return NextResponse.json(
        { success: false, error: "Site not found" },
        { status: 404 }
      )
    }
    
    // Check if site code is being changed and if it already exists
    if (validatedData.siteCode && validatedData.siteCode !== existingSite.siteCode) {
      const siteWithSameCode = await prisma.constructionSite.findUnique({
        where: { siteCode: validatedData.siteCode }
      })
      
      if (siteWithSameCode) {
        return NextResponse.json(
          { success: false, error: "Site code already exists" },
          { status: 400 }
        )
      }
    }
    
    // Update site
    const updatedSite = await prisma.constructionSite.update({
      where: { id: validatedId.id },
      data: {
        siteCode: validatedData.siteCode,
        siteName: validatedData.siteName,
        province: validatedData.province,
        district: validatedData.district,
        sector: validatedData.sector,
        cell: validatedData.cell,
        village: validatedData.village,
        projectManager: validatedData.projectManager,
        contactPhone: validatedData.contactPhone,
        workingHoursStart: validatedData.workingHoursStart,
        workingHoursEnd: validatedData.workingHoursEnd,
        standardHoursPerDay: validatedData.standardHoursPerDay,
        overtimeRateMultiplier: validatedData.overtimeRateMultiplier,
        status: validatedData.status,
        isActive: validatedData.isActive
      },
      include: {
        _count: {
          select: { workers: true }
        }
      }
    })
    
    // Transform data for frontend
    const transformedSite = {
      id: updatedSite.id,
      siteCode: updatedSite.siteCode,
      siteName: updatedSite.siteName,
      location: `${updatedSite.village}, ${updatedSite.cell}, ${updatedSite.sector}, ${updatedSite.district}, ${updatedSite.province}`,
      status: updatedSite.status,
      workers: updatedSite._count.workers,
      projectManager: updatedSite.projectManager,
      contactPhone: updatedSite.contactPhone,
      workingHoursStart: updatedSite.workingHoursStart,
      workingHoursEnd: updatedSite.workingHoursEnd,
      standardHoursPerDay: updatedSite.standardHoursPerDay,
      overtimeRateMultiplier: updatedSite.overtimeRateMultiplier,
      isActive: updatedSite.isActive,
      createdAt: updatedSite.createdAt,
      updatedAt: updatedSite.updatedAt
    }
    
    return NextResponse.json({
      success: true,
      data: transformedSite,
      message: "Site updated successfully"
    })
  } catch (error) {
    console.error("Error updating site:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to update site" },
      { status: 500 }
    )
  }
}

// DELETE /api/sites/[id] - Delete a specific site
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    
    // Validate ID
    const validatedId = deleteSiteSchema.parse({ id })
    
    // Check if site exists
    const existingSite = await prisma.constructionSite.findUnique({
      where: { id: validatedId.id },
      include: {
        _count: {
          select: { workers: true }
        }
      }
    })
    
    if (!existingSite) {
      return NextResponse.json(
        { success: false, error: "Site not found" },
        { status: 404 }
      )
    }
    
    // Check if site has workers assigned
    if (existingSite._count.workers > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete site with assigned workers" },
        { status: 400 }
      )
    }
    
    // Delete site
    await prisma.constructionSite.delete({
      where: { id: validatedId.id }
    })
    
    return NextResponse.json({
      success: true,
      message: "Site deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting site:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: "Invalid site ID" },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to delete site" },
      { status: 500 }
    )
  }
}
