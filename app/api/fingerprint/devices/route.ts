import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/lib/generated/prisma"
import { 
  createFingerprintDeviceSchema,
  getFingerprintDevicesQuerySchema,
  type CreateFingerprintDeviceInput,
  type GetFingerprintDevicesQuery
} from "@/app/api/validation/fingerprint"

const prisma = new PrismaClient()

// GET /api/fingerprint/devices - Get all fingerprint devices with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const validatedQuery = getFingerprintDevicesQuerySchema.parse(queryParams)
    const { page, limit, siteId, isOnline, isActive, search } = validatedQuery
    
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {}
    
    if (siteId) where.siteId = siteId
    if (isOnline !== undefined) where.isOnline = isOnline
    if (isActive !== undefined) where.isActive = isActive
    
    if (search) {
      where.OR = [
        { deviceName: { contains: search, mode: 'insensitive' } },
        { deviceId: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    // Get fingerprint devices with related data
    const [devices, total] = await Promise.all([
      prisma.fingerprintDevice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
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
              scanTimestamp: true
            },
            orderBy: { scanTimestamp: 'desc' },
            take: 5
          },
          _count: {
            select: {
              fingerprintLogs: true
            }
          }
        }
      }),
      prisma.fingerprintDevice.count({ where })
    ])
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1
    
    return NextResponse.json({
      success: true,
      data: devices,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    })
    
  } catch (error) {
    console.error("Error fetching fingerprint devices:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid query parameters",
        details: error.message
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch fingerprint devices"
    }, { status: 500 })
  }
}

// POST /api/fingerprint/devices - Create new fingerprint device
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createFingerprintDeviceSchema.parse(body)
    
    // Check if device ID already exists
    const existingDevice = await prisma.fingerprintDevice.findUnique({
      where: { deviceId: validatedData.deviceId }
    })
    
    if (existingDevice) {
      return NextResponse.json({
        success: false,
        error: "Device ID already exists"
      }, { status: 409 })
    }
    
    // Check if serial number already exists (if provided)
    if (validatedData.serialNumber) {
      const existingSerial = await prisma.fingerprintDevice.findUnique({
        where: { serialNumber: validatedData.serialNumber }
      })
      
      if (existingSerial) {
        return NextResponse.json({
          success: false,
          error: "Serial number already exists"
        }, { status: 409 })
      }
    }
    
    // Verify site exists (if provided)
    if (validatedData.siteId) {
      const site = await prisma.constructionSite.findUnique({
        where: { id: validatedData.siteId },
        select: { id: true, siteName: true, siteCode: true }
      })
      
      if (!site) {
        return NextResponse.json({
          success: false,
          error: "Site not found"
        }, { status: 404 })
      }
    }
    
    // Create fingerprint device
    const fingerprintDevice = await prisma.fingerprintDevice.create({
      data: validatedData,
      include: {
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
      data: fingerprintDevice,
      message: "Fingerprint device created successfully"
    }, { status: 201 })
    
  } catch (error) {
    console.error("Error creating fingerprint device:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid input data",
        details: error.message
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to create fingerprint device"
    }, { status: 500 })
  }
}
