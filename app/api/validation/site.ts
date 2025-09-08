import { z } from "zod"

// Site status enum validation
export const siteStatusSchema = z.enum(["ACTIVE", "INACTIVE", "COMPLETED", "ON_HOLD"])

// Create site validation schema
export const createSiteSchema = z.object({
  siteCode: z.string()
    .min(1, "Site code is required")
    .max(20, "Site code must be less than 20 characters")
    .regex(/^[A-Z0-9-]+$/, "Site code must contain only uppercase letters, numbers, and hyphens"),
  siteName: z.string()
    .min(1, "Site name is required")
    .max(200, "Site name must be less than 200 characters"),
  province: z.string()
    .min(1, "Province is required")
    .max(100, "Province must be less than 100 characters"),
  district: z.string()
    .min(1, "District is required")
    .max(100, "District must be less than 100 characters"),
  sector: z.string()
    .min(1, "Sector is required")
    .max(100, "Sector must be less than 100 characters"),
  cell: z.string()
    .min(1, "Cell is required")
    .max(100, "Cell must be less than 100 characters"),
  village: z.string()
    .min(1, "Village is required")
    .max(100, "Village must be less than 100 characters"),
  projectManager: z.string()
    .max(100, "Project manager name must be less than 100 characters")
    .optional()
    .nullable(),
  contactPhone: z.string()
    .max(20, "Contact phone must be less than 20 characters")
    .optional()
    .nullable(),
  workingHoursStart: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)")
    .default("08:00"),
  workingHoursEnd: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)")
    .default("17:00"),
  standardHoursPerDay: z.number()
    .min(0.1, "Standard hours per day must be at least 0.1")
    .max(24, "Standard hours per day cannot exceed 24")
    .default(8.0),
  overtimeRateMultiplier: z.number()
    .min(1.0, "Overtime rate multiplier must be at least 1.0")
    .max(5.0, "Overtime rate multiplier cannot exceed 5.0")
    .default(1.5),
  status: siteStatusSchema.default("ACTIVE"),
  isActive: z.boolean().default(true)
})

// Update site validation schema (all fields optional except id)
export const updateSiteSchema = z.object({
  id: z.number().int().positive("Site ID must be a positive integer"),
  siteCode: z.string()
    .min(1, "Site code is required")
    .max(20, "Site code must be less than 20 characters")
    .regex(/^[A-Z0-9-]+$/, "Site code must contain only uppercase letters, numbers, and hyphens")
    .optional(),
  siteName: z.string()
    .min(1, "Site name is required")
    .max(200, "Site name must be less than 200 characters")
    .optional(),
  province: z.string()
    .min(1, "Province is required")
    .max(100, "Province must be less than 100 characters")
    .optional(),
  district: z.string()
    .min(1, "District is required")
    .max(100, "District must be less than 100 characters")
    .optional(),
  sector: z.string()
    .min(1, "Sector is required")
    .max(100, "Sector must be less than 100 characters")
    .optional(),
  cell: z.string()
    .min(1, "Cell is required")
    .max(100, "Cell must be less than 100 characters")
    .optional(),
  village: z.string()
    .min(1, "Village is required")
    .max(100, "Village must be less than 100 characters")
    .optional(),
  projectManager: z.string()
    .max(100, "Project manager name must be less than 100 characters")
    .optional()
    .nullable(),
  contactPhone: z.string()
    .max(20, "Contact phone must be less than 20 characters")
    .optional()
    .nullable(),
  workingHoursStart: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)")
    .optional(),
  workingHoursEnd: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)")
    .optional(),
  standardHoursPerDay: z.number()
    .min(0.1, "Standard hours per day must be at least 0.1")
    .max(24, "Standard hours per day cannot exceed 24")
    .optional(),
  overtimeRateMultiplier: z.number()
    .min(1.0, "Overtime rate multiplier must be at least 1.0")
    .max(5.0, "Overtime rate multiplier cannot exceed 5.0")
    .optional(),
  status: siteStatusSchema.optional(),
  isActive: z.boolean().optional()
})

// Get site by ID validation
export const getSiteByIdSchema = z.object({
  id: z.number().int().positive("Site ID must be a positive integer")
})

// Delete site validation
export const deleteSiteSchema = z.object({
  id: z.number().int().positive("Site ID must be a positive integer")
})

// Query parameters for listing sites
export const getSitesQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).default(10),
  status: siteStatusSchema.optional(),
  isActive: z.string().transform(val => val === "true").optional(),
  search: z.string().optional()
})

// Type exports
export type CreateSiteInput = z.infer<typeof createSiteSchema>
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>
export type GetSiteByIdInput = z.infer<typeof getSiteByIdSchema>
export type DeleteSiteInput = z.infer<typeof deleteSiteSchema>
export type GetSitesQueryInput = z.infer<typeof getSitesQuerySchema>
export type SiteStatus = z.infer<typeof siteStatusSchema>
