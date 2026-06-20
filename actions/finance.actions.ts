"use server"

import { auth } from "@clerk/nextjs/server"
import { getDb, schema } from "@/db"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const financeApprovalSchema = z.object({
  requestId: z.string().uuid(),
  budgetCode: z.string().optional(),
  costCenter: z.string().optional(),
  budgetAvailable: z.string().optional(),
  financeComments: z.string().optional(),
  approved: z.boolean(),
})

export async function getFinancePendingApprovals(organizationId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const db = getDb()
    
    // Get pending finance approvals for the organization
    const approvals = await db
      .select({
        id: schema.financeApprovals.id,
        requestId: schema.financeApprovals.requestId,
        requestNumber: schema.purchaseRequests.requestNumber,
        title: schema.purchaseRequests.title,
        estimatedTotal: schema.purchaseRequests.estimatedTotal,
        currency: schema.purchaseRequests.currency,
        department: schema.purchaseRequests.department,
        requester: schema.users.name,
        status: schema.financeApprovals.status,
        budgetCode: schema.financeApprovals.budgetCode,
        costCenter: schema.financeApprovals.costCenter,
        budgetAvailable: schema.financeApprovals.budgetAvailable,
        financeComments: schema.financeApprovals.financeComments,
        createdAt: schema.financeApprovals.createdAt,
      })
      .from(schema.financeApprovals)
      .innerJoin(
        schema.purchaseRequests,
        eq(schema.financeApprovals.requestId, schema.purchaseRequests.id)
      )
      .innerJoin(
        schema.users,
        eq(schema.purchaseRequests.requestedBy, schema.users.id)
      )
      .where(
        and(
          eq(schema.financeApprovals.organizationId, organizationId),
          eq(schema.financeApprovals.status, "PENDING")
        )
      )
      .orderBy(schema.financeApprovals.createdAt)

    return { success: true, data: approvals }
  } catch (error) {
    console.error("[getFinancePendingApprovals Error]", error)
    return { success: false, error: "Failed to fetch pending approvals" }
  }
}

export async function approveFinanceRequest(data: z.infer<typeof financeApprovalSchema>, organizationId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const validation = financeApprovalSchema.safeParse(data)
    if (!validation.success) {
      return { success: false, error: "Invalid input" }
    }

    const db = getDb()

    // Start transaction
    await db.transaction(async () => {
      // Update finance approval status
      await db
        .update(schema.financeApprovals)
        .set({
          status: validation.data.approved ? "APPROVED" : "REJECTED",
          financeComments: validation.data.financeComments,
          approvedAt: new Date(),
        })
        .where(eq(schema.financeApprovals.requestId, validation.data.requestId))

      // Update purchase request status
      if (validation.data.approved) {
        await db
          .update(schema.purchaseRequests)
          .set({
            status: "finance_approved",
            updatedAt: new Date(),
          })
          .where(eq(schema.purchaseRequests.id, validation.data.requestId))
      } else {
        await db
          .update(schema.purchaseRequests)
          .set({
            status: "rejected",
            updatedAt: new Date(),
          })
          .where(eq(schema.purchaseRequests.id, validation.data.requestId))
      }

      // Create audit log
      await db.insert(schema.auditLogs).values({
        organizationId,
        userId: userId as string,
        action: "FINANCE_APPROVED",
        entityType: "finance_approval",
        entityId: validation.data.requestId,
        newValues: {
          status: validation.data.approved ? "APPROVED" : "REJECTED",
          comments: validation.data.financeComments,
        },
      })
    })

    return { success: true, message: validation.data.approved ? "Request approved" : "Request rejected" }
  } catch (error) {
    console.error("[approveFinanceRequest Error]", error)
    return { success: false, error: "Failed to process approval" }
  }
}
