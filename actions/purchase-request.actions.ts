"use server"

import { auth } from "@clerk/nextjs/server"
import { getDb, schema } from "@/db"
import { PurchaseRequestRepository } from "@/repositories/purchase-request.repository"
import { UserRepository } from "@/repositories/user.repository"
import {
  createPurchaseRequestSchema,
  type CreatePurchaseRequestInput,
} from "@/lib/validations/purchase-request"

export async function createPurchaseRequest(input: CreatePurchaseRequestInput) {
  try {
    // 1. Get Clerk user
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    // 2. Find user in database
    const userRepo = new UserRepository()
    const user = await userRepo.findByClerkId(userId)
    if (!user || !user.id) {
      return { success: false, error: "User not found" }
    }

    // 3. Get organization
    if (!user.organizationId) {
      return { success: false, error: "User not in an organization" }
    }
    
    const organizationId = user.organizationId as string
    const userId_db = user.id as string

    // 4. Validate input
    const validation = createPurchaseRequestSchema.safeParse(input)
    if (!validation.success) {
      return {
        success: false,
        error: "Validation failed",
        details: validation.error.flatten(),
      }
    }

    // 5. Generate request number
    const prRepo = new PurchaseRequestRepository()
    const year = new Date().getFullYear()
    const requestNumber = await prRepo.getNextRequestNumber(year)
    const db = getDb()

    // 6. Calculate estimated total
    let estimatedTotal = 0
    const itemsToCreate = validation.data.items.map((item, index) => {
      const lineTotal =
        (Number(item.estimatedUnitPrice) || 0) * Number(item.quantity)
      estimatedTotal += lineTotal

      return {
        lineNumber: index + 1,
        itemName: item.itemName,
        description: item.description,
        quantity: item.quantity.toString(),
        unitOfMeasure: item.unitOfMeasure,
        estimatedUnitPrice: item.estimatedUnitPrice?.toString(),
        estimatedTotalPrice: lineTotal.toString(),
        category: item.category,
        manufacturer: item.manufacturer,
        brand: item.brand,
        modelNumber: item.modelNumber,
        sku: item.sku,
        specifications: item.specifications,
        requiredByDate: item.requiredByDate,
        notes: item.notes,
      }
    })

    // 7. Create in transaction
    const purchaseRequest = await db.transaction(async (tx) => {
      // Create purchase request
      const prResult = await tx
        .insert(schema.purchaseRequests)
        .values({
          organizationId,
          requestNumber,
          title: validation.data.title,
          description: validation.data.description,
          priority: validation.data.priority,
          currency: validation.data.currency,
          estimatedTotal: estimatedTotal.toString(),
          status: "draft",
          requestedBy: userId_db,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      const pr = prResult[0]

      // Create items
      const itemsWithRequestId = itemsToCreate.map((item) => ({
        ...item,
        purchaseRequestId: pr.id,
      }))

      if (itemsWithRequestId.length > 0) {
        await tx
          .insert(schema.purchaseRequestItems)
          .values(itemsWithRequestId)
      }

      return pr
    })

    return {
      success: true,
      requestId: purchaseRequest.id,
      requestNumber: purchaseRequest.requestNumber,
    }
  } catch (error) {
    console.error("[createPurchaseRequest] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create request",
    }
  }
}

export async function getPurchaseRequestWithItems(requestId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const prRepo = new PurchaseRequestRepository()
    const request = await prRepo.findById(requestId)
    if (!request) {
      return { success: false, error: "Request not found" }
    }

    // Verify ownership (same organization)
    const userRepo = new UserRepository()
    const user = await userRepo.findByClerkId(userId)
    if (!user || user.organizationId !== request.organizationId) {
      return { success: false, error: "Not authorized" }
    }

    const items = await prRepo.findItemsByRequestId(requestId)

    return {
      success: true,
      data: { request, items },
    }
  } catch (error) {
    console.error("[getPurchaseRequestWithItems] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch request",
    }
  }
}

export async function listPurchaseRequests(page: number = 1, limit: number = 50) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const userRepo = new UserRepository()
    const user = await userRepo.findByClerkId(userId)
    if (!user || !user.organizationId) {
      return { success: false, error: "User not in organization" }
    }

    const prRepo = new PurchaseRequestRepository()
    const offset = (page - 1) * limit

    const requests = await prRepo.findByOrganization(
      user.organizationId,
      limit,
      offset
    )
    const total = await prRepo.countByOrganization(user.organizationId)

    return {
      success: true,
      data: {
        requests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    }
  } catch (error) {
    console.error("[listPurchaseRequests] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch requests",
    }
  }
}
