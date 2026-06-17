"use server"

import { PurchaseRequestService } from "@/services/purchase-request.service"

export interface CreateRequestInput {
  title: string
  description: string
  quantity: number
  estimatedBudget: number
  priority: string
  userId: string
}

export async function createPurchaseRequestAction(input: CreateRequestInput) {
  const service = new PurchaseRequestService()
  const response = await service.createPurchaseRequest({
    title: input.title,
    description: input.description,
    department: "engineering",
    priority: input.priority,
    estimatedBudget: Math.round(input.estimatedBudget * 100),
    requestedBy: input.userId,
  })

  return response
}
