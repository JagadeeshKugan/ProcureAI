"use server"

import { auth } from "@clerk/nextjs/server"
import { getDb, schema } from "@/db"
import { eq, and, inArray } from "drizzle-orm"
import { UserRepository } from "@/repositories/user.repository"
import { PurchaseRequestRepository } from "@/repositories/purchase-request.repository"
import { AuditLogRepository } from "@/repositories/audit-log.repository"
import { OrganizationRepository } from "@/repositories/organization.repository"
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
 * Queries admin and approver users from the organization
 * >$50k = Up to 3 approvers (prioritize admin, then approver)
 * <$50k = First approver found (admin or approver)
 */
async function generateApprovalRoute(
  amount: number,
  organizationId: string
): Promise<string[]> {
  const db = getDb()
  
  // Query both admin and approver users in the organization
  const approvers = await db
    .select({ id: schema.users.id, role: schema.users.role })
    .from(schema.users)
    .where(
      and(
        eq(schema.users.organizationId, organizationId),
        // Include both admin and approver roles
        inArray(schema.users.role, ["admin", "approver"])
      )
    )
    .orderBy(schema.users.role) // Admins come first alphabetically
    .limit(10)

  const approverUserIds = approvers.map((u) => u.id)

  console.log("[generateApprovalRoute] Found approvers:", {
    amount,
    organizationId,
    totalApprovers: approverUserIds.length,
    breakdown: {
      admins: approvers.filter((u) => u.role === "admin").length,
      approvers: approvers.filter((u) => u.role === "approver").length,
    },
  })

  if (approverUserIds.length === 0) {
    console.warn(
      "[generateApprovalRoute] No admin or approver users found for organization:",
      organizationId
    )
    return []
  }

  // For amounts > 50k, use up to 3 approvers (mix of admin and approver)
  // For smaller amounts, use just the first approver
  if (amount > 50000) {
    return approverUserIds.slice(0, 3)
  }
  return approverUserIds.slice(0, 5)
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

    // Create audit log
    const auditRepo = new AuditLogRepository()
    await auditRepo.create({
      organizationId: user.organizationId,
      action: "REQUEST_CREATED",
      entityType: "purchase_request",
      entityId: result.id,
      performedBy: user.id,
      metadata: {
        requestNumber: result.requestNumber,
        title: result.title,
        estimatedTotal: result.estimatedTotal,
        priority: result.priority,
      },
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

    // Generate approval route based on amount and organization
    const approvalAmount = Number(pr.estimatedTotal) || 0
    const approvalRoute = await generateApprovalRoute(
      approvalAmount,
      pr.organizationId
    )

    if (approvalRoute.length === 0) {
      return {
        success: false,
        error: "No admin approvers found in your organization",
      }
    }

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

    // Create audit log
    const auditRepo = new AuditLogRepository()
    await auditRepo.create({
      organizationId: pr.organizationId,
      action: "REQUEST_SUBMITTED",
      entityType: "purchase_request",
      entityId: result.id,
      performedBy: user.id,
      metadata: {
        requestNumber: pr.requestNumber,
        oldStatus: pr.status,
        newStatus: result.status,
        approverCount: approvalRoute.length,
        estimatedTotal: pr.estimatedTotal,
      },
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
