import { z } from "zod"

export const createPurchaseRequestSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  priority: z.enum(["low", "medium", "high", "critical"]),
  estimatedBudget: z.number().positive("Budget must be positive"),
  requestedBy: z.string().uuid("Invalid user ID"),
})

export type CreatePurchaseRequestInput = z.infer<
  typeof createPurchaseRequestSchema
>

export const syncUserSchema = z.object({
  clerkId: z.string().min(1, "Clerk ID is required"),
  email: z.string().email("Invalid email"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  publicMetadata: z.record(z.string(), z.any()).optional(),
})

export type SyncUserInput = z.infer<typeof syncUserSchema>
