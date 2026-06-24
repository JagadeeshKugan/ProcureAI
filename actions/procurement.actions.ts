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
