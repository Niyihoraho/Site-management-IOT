import { z } from "zod"

// Enums from schema.prisma
export const workerStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE", 
  "TERMINATED",
  "ON_LEAVE"
])

export const mobileMoneyProviderSchema = z.enum([
  "MTN_MOMO",
  "AIRTEL_MONEY"
])

export const airtelMoneyProviderSchema = z.enum([
  "AIRTEL_MONEY"
])

export const preferredPaymentMethodSchema = z.enum([
  "BANK_TRANSFER",
  "CASH",
  "MOBILE_MONEY", 
  "AIRTEL_MONEY",
  "CHECK"
])

// Create worker schema
export const createWorkerSchema = z.object({
  employeeId: z.string()
    .min(1, "Employee ID is required")
    .max(50, "Employee ID must be less than 50 characters")
    .regex(/^[A-Z0-9-]+$/, "Employee ID must contain only uppercase letters, numbers, and hyphens"),
  
  firstName: z.string()
    .min(1, "First name is required")
    .max(100, "First name must be less than 100 characters"),
  
  lastName: z.string()
    .min(1, "Last name is required")
    .max(100, "Last name must be less than 100 characters"),
  
  phone: z.string()
    .max(20, "Phone must be less than 20 characters")
    .optional()
    .nullable(),
  
  email: z.string()
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters")
    .optional()
    .nullable(),
  
  nationalId: z.string()
    .max(50, "National ID must be less than 50 characters")
    .optional()
    .nullable(),
  
  status: workerStatusSchema.default("ACTIVE"),
  
  bankAccount: z.string()
    .max(50, "Bank account must be less than 50 characters")
    .optional()
    .nullable(),
  
  bankName: z.string()
    .max(100, "Bank name must be less than 100 characters")
    .optional()
    .nullable(),
  
  mobileMoneyNumber: z.string()
    .max(20, "Mobile money number must be less than 20 characters")
    .optional()
    .nullable(),
  
  mobileMoneyProvider: mobileMoneyProviderSchema
    .optional()
    .nullable(),
  
  airtelMoneyNumber: z.string()
    .max(20, "Airtel money number must be less than 20 characters")
    .optional()
    .nullable(),
  
  airtelMoneyProvider: airtelMoneyProviderSchema
    .optional()
    .nullable(),
  
  preferredPaymentMethod: preferredPaymentMethodSchema.default("BANK_TRANSFER"),
  
  emergencyContactName: z.string()
    .max(100, "Emergency contact name must be less than 100 characters")
    .optional()
    .nullable(),
  
  emergencyContactPhone: z.string()
    .max(20, "Emergency contact phone must be less than 20 characters")
    .optional()
    .nullable(),
  
  assignedSiteId: z.number()
    .int("Site ID must be an integer")
    .positive("Site ID must be positive"),
  
  jobTypeId: z.number()
    .int("Job Type ID must be an integer")
    .positive("Job Type ID must be positive")
})

// Update worker schema
export const updateWorkerSchema = z.object({
  id: z.number().int().positive(),
  employeeId: z.string()
    .min(1, "Employee ID is required")
    .max(50, "Employee ID must be less than 50 characters")
    .regex(/^[A-Z0-9-]+$/, "Employee ID must contain only uppercase letters, numbers, and hyphens")
    .optional(),
  
  firstName: z.string()
    .min(1, "First name is required")
    .max(100, "First name must be less than 100 characters")
    .optional(),
  
  lastName: z.string()
    .min(1, "Last name is required")
    .max(100, "Last name must be less than 100 characters")
    .optional(),
  
  phone: z.string()
    .max(20, "Phone must be less than 20 characters")
    .optional()
    .nullable(),
  
  email: z.string()
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters")
    .optional()
    .nullable(),
  
  nationalId: z.string()
    .max(50, "National ID must be less than 50 characters")
    .optional()
    .nullable(),
  
  status: workerStatusSchema.optional(),
  
  bankAccount: z.string()
    .max(50, "Bank account must be less than 50 characters")
    .optional()
    .nullable(),
  
  bankName: z.string()
    .max(100, "Bank name must be less than 100 characters")
    .optional()
    .nullable(),
  
  mobileMoneyNumber: z.string()
    .max(20, "Mobile money number must be less than 20 characters")
    .optional()
    .nullable(),
  
  mobileMoneyProvider: mobileMoneyProviderSchema
    .optional()
    .nullable(),
  
  airtelMoneyNumber: z.string()
    .max(20, "Airtel money number must be less than 20 characters")
    .optional()
    .nullable(),
  
  airtelMoneyProvider: airtelMoneyProviderSchema
    .optional()
    .nullable(),
  
  preferredPaymentMethod: preferredPaymentMethodSchema.optional(),
  
  emergencyContactName: z.string()
    .max(100, "Emergency contact name must be less than 100 characters")
    .optional()
    .nullable(),
  
  emergencyContactPhone: z.string()
    .max(20, "Emergency contact phone must be less than 20 characters")
    .optional()
    .nullable(),
  
  assignedSiteId: z.number()
    .int("Site ID must be an integer")
    .positive("Site ID must be positive")
    .optional(),
  
  jobTypeId: z.number()
    .int("Job Type ID must be an integer")
    .positive("Job Type ID must be positive")
    .optional()
})

// Get workers query schema
export const getWorkersQuerySchema = z.object({
  page: z.string().transform(Number).default(1),
  limit: z.string().transform(Number).default(10),
  status: workerStatusSchema.optional(),
  jobTypeId: z.string().transform(Number).optional(),
  siteId: z.string().transform(Number).optional(),
  search: z.string().optional()
})

// Get worker by ID schema
export const getWorkerByIdSchema = z.object({
  id: z.string().transform(Number)
})

// Delete worker schema
export const deleteWorkerSchema = z.object({
  id: z.string().transform(Number)
})

// Type exports
export type CreateWorkerInput = z.infer<typeof createWorkerSchema>
export type UpdateWorkerInput = z.infer<typeof updateWorkerSchema>
export type GetWorkersQuery = z.infer<typeof getWorkersQuerySchema>
export type GetWorkerByIdQuery = z.infer<typeof getWorkerByIdSchema>
export type DeleteWorkerQuery = z.infer<typeof deleteWorkerSchema>
export type WorkerStatus = z.infer<typeof workerStatusSchema>
export type MobileMoneyProvider = z.infer<typeof mobileMoneyProviderSchema>
export type AirtelMoneyProvider = z.infer<typeof airtelMoneyProviderSchema>
export type PreferredPaymentMethod = z.infer<typeof preferredPaymentMethodSchema>
