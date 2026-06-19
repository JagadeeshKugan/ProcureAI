"use server"

import { PurchaseRequestService } from "@/services/purchase-request.service"

export interface CreateRequestInput {
  title: string
  description: string
  quantity: number
  unitPrice: number
  priority: string
  userId: string
  organizationId: string
}

export async function createPurchaseRequestAction(input: CreateRequestInput) {
  const service = new PurchaseRequestService()
  const response = await service.createPurchaseRequest({
    title: input.title,
    description: input.description,
    priority: input.priority,
    organizationId: input.organizationId,
    requestedBy: input.userId,
    items: [
      {
        itemName: input.title,
        quantity: input.quantity,
        estimatedUnitPrice: input.unitPrice,
      },
    ],
  })

  return response
}
