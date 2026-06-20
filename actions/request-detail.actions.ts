"use server"

import { getDb, schema } from "@/db"
import { eq, and } from "drizzle-orm"

export async function getRequestDetails(requestId: string, organizationId: string) {
  try {
    const db = getDb()

    const request = await db
      .select({
        id: schema.purchaseRequests.id,
        requestNumber: schema.purchaseRequests.requestNumber,
        title: schema.purchaseRequests.title,
        description: schema.purchaseRequests.description,
        department: schema.purchaseRequests.department,
        priority: schema.purchaseRequests.priority,
        estimatedTotal: schema.purchaseRequests.estimatedTotal,
        currency: schema.purchaseRequests.currency,
        status: schema.purchaseRequests.status,
        requestedByName: schema.users.name,
        requestedByEmail: schema.users.email,
        createdAt: schema.purchaseRequests.createdAt,
        updatedAt: schema.purchaseRequests.updatedAt,
      })
      .from(schema.purchaseRequests)
      .leftJoin(
        schema.users,
        eq(schema.purchaseRequests.requestedBy, schema.users.id)
      )
      .where(
        and(
          eq(schema.purchaseRequests.id, requestId),
          eq(schema.purchaseRequests.organizationId, organizationId)
        )
      )
      .limit(1)

    if (!request.length) {
      return { success: false, error: "Request not found" }
    }

    // Get finance approval if exists
    const financeApproval = await db
      .select()
      .from(schema.financeApprovals)
      .where(eq(schema.financeApprovals.requestId, requestId))
      .limit(1)

    // Get purchase order if exists
    const po = await db
      .select()
      .from(schema.purchaseOrders)
      .where(eq(schema.purchaseOrders.requestId, requestId))
      .limit(1)

    // Get audit trail for this request
    const auditLogs = await db
      .select({
        id: schema.auditLogs.id,
        action: schema.auditLogs.action,
        entityType: schema.auditLogs.entityType,
        userName: schema.users.name,
        userEmail: schema.users.email,
        oldValues: schema.auditLogs.oldValues,
        newValues: schema.auditLogs.newValues,
        createdAt: schema.auditLogs.createdAt,
      })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.auditLogs.userId, schema.users.id))
      .where(
        and(
          eq(schema.auditLogs.organizationId, organizationId),
          eq(schema.auditLogs.entityId, requestId)
        )
      )
      .orderBy(schema.auditLogs.createdAt)

    return {
      success: true,
      request: request[0],
      financeApproval: financeApproval.length > 0 ? financeApproval[0] : null,
      purchaseOrder: po.length > 0 ? po[0] : null,
      auditLogs,
    }
  } catch (error) {
    console.error("[getRequestDetails Error]", error)
    return { success: false, error: "Failed to fetch request details" }
  }
}
