import { z } from "zod"

// Re-export enums from attendance validation
export { 
  matchResultSchema, 
  fingerPositionSchema, 
  handSchema,
  type MatchResult,
  type FingerPosition,
  type Hand
} from "./attendance"

// Create fingerprint template schema
export const createFingerprintTemplateSchema = z.object({
  workerId: z.number()
    .int("Worker ID must be an integer")
    .positive("Worker ID must be positive"),
  
  fingerPosition: z.enum([
    "THUMB",
    "INDEX", 
    "MIDDLE",
    "RING",
    "PINKY"
  ]),
  
  hand: z.enum([
    "LEFT",
    "RIGHT"
  ]),
  
  templateData: z.string()
    .min(1, "Template data is required")
    .max(10000, "Template data too large"),
  
  qualityScore: z.number()
    .int("Quality score must be an integer")
    .min(0, "Quality score cannot be negative")
    .max(100, "Quality score cannot exceed 100"),
  
  enrolledBy: z.string()
    .max(100, "Enrolled by must be less than 100 characters")
    .optional()
    .nullable(),
  
  deviceUsed: z.string()
    .max(100, "Device used must be less than 100 characters")
    .optional()
    .nullable()
})

// Update fingerprint template schema
export const updateFingerprintTemplateSchema = z.object({
  id: z.number().int().positive(),
  
  templateData: z.string()
    .min(1, "Template data is required")
    .max(10000, "Template data too large")
    .optional(),
  
  qualityScore: z.number()
    .int("Quality score must be an integer")
    .min(0, "Quality score cannot be negative")
    .max(100, "Quality score cannot exceed 100")
    .optional(),
  
  isActive: z.boolean().optional()
})

// Create fingerprint device schema
export const createFingerprintDeviceSchema = z.object({
  deviceId: z.string()
    .min(1, "Device ID is required")
    .max(50, "Device ID must be less than 50 characters"),
  
  deviceName: z.string()
    .min(1, "Device name is required")
    .max(100, "Device name must be less than 100 characters"),
  
  siteId: z.number()
    .int("Site ID must be an integer")
    .positive("Site ID must be positive")
    .optional()
    .nullable(),
  
  manufacturer: z.string()
    .max(100, "Manufacturer must be less than 100 characters")
    .optional()
    .nullable(),
  
  model: z.string()
    .max(100, "Model must be less than 100 characters")
    .optional()
    .nullable(),
  
  serialNumber: z.string()
    .max(100, "Serial number must be less than 100 characters")
    .optional()
    .nullable(),
  
  firmwareVersion: z.string()
    .max(50, "Firmware version must be less than 50 characters")
    .optional()
    .nullable(),
  
  ipAddress: z.string()
    .regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, "Invalid IP address format")
    .optional()
    .nullable(),
  
  macAddress: z.string()
    .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, "Invalid MAC address format")
    .optional()
    .nullable()
})

// Update fingerprint device schema
export const updateFingerprintDeviceSchema = z.object({
  id: z.number().int().positive(),
  
  deviceName: z.string()
    .min(1, "Device name is required")
    .max(100, "Device name must be less than 100 characters")
    .optional(),
  
  siteId: z.number()
    .int("Site ID must be an integer")
    .positive("Site ID must be positive")
    .optional()
    .nullable(),
  
  manufacturer: z.string()
    .max(100, "Manufacturer must be less than 100 characters")
    .optional()
    .nullable(),
  
  model: z.string()
    .max(100, "Model must be less than 100 characters")
    .optional()
    .nullable(),
  
  serialNumber: z.string()
    .max(100, "Serial number must be less than 100 characters")
    .optional()
    .nullable(),
  
  firmwareVersion: z.string()
    .max(50, "Firmware version must be less than 50 characters")
    .optional()
    .nullable(),
  
  ipAddress: z.string()
    .regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, "Invalid IP address format")
    .optional()
    .nullable(),
  
  macAddress: z.string()
    .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, "Invalid MAC address format")
    .optional()
    .nullable(),
  
  isOnline: z.boolean().optional(),
  
  isActive: z.boolean().optional()
})

// Create fingerprint log schema
export const createFingerprintLogSchema = z.object({
  attendanceRecordId: z.number()
    .int("Attendance record ID must be an integer")
    .positive("Attendance record ID must be positive")
    .optional()
    .nullable(),
  
  workerId: z.number()
    .int("Worker ID must be an integer")
    .positive("Worker ID must be positive")
    .optional()
    .nullable(),
  
  deviceId: z.number()
    .int("Device ID must be an integer")
    .positive("Device ID must be positive")
    .optional()
    .nullable(),
  
  matchScore: z.number()
    .int("Match score must be an integer")
    .min(0, "Match score cannot be negative")
    .max(100, "Match score cannot exceed 100")
    .optional()
    .nullable(),
  
  matchedTemplateId: z.number()
    .int("Matched template ID must be an integer")
    .positive("Matched template ID must be positive")
    .optional()
    .nullable(),
  
  scanTimestamp: z.string()
    .datetime("Invalid scan timestamp format")
    .transform((date) => new Date(date))
    .optional()
    .default(() => new Date().toISOString()),
  
  scanQuality: z.number()
    .int("Scan quality must be an integer")
    .min(0, "Scan quality cannot be negative")
    .max(100, "Scan quality cannot exceed 100")
    .optional()
    .nullable(),
  
  matchResult: z.enum([
    "SUCCESS",
    "NO_MATCH",
    "POOR_QUALITY",
    "DEVICE_ERROR", 
    "MULTIPLE_MATCHES"
  ]),
  
  errorMessage: z.string()
    .max(500, "Error message must be less than 500 characters")
    .optional()
    .nullable()
})

// Fingerprint scan request schema
export const fingerprintScanRequestSchema = z.object({
  workerId: z.number().int().positive(),
  siteId: z.number().int().positive(),
  deviceId: z.number().int().positive(),
  scanData: z.string()
    .min(1, "Scan data is required")
    .max(10000, "Scan data too large"),
  
  scanQuality: z.number()
    .int("Scan quality must be an integer")
    .min(0, "Scan quality cannot be negative")
    .max(100, "Scan quality cannot exceed 100")
    .optional(),
  
  fingerPosition: z.enum([
    "THUMB",
    "INDEX",
    "MIDDLE", 
    "RING",
    "PINKY"
  ]).optional(),
  
  hand: z.enum([
    "LEFT",
    "RIGHT"
  ]).optional()
})

// Fingerprint verification schema
export const fingerprintVerificationSchema = z.object({
  workerId: z.number().int().positive(),
  scanData: z.string()
    .min(1, "Scan data is required")
    .max(10000, "Scan data too large"),
  
  deviceId: z.number().int().positive().optional(),
  
  minMatchScore: z.number()
    .int("Minimum match score must be an integer")
    .min(0, "Minimum match score cannot be negative")
    .max(100, "Minimum match score cannot exceed 100")
    .default(80)
})

// Get fingerprint templates query schema
export const getFingerprintTemplatesQuerySchema = z.object({
  page: z.string().transform(Number).default(1),
  limit: z.string().transform(Number).default(10),
  workerId: z.string().transform(Number).optional(),
  fingerPosition: z.enum([
    "THUMB",
    "INDEX",
    "MIDDLE",
    "RING", 
    "PINKY"
  ]).optional(),
  hand: z.enum([
    "LEFT",
    "RIGHT"
  ]).optional(),
  isActive: z.string().transform(val => val === "true").optional()
})

// Get fingerprint devices query schema
export const getFingerprintDevicesQuerySchema = z.object({
  page: z.string().transform(Number).default(1),
  limit: z.string().transform(Number).default(10),
  siteId: z.string().transform(Number).optional(),
  isOnline: z.string().transform(val => val === "true").optional(),
  isActive: z.string().transform(val => val === "true").optional(),
  search: z.string().optional()
})

// Get fingerprint logs query schema
export const getFingerprintLogsQuerySchema = z.object({
  page: z.string().transform(Number).default(1),
  limit: z.string().transform(Number).default(10),
  workerId: z.string().transform(Number).optional(),
  deviceId: z.string().transform(Number).optional(),
  matchResult: z.enum([
    "SUCCESS",
    "NO_MATCH",
    "POOR_QUALITY",
    "DEVICE_ERROR",
    "MULTIPLE_MATCHES"
  ]).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional()
})

// Get by ID schemas
export const getFingerprintTemplateByIdSchema = z.object({
  id: z.string().transform(Number)
})

export const getFingerprintDeviceByIdSchema = z.object({
  id: z.string().transform(Number)
})

export const getFingerprintLogByIdSchema = z.object({
  id: z.string().transform(Number)
})

// Delete schemas
export const deleteFingerprintTemplateSchema = z.object({
  id: z.string().transform(Number)
})

export const deleteFingerprintDeviceSchema = z.object({
  id: z.string().transform(Number)
})

export const deleteFingerprintLogSchema = z.object({
  id: z.string().transform(Number)
})

// Device status update schema
export const updateDeviceStatusSchema = z.object({
  deviceId: z.string(),
  isOnline: z.boolean(),
  lastPing: z.string()
    .datetime("Invalid last ping format")
    .transform((date) => new Date(date))
    .optional()
    .default(() => new Date().toISOString())
})

// Type exports
export type CreateFingerprintTemplateInput = z.infer<typeof createFingerprintTemplateSchema>
export type UpdateFingerprintTemplateInput = z.infer<typeof updateFingerprintTemplateSchema>
export type CreateFingerprintDeviceInput = z.infer<typeof createFingerprintDeviceSchema>
export type UpdateFingerprintDeviceInput = z.infer<typeof updateFingerprintDeviceSchema>
export type CreateFingerprintLogInput = z.infer<typeof createFingerprintLogSchema>
export type FingerprintScanRequestInput = z.infer<typeof fingerprintScanRequestSchema>
export type FingerprintVerificationInput = z.infer<typeof fingerprintVerificationSchema>
export type GetFingerprintTemplatesQuery = z.infer<typeof getFingerprintTemplatesQuerySchema>
export type GetFingerprintDevicesQuery = z.infer<typeof getFingerprintDevicesQuerySchema>
export type GetFingerprintLogsQuery = z.infer<typeof getFingerprintLogsQuerySchema>
export type GetFingerprintTemplateByIdQuery = z.infer<typeof getFingerprintTemplateByIdSchema>
export type GetFingerprintDeviceByIdQuery = z.infer<typeof getFingerprintDeviceByIdSchema>
export type GetFingerprintLogByIdQuery = z.infer<typeof getFingerprintLogByIdSchema>
export type DeleteFingerprintTemplateQuery = z.infer<typeof deleteFingerprintTemplateSchema>
export type DeleteFingerprintDeviceQuery = z.infer<typeof deleteFingerprintDeviceSchema>
export type DeleteFingerprintLogQuery = z.infer<typeof deleteFingerprintLogSchema>
export type UpdateDeviceStatusInput = z.infer<typeof updateDeviceStatusSchema>
