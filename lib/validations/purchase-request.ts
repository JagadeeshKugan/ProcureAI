import { z } from "zod"

export const purchaseRequestItemSchema = z.object({
  itemName: z.string().min(1, "Item name required"),
  description: z.string().optional(),
  quantity: z.number().gt(0, "Quantity must be positive"),
  unitOfMeasure: z.string().optional(),
  estimatedUnitPrice: z.number().gt(0, "Unit price must be positive"),
  category: z.string().optional(),
  manufacturer: z.string().optional(),
  brand: z.string().optional(),
  modelNumber: z.string().optional(),
  sku: z.string().optional(),
  specifications: z.record(z.string(), z.any()).optional(),
  requiredByDate: z.date().optional(),
  notes: z.string().optional(),
})

export const createPurchaseRequestSchema = z.object({
  title: z.string().min(1, "Title required").max(255),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  currency: z.string().max(3).default("USD"),
  items: z.array(purchaseRequestItemSchema).min(1, "At least one item required"),
})

export type PurchaseRequestItemInput = z.infer<typeof purchaseRequestItemSchema>
export type CreatePurchaseRequestInput = z.infer<typeof createPurchaseRequestSchema>
