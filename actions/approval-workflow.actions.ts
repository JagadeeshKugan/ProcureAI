"use server"

import { auth } from "@clerk/nextjs/server"
import { getDb, schema } from "@/db"
import { eq, and, isNull, desc } from "drizzle-orm"
import { UserRepository } from "@/repositories/user.repository"

// Submit a purchase request for approval
export async function submitRequestForApproval(requestId: string) {
  const { userId } = await auth()

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized",
    }
  }

  try {
    const db = getDb()
    const userRepo = new UserRepository()
    const user = await userRepo.findByClerkId(userId)

    if (!user?.organizationId) {
      return {
        success: false,
        error: "User organization not found",
      }
    }

    // Get the purchase request
    const requests = await db
      .select()
      .from(schema.purchaseRequests)
      .where(
        and(
          eq(schema.purchaseRequests.id, requestId),
          eq(schema.purchaseRequests.organizationId, user.organizationId)
        )
      )

    if (requests.length === 0) {
      return {
        success: false,
        error: "Purchase request not found",
      }
    }

    const request = requests[0]

    if (request.status !== "draft") {
      return {
        success: false,
        error: "Only draft requests can be submitted",
      }
    }

    // Get organization members with approval roles in order
    const approvers = await db
      .select()
      .from(schema.organizationMembers)
      .where(
        and(
          eq(schema.organizationMembers.organizationId, user.organizationId),
          eq(schema.organizationMembers.role, "PROCUREMENT_MANAGER")
        )
      )

    if (approvers.length === 0) {
      return {
        success: false,
        error: "No procurement manager found in organization",
      }
    }

    const approvalRoute = [approvers[0].userId] // Start with procurement manager

    // Use transaction for atomicity
    await db.transaction(async (tx) => {
      // Update request status and approval route
      await tx
        .update(schema.purchaseRequests)
        .set({
          status: "submitted",
          approvalRoute: JSON.stringify(approvalRoute),
          updatedAt: new Date(),
        })
        .where(eq(schema.purchaseRequests.id, requestId))

      // Create approval records for each approver
      for (const approverId of approvalRoute) {
        await tx.insert(schema.purchaseRequestApprovals).values({
          purchaseRequestId: requestId,
          approverId,
          status: "pending",
        })
      }

      // Create notifications for approvers
      for (const approverId of approvalRoute) {
        await tx.insert(schema.notifications).values({
          userId: approverId,
          type: "approval_request",
          title: `Approval Request: ${request.title}`,
          message: `A new purchase request "${request.title}" requires your approval. Amount: $${request.estimatedTotal}`,
          relatedEntityType: "purchase_request",
          relatedEntityId: requestId,
          actionUrl: `/approvals`,
        })
      }

      // Create audit log
      await tx.insert(schema.auditLogs).values({
        organizationId: user.organizationId!,
        entityType: "purchase_request",
        entityId: requestId,
        action: "submit",
        performedBy: user.id,
        metadata: {
          fromStatus: "draft",
          toStatus: "submitted",
          approversCount: approvalRoute.length,
        },
      })
    })

    return {
      success: true,
      message: "Request submitted for approval",
      approversCount: approvalRoute.length,
    }
  } catch (error) {
    console.error("[submitRequestForApproval] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit request",
    }
  }
}

// Approve a purchase request
export async function approveRequest(
  requestId: string,
  comments?: string
) {
  const { userId } = await auth()

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized",
    }
  }

  try {
    const db = getDb()
    const userRepo = new UserRepository()
    const user = await userRepo.findByClerkId(userId)

    if (!user?.organizationId || !user.id) {
      return {
        success: false,
        error: "User organization not found",
      }
    }

    // Get the purchase request
    const requests = await db
      .select()
      .from(schema.purchaseRequests)
      .where(eq(schema.purchaseRequests.id, requestId))

    if (requests.length === 0) {
      return {
        success: false,
        error: "Purchase request not found",
      }
    }

    const request = requests[0]

    // Verify user is an approver
    const approvals = await db
      .select()
      .from(schema.purchaseRequestApprovals)
      .where(
        and(
          eq(schema.purchaseRequestApprovals.purchaseRequestId, requestId),
          eq(schema.purchaseRequestApprovals.approverId, user.id)
        )
      )

    if (approvals.length === 0) {
      return {
        success: false,
        error: "You are not an approver for this request",
      }
    }

    const approval = approvals[0]

    if (approval.status !== "pending") {
      return {
        success: false,
        error: "This approval has already been processed",
      }
    }

    // Use transaction for atomicity
    await db.transaction(async (tx) => {
      // Mark this approval as approved
      await tx
        .update(schema.purchaseRequestApprovals)
        .set({
          status: "approved",
          approvedAt: new Date(),
          comments,
        })
        .where(eq(schema.purchaseRequestApprovals.id, approval.id))

      // Check if all approvals are complete
      const allApprovals = await tx
        .select()
        .from(schema.purchaseRequestApprovals)
        .where(eq(schema.purchaseRequestApprovals.purchaseRequestId, requestId))

      const pendingApprovals = allApprovals.filter((a) => a.status === "pending")

      if (pendingApprovals.length === 0) {
        // All approved - update request status
        await tx
          .update(schema.purchaseRequests)
          .set({
            status: "procurement_review",
            updatedAt: new Date(),
          })
          .where(eq(schema.purchaseRequests.id, requestId))

        // Create procurement assignment - assign to the first procurement manager in the org
        const procurementManagers = await tx
          .select({ id: schema.users.id })
          .from(schema.users)
          .where(
            and(
              eq(schema.users.organizationId, user.organizationId!),
              eq(schema.users.role, "procurement_manager")
            )
          )
          .limit(1)

        if (procurementManagers.length > 0) {
          await tx.insert(schema.procurementAssignments).values({
            organizationId: user.organizationId!,
            requestId,
            assignedTo: procurementManagers[0].id,
            status: "OPEN",
          })
        }

        // Notify requester
        await tx.insert(schema.notifications).values({
          userId: request.requestedBy,
          type: "approval_approved",
          title: `Request Approved: ${request.title}`,
          message: `Your purchase request "${request.title}" has been approved and is now in procurement review.`,
          relatedEntityType: "purchase_request",
          relatedEntityId: requestId,
          actionUrl: `/requests`,
        })
      } else {
        // Still pending - notify next approver
        const nextApprover = pendingApprovals[0]
        await tx.insert(schema.notifications).values({
          userId: nextApprover.approverId,
          type: "approval_request",
          title: `Approval Request: ${request.title}`,
          message: `A purchase request "${request.title}" is awaiting your approval.`,
          relatedEntityType: "purchase_request",
          relatedEntityId: requestId,
          actionUrl: `/approvals`,
        })
      }

      // Create audit log
      await tx.insert(schema.auditLogs).values({
        organizationId: user.organizationId!,
        entityType: "purchase_request",
        entityId: requestId,
        action: "approve",
        performedBy: user.id,
        metadata: {
          approverRole: "procurement_manager",
          comments,
        },
      })
    })

    return {
      success: true,
      message: "Request approved",
    }
  } catch (error) {
    console.error("[approveRequest] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve request",
    }
  }
}

// Reject a purchase request
export async function rejectRequest(
  requestId: string,
  reason: string
) {
  const { userId } = await auth()

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized",
    }
  }

  try {
    const db = getDb()
    const userRepo = new UserRepository()
    const user = await userRepo.findByClerkId(userId)

    if (!user?.organizationId || !user.id) {
      return {
        success: false,
        error: "User organization not found",
      }
    }

    // Get the purchase request
    const requests = await db
      .select()
      .from(schema.purchaseRequests)
      .where(eq(schema.purchaseRequests.id, requestId))

    if (requests.length === 0) {
      return {
        success: false,
        error: "Purchase request not found",
      }
    }

    const request = requests[0]

    // Verify user is an approver
    const approvals = await db
      .select()
      .from(schema.purchaseRequestApprovals)
      .where(
        and(
          eq(schema.purchaseRequestApprovals.purchaseRequestId, requestId),
          eq(schema.purchaseRequestApprovals.approverId, user.id)
        )
      )

    if (approvals.length === 0) {
      return {
        success: false,
        error: "You are not an approver for this request",
      }
    }

    const approval = approvals[0]

    if (approval.status !== "pending") {
      return {
        success: false,
        error: "This approval has already been processed",
      }
    }

    // Use transaction for atomicity
    await db.transaction(async (tx) => {
      // Mark approval as rejected
      await tx
        .update(schema.purchaseRequestApprovals)
        .set({
          status: "rejected",
          approvedAt: new Date(),
          comments: reason,
        })
        .where(eq(schema.purchaseRequestApprovals.id, approval.id))

      // Update request status to rejected
      await tx
        .update(schema.purchaseRequests)
        .set({
          status: "rejected",
          updatedAt: new Date(),
        })
        .where(eq(schema.purchaseRequests.id, requestId))

      // Notify requester
      await tx.insert(schema.notifications).values({
        userId: request.requestedBy,
        type: "approval_rejected",
        title: `Request Rejected: ${request.title}`,
        message: `Your purchase request "${request.title}" has been rejected. Reason: ${reason}`,
        relatedEntityType: "purchase_request",
        relatedEntityId: requestId,
        actionUrl: `/requests`,
      })

      // Create audit log
      await tx.insert(schema.auditLogs).values({
        organizationId: user.organizationId!,
        entityType: "purchase_request",
        entityId: requestId,
        action: "reject",
        performedBy: user.id,
        metadata: {
          approverRole: "procurement_manager",
          reason,
        },
      })
    })

    return {
      success: true,
      message: "Request rejected",
    }
  } catch (error) {
    console.error("[rejectRequest] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject request",
    }
  }
}

// Get pending approvals for current user
export async function getPendingApprovals() {
  const { userId } = await auth()

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized",
      approvals: [],
    }
  }

  try {
    const db = getDb()
    const userRepo = new UserRepository()
    const user = await userRepo.findByClerkId(userId)

    if (!user?.id) {
      return {
        success: false,
        error: "User not found",
        approvals: [],
      }
    }

    // Get pending approvals for this user
    const approvals = await db
      .select({
        approval: schema.purchaseRequestApprovals,
        request: schema.purchaseRequests,
      })
      .from(schema.purchaseRequestApprovals)
      .innerJoin(
        schema.purchaseRequests,
        eq(schema.purchaseRequestApprovals.purchaseRequestId, schema.purchaseRequests.id)
      )
      .where(
        and(
          eq(schema.purchaseRequestApprovals.approverId, user.id),
          eq(schema.purchaseRequestApprovals.status, "pending")
        )
      )
      .orderBy(desc(schema.purchaseRequests.createdAt))

    return {
      success: true,
      approvals: approvals.map((item) => ({
        ...item.approval,
        request: item.request,
      })),
    }
  } catch (error) {
    console.error("[getPendingApprovals] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch approvals",
      approvals: [],
    }
  }
}

// Mark notifications as read
export async function markNotificationsAsRead(notificationIds: string[]) {
  const { userId } = await auth()

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized",
    }
  }

  try {
    const db = getDb()
    const userRepo = new UserRepository()
    const user = await userRepo.findByClerkId(userId)

    if (!user?.id) {
      return {
        success: false,
        error: "User not found",
      }
    }

    await db
      .update(schema.notifications)
      .set({
        read: true,
      })
      .where(
        and(
          eq(schema.notifications.userId, user.id)
        )
      )

    return {
      success: true,
      message: "Notifications marked as read",
    }
  } catch (error) {
    console.error("[markNotificationsAsRead] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark notifications as read",
    }
  }
}
