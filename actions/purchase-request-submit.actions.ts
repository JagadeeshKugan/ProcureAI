"use server"

import { auth } from "@clerk/nextjs/server"
import { getDb, schema } from "@/db"
import { eq } from "drizzle-orm"
import { UserRepository } from "@/repositories/user.repository"
import { PurchaseRequestRepository } from "@/repositories/purchase-request.repository"
import { z } from "zod"

const createPRSchema = z.object({
  title: z.string().min(1, "Title required").max(255),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  estimatedTotal: z.string().min(1, "Estimated total required"),
  department: z.string().optional(),
  items: z
    .array(
      z.object({
        itemName: z.string().min(1),
        quantity: z.string(),
        unitPrice: z.string().optional(),
      })
    )
    .min(1),
})

type CreatePRInput = z.infer<typeof createPRSchema>

/**
 * Generate approval route based on estimated total
 * >$50k = 3 approvers (Finance Lead, Procurement Manager, CFO)
 * <$50k = 2 approvers (Procurement Manager, Approval Manager)
 */
function generateApprovalRoute(amount: number): string[] {
  // Return dummy approver IDs - in production, query from team structure
  if (amount > 50000) {
    return [
      "550e8400-e29b-41d4-a716-446655440001", // Finance Lead
      "550e8400-e29b-41d4-a716-446655440002", // Procurement Manager
      "550e8400-e29b-41d4-a716-446655440003", // CFO
    ]
  }
  return [
    "550e8400-e29b-41d4-a716-446655440002", // Procurement Manager
    "550e8400-e29b-41d4-a716-446655440004", // Approval Manager
  ]
}

/**
 * Create purchase request as DRAFT (no approvals initiated)
 */
export async function createPRDraft(input: CreatePRInput) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const validation = createPRSchema.safeParse(input)
    if (!validation.success) {
      return {
        success: false,
        error: "Validation failed",
        details: validation.error.flatten(),
      }
    }

    const userRepo = new UserRepository()
    const user = await userRepo.findByClerkId(userId)
    if (!user || !user.organizationId) {
      return { success: false, error: "User not found" }
    }

    const prRepo = new PurchaseRequestRepository()
    const year = new Date().getFullYear()
    const requestNumber = await prRepo.getNextRequestNumber(year)

    const db = getDb()
    const result = await db.transaction(async () => {
      const prResult = await db
        .insert(schema.purchaseRequests)
        .values({
          organizationId: user.organizationId as string,
          requestNumber,
          title: validation.data.title,
          description: validation.data.description,
          department: validation.data.department,
          priority: validation.data.priority,
          estimatedTotal: validation.data.estimatedTotal,
          currency: "USD",
          status: "draft",
          requestedBy: user.id as string,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      const pr = prResult[0]

      // Create items
      const items = validation.data.items.map((item, idx) => ({
        lineNumber: idx + 1,
        itemName: item.itemName,
        quantity: item.quantity,
        estimatedUnitPrice: item.unitPrice,
        purchaseRequestId: pr.id,
      }))

      if (items.length > 0) {
        await db.insert(schema.purchaseRequestItems).values(items)
      }

      return pr
    })

    return {
      success: true,
      requestId: result.id,
      requestNumber: result.requestNumber,
    }
  } catch (error) {
    console.error("[createPRDraft] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create draft",
    }
  }
}

/**
 * Submit purchase request for approval
 * Creates approval route and initiates workflow
 */
export async function submitPRForApproval(requestId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const userRepo = new UserRepository()
    const user = await userRepo.findByClerkId(userId)
    if (!user) {
      return { success: false, error: "User not found" }
    }

    const prRepo = new PurchaseRequestRepository()
    const pr = await prRepo.findById(requestId)
    if (!pr) {
      return { success: false, error: "Request not found" }
    }

    // Verify ownership
    if (pr.requestedBy !== user.id) {
      return { success: false, error: "Not authorized" }
    }

    // Generate approval route based on amount
    const approvalAmount = Number(pr.estimatedTotal) || 0
    const approvalRoute = generateApprovalRoute(approvalAmount)

    const db = getDb()
    const result = await db.transaction(async () => {
      // Update PR with approval route and status
      const updatedPR = await db
        .update(schema.purchaseRequests)
        .set({
          status: "pending_approval",
          approvalRoute: JSON.stringify(approvalRoute),
          updatedAt: new Date(),
        })
        .where(eq(schema.purchaseRequests.id, requestId))
        .returning()

      // Create approval records for each approver in route
      const approvals = approvalRoute.map((approverId) => ({
        purchaseRequestId: requestId,
        approverId,
        status: "pending" as const,
      }))

      if (approvals.length > 0) {
        await db.insert(schema.purchaseRequestApprovals).values(approvals)
      }

      return updatedPR[0]
    })

    return {
      success: true,
      requestId: result.id,
      status: result.status,
      approverCount: approvalRoute.length,
    }
  } catch (error) {
    console.error("[submitPRForApproval] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit",
    }
  }
}

/**
 * Get purchase request with full details including items and approvals
 */
export async function getPRWithDetails(requestId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const prRepo = new PurchaseRequestRepository()
    const pr = await prRepo.findById(requestId)
    if (!pr) {
      return { success: false, error: "Request not found" }
    }

    const items = await prRepo.findItemsByRequestId(requestId)

    // Parse approval route
    const approvalRoute = pr.approvalRoute
      ? JSON.parse(pr.approvalRoute as any)
      : []

    return {
      success: true,
      data: {
        request: pr,
        items,
        approvalRoute,
      },
    }
  } catch (error) {
    console.error("[getPRWithDetails] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch",
    }
  }
}
