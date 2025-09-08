import { z } from "zod"

// Enums from schema.prisma
export const attendanceStatusSchema = z.enum([
  "PRESENT",
  "LATE", 
  "ABSENT",
  "HALF_DAY",
  "OVERTIME",
  "EARLY_DEPARTURE"
])

export const checkOutMethodSchema = z.enum([
  "FINGERPRINT",
  "MANUAL",
  "EMERGENCY_OVERRIDE"
])

export const matchResultSchema = z.enum([
  "SUCCESS",
  "NO_MATCH",
  "POOR_QUALITY", 
  "DEVICE_ERROR",
  "MULTIPLE_MATCHES"
])

export const fingerPositionSchema = z.enum([
  "THUMB",
  "INDEX",
  "MIDDLE", 
  "RING",
  "PINKY"
])

export const handSchema = z.enum([
  "LEFT",
  "RIGHT"
])

// Create attendance record schema
export const createAttendanceRecordSchema = z.object({
  workerId: z.number()
    .int("Worker ID must be an integer")
    .positive("Worker ID must be positive"),
  
  siteId: z.number()
    .int("Site ID must be an integer") 
    .positive("Site ID must be positive"),
  
  attendanceDate: z.string()
    .datetime("Invalid date format")
    .transform((date) => new Date(date)),
  
  checkInTime: z.string()
    .datetime("Invalid check-in time format")
    .transform((date) => new Date(date))
    .optional()
    .nullable(),
  
  checkOutTime: z.string()
    .datetime("Invalid check-out time format")
    .transform((date) => new Date(date))
    .optional()
    .nullable(),
  
  totalHours: z.number()
    .min(0, "Total hours cannot be negative")
    .max(24, "Total hours cannot exceed 24")
    .optional()
    .nullable(),
  
  regularHours: z.number()
    .min(0, "Regular hours cannot be negative")
    .max(24, "Regular hours cannot exceed 24")
    .optional()
    .nullable(),
  
  overtimeHours: z.number()
    .min(0, "Overtime hours cannot be negative")
    .max(24, "Overtime hours cannot exceed 24")
    .default(0),
  
  breakTimeMinutes: z.number()
    .int("Break time must be an integer")
    .min(0, "Break time cannot be negative")
    .max(1440, "Break time cannot exceed 24 hours")
    .default(0),
  
  status: attendanceStatusSchema.default("PRESENT"),
  
  checkOutMethod: checkOutMethodSchema.default("FINGERPRINT"),
  
  fingerprintVerified: z.boolean().default(false)
})

// Update attendance record schema
export const updateAttendanceRecordSchema = z.object({
  id: z.number().int().positive(),
  
  checkInTime: z.string()
    .datetime("Invalid check-in time format")
    .transform((date) => new Date(date))
    .optional()
    .nullable(),
  
  checkOutTime: z.string()
    .datetime("Invalid check-out time format")
    .transform((date) => new Date(date))
    .optional()
    .nullable(),
  
  totalHours: z.number()
    .min(0, "Total hours cannot be negative")
    .max(24, "Total hours cannot exceed 24")
    .optional()
    .nullable(),
  
  regularHours: z.number()
    .min(0, "Regular hours cannot be negative")
    .max(24, "Regular hours cannot exceed 24")
    .optional()
    .nullable(),
  
  overtimeHours: z.number()
    .min(0, "Overtime hours cannot be negative")
    .max(24, "Overtime hours cannot exceed 24")
    .optional(),
  
  breakTimeMinutes: z.number()
    .int("Break time must be an integer")
    .min(0, "Break time cannot be negative")
    .max(1440, "Break time cannot exceed 24 hours")
    .optional(),
  
  status: attendanceStatusSchema.optional(),
  
  checkOutMethod: checkOutMethodSchema.optional(),
  
  fingerprintVerified: z.boolean().optional()
})

// Check-in/Check-out schema
export const checkInSchema = z.object({
  workerId: z.number().int().positive(),
  siteId: z.number().int().positive(),
  checkInTime: z.string()
    .datetime("Invalid check-in time format")
    .transform((date) => new Date(date))
    .optional()
    .default(() => new Date().toISOString())
})

export const checkOutSchema = z.object({
  workerId: z.number().int().positive(),
  siteId: z.number().int().positive(),
  checkOutTime: z.string()
    .datetime("Invalid check-out time format")
    .transform((date) => new Date(date))
    .optional()
    .default(() => new Date().toISOString()),
  
  checkOutMethod: checkOutMethodSchema.default("FINGERPRINT"),
  
  fingerprintVerified: z.boolean().default(false)
})

// Get attendance records query schema
export const getAttendanceRecordsQuerySchema = z.object({
  page: z.string().transform(Number).default(1),
  limit: z.string().transform(Number).default(10),
  workerId: z.string().transform(Number).optional(),
  siteId: z.string().transform(Number).optional(),
  status: attendanceStatusSchema.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional()
})

// Get attendance record by ID schema
export const getAttendanceRecordByIdSchema = z.object({
  id: z.string().transform(Number)
})

// Delete attendance record schema
export const deleteAttendanceRecordSchema = z.object({
  id: z.string().transform(Number)
})

// Bulk attendance operations
export const bulkAttendanceUpdateSchema = z.object({
  recordIds: z.array(z.number().int().positive()).min(1, "At least one record ID is required"),
  updates: z.object({
    status: attendanceStatusSchema.optional(),
    checkOutMethod: checkOutMethodSchema.optional(),
    fingerprintVerified: z.boolean().optional()
  })
})

// Attendance summary schema
export const getAttendanceSummarySchema = z.object({
  siteId: z.string().transform(Number).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  groupBy: z.enum(["day", "week", "month"]).default("day")
})

// Type exports
export type CreateAttendanceRecordInput = z.infer<typeof createAttendanceRecordSchema>
export type UpdateAttendanceRecordInput = z.infer<typeof updateAttendanceRecordSchema>
export type CheckInInput = z.infer<typeof checkInSchema>
export type CheckOutInput = z.infer<typeof checkOutSchema>
export type GetAttendanceRecordsQuery = z.infer<typeof getAttendanceRecordsQuerySchema>
export type GetAttendanceRecordByIdQuery = z.infer<typeof getAttendanceRecordByIdSchema>
export type DeleteAttendanceRecordQuery = z.infer<typeof deleteAttendanceRecordSchema>
export type BulkAttendanceUpdateInput = z.infer<typeof bulkAttendanceUpdateSchema>
export type GetAttendanceSummaryQuery = z.infer<typeof getAttendanceSummarySchema>
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>
export type CheckOutMethod = z.infer<typeof checkOutMethodSchema>
export type MatchResult = z.infer<typeof matchResultSchema>
export type FingerPosition = z.infer<typeof fingerPositionSchema>
export type Hand = z.infer<typeof handSchema>
