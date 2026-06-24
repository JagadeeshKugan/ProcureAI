"use server"

import { auth } from "@clerk/nextjs/server"
import { getDb, schema } from "@/db"
import { eq, and } from "drizzle-orm"
import { ProcurementService } from "@/services/procurement.service"
import { UserRepository } from "@/repositories/user.repository"

/**
 * Get procurement dashboard data
 */
export async function getProcurementDashboard(organizationId: string) {
  try {
    const { userId, orgRole } = await auth()

    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    // Only procurement managers and admins can access
    if (orgRole !== "org:admin" && orgRole !== "org:procurement_manager") {
      return {
        success: false,
        error: "Unauthorized - only procurement managers and admins can access",
      }
    }

    const db = getDb()
    const procurementService = new ProcurementService()

    // Get metrics
    const metrics = await procurementService.getDashboardMetrics(organizationId)
    if (!metrics.success) {
      return metrics
    }

    // Get approved requests
    const approvedRequests = await procurementService.getApprovedRequests(
      organizationId
    )
    if (!approvedRequests.success) {
      return approvedRequests
    }

    // Get active RFQs
    const rfqs = await db
      .select()
      .from(schema.rfqs)
      .where(
        and(
          eq(schema.rfqs.organizationId, organizationId),
          eq(schema.rfqs.status, "active")
        )
      )

    // Get vendor selections with vendor info
    const vendorSelections = await db
      .select({
        id: schema.vendorSelections.id,
        requestId: schema.vendorSelections.requestId,
        vendorId: schema.vendorSelections.vendorId,
        vendorName: schema.users.name,
        selectionReason: schema.vendorSelections.selectionReason,
        aiScore: schema.vendorSelections.aiScore,
        createdAt: schema.vendorSelections.createdAt,
      })
      .from(schema.vendorSelections)
      .leftJoin(
        schema.users,
        eq(schema.vendorSelections.vendorId, schema.users.id)
      )
      .where(eq(schema.vendorSelections.organizationId, organizationId))

    // Get purchase orders
    const purchaseOrders = await db
      .select({
        id: schema.purchaseOrders.id,
        poNumber: schema.purchaseOrders.poNumber,
        vendorId: schema.purchaseOrders.vendorId,
        vendorName: schema.users.name,
        totalAmount: schema.purchaseOrders.totalAmount,
        status: schema.purchaseOrders.status,
        createdAt: schema.purchaseOrders.createdAt,
      })
      .from(schema.purchaseOrders)
      .leftJoin(
        schema.users,
        eq(schema.purchaseOrders.vendorId, schema.users.id)
      )
      .where(eq(schema.purchaseOrders.organizationId, organizationId))

    return {
      success: true,
      data: {
        metrics: metrics.data,
        approvedRequests: approvedRequests.data,
        rfqs,
        vendorSelections,
        purchaseOrders,
      },
    }
  } catch (error) {
    console.error("[getProcurementDashboard] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch procurement dashboard",
    }
  }
}

/**
 * Get procurement assignments for user
 */
export async function getProcurementAssignments(organizationId: string) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const procurementService = new ProcurementService()
    const result = await procurementService.getUserAssignments(userId)

    return result
  } catch (error) {
    console.error("[getProcurementAssignments] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch assignments",
    }
  }
}

/**
 * Assign request to procurement
 */
export async function assignRequestToProcurement(
  requestId: string,
  organizationId: string,
  assignedTo: string
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const procurementService = new ProcurementService()
    const result = await procurementService.assignRequestToProcurement(
      requestId,
      organizationId,
      assignedTo,
      userId
    )

    return result
  } catch (error) {
    console.error("[assignRequestToProcurement] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to assign request",
    }
  }
}

/**
 * Update assignment status
 */
export async function updateAssignmentStatus(
  assignmentId: string,
  status: string,
  organizationId: string
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const procurementService = new ProcurementService()
    const result = await procurementService.updateAssignmentStatus(
      assignmentId,
      status,
      organizationId,
      userId
    )

    return result
  } catch (error) {
    console.error("[updateAssignmentStatus] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update status",
    }
  }
}

/**
 * Bulk assign approved requests to procurement managers
 */
export async function bulkAssignRequests(
  organizationId: string,
  requestIds: string[],
  assignedTo: string
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const procurementService = new ProcurementService()
    const results = []

    for (const requestId of requestIds) {
      const result = await procurementService.assignRequestToProcurement(
        requestId,
        organizationId,
        assignedTo,
        userId
      )
      results.push(result)
    }

    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    console.log(
      "[bulkAssignRequests] Bulk assignment completed:",
      { successful, failed }
    )

    return {
      success: failed === 0,
      data: { successful, failed, results },
      error: failed > 0 ? `${failed} requests failed to assign` : undefined,
    }
  } catch (error) {
    console.error("[bulkAssignRequests] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to bulk assign requests",
    }
  }
}

/**
 * Get procurement queue for a specific user
 */
export async function getProcurementQueue(organizationId: string) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const db = getDb()

    // Get assignments for the current user with request details
    const assignments = await db
      .select({
        assignmentId: schema.procurementAssignments.id,
        assignmentStatus: schema.procurementAssignments.status,
        assignedAt: schema.procurementAssignments.assignedAt,
        requestId: schema.purchaseRequests.id,
        requestNumber: schema.purchaseRequests.requestNumber,
        title: schema.purchaseRequests.title,
        department: schema.purchaseRequests.department,
        estimatedTotal: schema.purchaseRequests.estimatedTotal,
        currency: schema.purchaseRequests.currency,
        priority: schema.purchaseRequests.priority,
        requestStatus: schema.purchaseRequests.status,
      })
      .from(schema.procurementAssignments)
      .leftJoin(
        schema.purchaseRequests,
        eq(
          schema.procurementAssignments.requestId,
          schema.purchaseRequests.id
        )
      )
      .where(
        and(
          eq(schema.procurementAssignments.assignedTo, userId),
          eq(schema.procurementAssignments.organizationId, organizationId)
        )
      )

    return {
      success: true,
      data: assignments,
    }
  } catch (error) {
    console.error("[getProcurementQueue] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch queue",
    }
  }
}
