import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/lib/generated/prisma"
import { 
  fingerprintVerificationSchema,
  createFingerprintLogSchema,
  type FingerprintVerificationInput,
  type CreateFingerprintLogInput
} from "@/app/api/validation/fingerprint"

const prisma = new PrismaClient()

// POST /api/fingerprint/verify - Verify fingerprint scan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = fingerprintVerificationSchema.parse(body)
    
    const { workerId, scanData, deviceId, minMatchScore } = validatedData
    
    // Verify worker exists
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      select: { 
        id: true, 
        employeeId: true, 
        firstName: true, 
        lastName: true,
        status: true
      }
    })
    
    if (!worker) {
      return NextResponse.json({
        success: false,
        error: "Worker not found"
      }, { status: 404 })
    }
    
    if (worker.status !== 'ACTIVE') {
      return NextResponse.json({
        success: false,
        error: "Worker is not active"
      }, { status: 400 })
    }
    
    // Get all active fingerprint templates for this worker
    const templates = await prisma.fingerprintTemplate.findMany({
      where: {
        workerId,
        isActive: true
      },
      orderBy: { qualityScore: 'desc' }
    })
    
    if (templates.length === 0) {
      // Log failed verification attempt
      const logData: CreateFingerprintLogInput = {
        workerId,
        deviceId,
        matchResult: 'NO_MATCH',
        errorMessage: 'No fingerprint templates found for worker'
      }
      
      await prisma.fingerprintLog.create({ data: logData })
      
      return NextResponse.json({
        success: false,
        error: "No fingerprint templates found for this worker",
        matchResult: 'NO_MATCH'
      }, { status: 404 })
    }
    
    // Simulate fingerprint matching algorithm
    // In a real implementation, this would use actual fingerprint matching algorithms
    const matchResults = await simulateFingerprintMatching(scanData, templates, minMatchScore)
    
    // Find the best match
    const bestMatch = matchResults.reduce((best, current) => 
      current.matchScore > best.matchScore ? current : best
    )
    
    // Create fingerprint log
    const logData: CreateFingerprintLogInput = {
      workerId,
      deviceId,
      matchScore: bestMatch.matchScore,
      matchedTemplateId: bestMatch.templateId,
      scanQuality: bestMatch.scanQuality,
      matchResult: bestMatch.matchResult,
      errorMessage: bestMatch.errorMessage
    }
    
    const fingerprintLog = await prisma.fingerprintLog.create({ data: logData })
    
    // Return verification result
    if (bestMatch.matchResult === 'SUCCESS') {
      return NextResponse.json({
        success: true,
        data: {
          worker,
          matchScore: bestMatch.matchScore,
          scanQuality: bestMatch.scanQuality,
          matchedTemplate: templates.find(t => t.id === bestMatch.templateId),
          logId: fingerprintLog.id
        },
        message: "Fingerprint verification successful"
      })
    } else {
      return NextResponse.json({
        success: false,
        error: bestMatch.errorMessage || "Fingerprint verification failed",
        data: {
          matchScore: bestMatch.matchScore,
          scanQuality: bestMatch.scanQuality,
          matchResult: bestMatch.matchResult
        }
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error("Error verifying fingerprint:", error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: "Invalid input data",
        details: error.message
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to verify fingerprint"
    }, { status: 500 })
  }
}

// Simulate fingerprint matching algorithm
async function simulateFingerprintMatching(
  scanData: string, 
  templates: any[], 
  minMatchScore: number
): Promise<Array<{
  templateId: number;
  matchScore: number;
  scanQuality: number;
  matchResult: string;
  errorMessage?: string;
}>> {
  const results = []
  
  for (const template of templates) {
    // Simulate scan quality (random between 70-100)
    const scanQuality = Math.floor(Math.random() * 31) + 70
    
    // Simulate match score based on template quality and scan quality
    const baseScore = Math.min(template.qualityScore, scanQuality)
    const matchScore = Math.floor(baseScore * (0.8 + Math.random() * 0.4)) // 80-120% of base score
    
    let matchResult: string
    let errorMessage: string | undefined
    
    if (scanQuality < 60) {
      matchResult = 'POOR_QUALITY'
      errorMessage = 'Scan quality too low'
    } else if (matchScore >= minMatchScore) {
      matchResult = 'SUCCESS'
    } else if (matchScore < 50) {
      matchResult = 'NO_MATCH'
      errorMessage = 'No matching fingerprint found'
    } else {
      matchResult = 'NO_MATCH'
      errorMessage = 'Match score below threshold'
    }
    
    results.push({
      templateId: template.id,
      matchScore,
      scanQuality,
      matchResult,
      errorMessage
    })
  }
  
  return results
}
