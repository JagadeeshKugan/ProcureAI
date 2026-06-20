"use server"

import { getDb, schema } from "@/db"
import { eq, desc } from "drizzle-orm"

export async function getAuditLogs(organizationId: string, limit: number = 50) {
  try {
    const db = getDb()

    const logs = await db
      .select({
        id: schema.auditLogs.id,
        action: schema.auditLogs.action,
        entityType: schema.auditLogs.entityType,
        entityId: schema.auditLogs.entityId,
        userName: schema.users.name,
        userEmail: schema.users.email,
        oldValues: schema.auditLogs.oldValues,
        newValues: schema.auditLogs.newValues,
        metadata: schema.auditLogs.metadata,
        createdAt: schema.auditLogs.createdAt,
      })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.auditLogs.userId, schema.users.id))
      .where(eq(schema.auditLogs.organizationId, organizationId))
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(limit)

    return { success: true, data: logs }
  } catch (error) {
    console.error("[getAuditLogs Error]", error)
    return { success: false, error: "Failed to fetch audit logs" }
  }
}

export async function createAuditLog(
  organizationId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  oldValues?: any,
  newValues?: any,
  metadata?: any
) {
  try {
    const db = getDb()

    await db.insert(schema.auditLogs).values({
      organizationId,
      userId,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      metadata,
    })

    return { success: true }
  } catch (error) {
    console.error("[createAuditLog Error]", error)
    return { success: false, error: "Failed to create audit log" }
  }
}
