"use server"

import { getDb, schema } from "@/db"
import { eq, desc } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"

export async function getAuditLogs(organizationId: string, limit: number = 50) {
  try {
    const db = getDb()

    const logs = await db
      .select({
        id: schema.auditLogs.id,
        organizationId: schema.auditLogs.organizationId,
        action: schema.auditLogs.action,
        entityType: schema.auditLogs.entityType,
        entityId: schema.auditLogs.entityId,
        userName: schema.users.name,
        userEmail: schema.users.email,
        metadata: schema.auditLogs.metadata,
        createdAt: schema.auditLogs.createdAt,
      })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.auditLogs.performedBy, schema.users.id))
      .where(eq(schema.auditLogs.organizationId, organizationId))
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(limit)

    return { success: true, data: logs }
  } catch (error) {
    console.error("[getAuditLogs Error]", error)
    return { success: false, error: "Failed to fetch audit logs" }
  }
}


