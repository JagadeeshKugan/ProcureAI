"use server"

import { auth } from "@clerk/nextjs/server"
import { getDb, schema } from "@/db"
import { eq, and } from "drizzle-orm"
import { ProcurementService } from "@/services/procurement.service"
import { UserRepository } from "@/repositories/user.repository"
import { AuditLogRepository } from "@/repositories/audit-log.repository"

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
 * Create RFQ from approved request
 */
export async function createRFQFromRequest(
  requestId: string,
  organizationId: string,
  vendorEmails: string[]
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const db = getDb()

    // Get request details
    const request = await db
      .select()
      .from(schema.purchaseRequests)
      .where(eq(schema.purchaseRequests.id, requestId))
      .limit(1)

    if (!request.length) {
      return { success: false, error: "Request not found" }
    }

    // Generate RFQ number
    const rfqCount = await db
      .select()
      .from(schema.rfqs)
      .where(eq(schema.rfqs.organizationId, organizationId))

    const rfqNumber = `RFQ-${new Date().getFullYear()}-${String(rfqCount.length + 1).padStart(4, "0")}`

    // Create RFQ
    const rfq = await db
      .insert(schema.rfqs)
      .values({
        organizationId,
        rfqNumber,
        title: request[0].title,
        description: request[0].description,
        requestId,
        status: "active",
        createdBy: userId,
      })
      .returning()

    // Create audit log
    const auditRepo = new AuditLogRepository()
    await auditRepo.create({
      organizationId,
      entityType: "rfq",
      entityId: rfq[0].id,
      action: "create",
      performedBy: userId,
      metadata: {
        requestId,
        rfqNumber,
        vendorCount: vendorEmails.length,
      },
    })

    console.log("[createRFQFromRequest] RFQ created:", { rfqNumber })

    return { success: true, data: rfq[0] }
  } catch (error) {
    console.error("[createRFQFromRequest] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create RFQ",
    }
  }
}

/**
 * Select vendor for request
 */
export async function selectVendorForRequest(
  requestId: string,
  rfqId: string | null,
  vendorId: string,
  organizationId: string,
  selectionReason?: string,
  aiScore?: number
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const procurementService = new ProcurementService()
    const result = await procurementService.selectVendor(
      requestId,
      rfqId,
      vendorId,
      organizationId,
      userId,
      selectionReason,
      aiScore
    )

    return result
  } catch (error) {
    console.error("[selectVendorForRequest] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to select vendor",
    }
  }
}

/**
 * Get available vendors for RFQ
 */
export async function getAvailableVendors(organizationId: string) {
  try {
    const db = getDb()

    const vendors = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
      })
      .from(schema.users)
      .where(
        and(
          eq(schema.users.organizationId, organizationId),
          eq(schema.users.role, "vendor")
        )
      )

    return { success: true, data: vendors }
  } catch (error) {
    console.error("[getAvailableVendors] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch vendors",
    }
  }
}

/**
 * Get RFQ details with vendor quotes
 */
export async function getRFQWithQuotes(rfqId: string) {
  try {
    const db = getDb()

    const rfq = await db
      .select()
      .from(schema.rfqs)
      .where(eq(schema.rfqs.id, rfqId))
      .limit(1)

    if (!rfq.length) {
      return { success: false, error: "RFQ not found" }
    }

    const quotes = await db
      .select({
        id: schema.vendorQuotes.id,
        vendorId: schema.vendorQuotes.vendorId,
        vendorName: schema.users.name,
        vendorEmail: schema.users.email,
        quotedPrice: schema.vendorQuotes.quotedPrice,
        deliveryDays: schema.vendorQuotes.deliveryDays,
        terms: schema.vendorQuotes.terms,
        createdAt: schema.vendorQuotes.createdAt,
      })
      .from(schema.vendorQuotes)
      .leftJoin(
        schema.users,
        eq(schema.vendorQuotes.vendorId, schema.users.id)
      )
      .where(eq(schema.vendorQuotes.rfqId, rfqId))

    return {
      success: true,
      data: { rfq: rfq[0], quotes },
    }
  } catch (error) {
    console.error("[getRFQWithQuotes] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch RFQ",
    }
  }
}

/**
 * Generate purchase order from vendor selection
 */
export async function generatePurchaseOrder(
  requestId: string,
  rfqId: string | null,
  vendorId: string,
  organizationId: string,
  totalAmount: string,
  expectedDeliveryDays?: number
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const db = getDb()

    // Verify vendor selection exists
    const vendorSelection = await db
      .select()
      .from(schema.vendorSelections)
      .where(eq(schema.vendorSelections.requestId, requestId))
      .limit(1)

    if (!vendorSelection.length) {
      return {
        success: false,
        error:
          "Vendor must be selected before generating PO",
      }
    }

    // Generate PO number
    const poCount = await db
      .select()
      .from(schema.purchaseOrders)
      .where(eq(schema.purchaseOrders.organizationId, organizationId))

    const year = new Date().getFullYear()
    const poNumber = `PO-${year}-${String(poCount.length + 1).padStart(4, "0")}`

    // Create purchase order
    const expectedDelivery = expectedDeliveryDays
      ? new Date(Date.now() + expectedDeliveryDays * 24 * 60 * 60 * 1000)
      : undefined

    const po = await db
      .insert(schema.purchaseOrders)
      .values({
        organizationId,
        requestId,
        vendorId,
        poNumber,
        status: "DRAFT",
        totalAmount,
        issuedAt: new Date(),
        expectedDelivery,
        createdBy: userId,
      })
      .returning()

    // Create audit log
    const auditRepo = new AuditLogRepository()
    await auditRepo.create({
      organizationId,
      entityType: "purchase_order",
      entityId: po[0].id,
      action: "create",
      performedBy: userId,
      metadata: {
        requestId,
        vendorId,
        poNumber,
        totalAmount,
      },
    })

    console.log("[generatePurchaseOrder] PO generated:", { poNumber })

    return { success: true, data: po[0] }
  } catch (error) {
    console.error("[generatePurchaseOrder] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate PO",
    }
  }
}

/**
 * Issue purchase order (change status from DRAFT to ISSUED)
 */
export async function issuePurchaseOrder(
  poId: string,
  organizationId: string
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const db = getDb()

    const po = await db
      .update(schema.purchaseOrders)
      .set({
        status: "ISSUED",
        issuedAt: new Date(),
      })
      .where(
        and(
          eq(schema.purchaseOrders.id, poId),
          eq(schema.purchaseOrders.organizationId, organizationId)
        )
      )
      .returning()

    if (!po.length) {
      return { success: false, error: "Purchase order not found" }
    }

    // Create audit log
    const auditRepo = new AuditLogRepository()
    await auditRepo.create({
      organizationId,
      entityType: "purchase_order",
      entityId: poId,
      action: "issue",
      performedBy: userId,
      metadata: {
        status: "ISSUED",
      },
    })

    console.log("[issuePurchaseOrder] PO issued:", { poId })

    return { success: true, data: po[0] }
  } catch (error) {
    console.error("[issuePurchaseOrder] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to issue PO",
    }
  }
}

/**
 * Get procurement timeline for a request
 */
export async function getProcurementTimeline(
  requestId: string,
  organizationId: string
) {
  try {
    const db = getDb()

    // Get all audit logs related to procurement for this request
    const timeline = await db
      .select()
      .from(schema.auditLogs)
      .where(
        and(
          eq(schema.auditLogs.organizationId, organizationId),
          eq(schema.auditLogs.metadata, requestId)
        )
      )
      .orderBy(schema.auditLogs.createdAt)

    // Get assignment history
    const assignments = await db
      .select()
      .from(schema.procurementAssignments)
      .where(eq(schema.procurementAssignments.requestId, requestId))

    // Get vendor selection
    const vendorSelection = await db
      .select()
      .from(schema.vendorSelections)
      .where(eq(schema.vendorSelections.requestId, requestId))

    // Get PO
    const po = await db
      .select()
      .from(schema.purchaseOrders)
      .where(eq(schema.purchaseOrders.requestId, requestId))

    // Get request approval history
    const request = await db
      .select()
      .from(schema.purchaseRequests)
      .where(eq(schema.purchaseRequests.id, requestId))

    // Build timeline
    const timelineEvents: any[] = []

    if (request.length) {
      timelineEvents.push({
        id: `req-${request[0].id}`,
        type: "request_created",
        title: "Purchase Request Created",
        status: request[0].status,
        timestamp: request[0].createdAt,
        description: `Request: ${request[0].requestNumber}`,
        amount: request[0].estimatedTotal,
      })
    }

    if (assignments.length) {
      assignments.forEach((assignment) => {
        timelineEvents.push({
          id: `assign-${assignment.id}`,
          type: "assigned",
          title: "Assigned to Procurement",
          status: assignment.status,
          timestamp: assignment.assignedAt,
          description: `Assignment ID: ${assignment.id}`,
        })
        if (assignment.completedAt) {
          timelineEvents.push({
            id: `completed-${assignment.id}`,
            type: "assignment_completed",
            title: "Procurement Assignment Completed",
            status: "COMPLETED",
            timestamp: assignment.completedAt,
            description: "Task completed",
          })
        }
      })
    }

    if (vendorSelection.length) {
      timelineEvents.push({
        id: `vendor-${vendorSelection[0].id}`,
        type: "vendor_selected",
        title: "Vendor Selected",
        status: "active",
        timestamp: vendorSelection[0].createdAt,
        description: `Vendor selection score: ${vendorSelection[0].aiScore || "N/A"}`,
        metadata: {
          reason: vendorSelection[0].selectionReason,
          score: vendorSelection[0].aiScore,
        },
      })
    }

    if (po.length) {
      timelineEvents.push({
        id: `po-${po[0].id}`,
        type: "po_created",
        title: "Purchase Order Created",
        status: po[0].status,
        timestamp: po[0].createdAt,
        description: `PO: ${po[0].poNumber}`,
        amount: po[0].totalAmount,
      })

      if (po[0].issuedAt) {
        timelineEvents.push({
          id: `po-issued-${po[0].id}`,
          type: "po_issued",
          title: "Purchase Order Issued",
          status: po[0].status,
          timestamp: po[0].issuedAt,
          description: `PO: ${po[0].poNumber}`,
        })
      }
    }

    // Sort by timestamp
    timelineEvents.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    return { success: true, data: timelineEvents }
  } catch (error) {
    console.error("[getProcurementTimeline] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch timeline",
    }
  }
}

/**
 * Get procurement audit logs
 */
export async function getProcurementAuditLogs(
  requestId: string,
  organizationId: string,
  limit: number = 50
) {
  try {
    const db = getDb()

    const logs = await db
      .select()
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.organizationId, organizationId))
      .limit(limit)

    return { success: true, data: logs }
  } catch (error) {
    console.error("[getProcurementAuditLogs] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch audit logs",
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
