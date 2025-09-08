import { z } from "zod"

// Job type category enum validation
export const jobTypeCategorySchema = z.enum(["SKILLED", "UNSKILLED", "SUPERVISORY"])

// Create job type validation schema
export const createJobTypeSchema = z.object({
  jobCode: z.string()
    .min(1, "Job code is required")
    .max(20, "Job code must be less than 20 characters")
    .regex(/^[A-Z0-9-]+$/, "Job code must contain only uppercase letters, numbers, and hyphens"),
  jobName: z.string()
    .min(1, "Job name is required")
    .max(200, "Job name must be less than 200 characters"),
  description: z.string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
  category: jobTypeCategorySchema
    .optional()
    .nullable(),
  baseDailyRate: z.number()
    .min(0, "Base daily rate must be at least 0")
    .max(1000000, "Base daily rate cannot exceed 1,000,000"),
  overtimeMultiplier: z.number()
    .min(1.0, "Overtime multiplier must be at least 1.0")
    .max(5.0, "Overtime multiplier cannot exceed 5.0")
    .default(1.5),
  isActive: z.boolean().default(true)
})

// Update job type validation schema (all fields optional except id)
export const updateJobTypeSchema = z.object({
  id: z.number().int().positive("Job type ID must be a positive integer"),
  jobCode: z.string()
    .min(1, "Job code is required")
    .max(20, "Job code must be less than 20 characters")
    .regex(/^[A-Z0-9-]+$/, "Job code must contain only uppercase letters, numbers, and hyphens")
    .optional(),
  jobName: z.string()
    .min(1, "Job name is required")
    .max(200, "Job name must be less than 200 characters")
    .optional(),
  description: z.string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
  category: jobTypeCategorySchema
    .optional()
    .nullable(),
  baseDailyRate: z.number()
    .min(0, "Base daily rate must be at least 0")
    .max(1000000, "Base daily rate cannot exceed 1,000,000")
    .optional(),
  overtimeMultiplier: z.number()
    .min(1.0, "Overtime multiplier must be at least 1.0")
    .max(5.0, "Overtime multiplier cannot exceed 5.0")
    .optional(),
  isActive: z.boolean().optional()
})

// Get job type by ID validation
export const getJobTypeByIdSchema = z.object({
  id: z.number().int().positive("Job type ID must be a positive integer")
})

// Delete job type validation
export const deleteJobTypeSchema = z.object({
  id: z.number().int().positive("Job type ID must be a positive integer")
})

// Query parameters for listing job types
export const getJobTypesQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number),
  limit: z.string().regex(/^\d+$/).transform(Number),
  category: jobTypeCategorySchema.optional(),
  isActive: z.string().transform(val => val === "true").optional(),
  search: z.string().optional()
})

// Type exports
export type CreateJobTypeInput = z.infer<typeof createJobTypeSchema>
export type UpdateJobTypeInput = z.infer<typeof updateJobTypeSchema>
export type GetJobTypeByIdInput = z.infer<typeof getJobTypeByIdSchema>
export type DeleteJobTypeInput = z.infer<typeof deleteJobTypeSchema>
export type GetJobTypesQueryInput = z.infer<typeof getJobTypesQuerySchema>
export type JobTypeCategory = z.infer<typeof jobTypeCategorySchema>
