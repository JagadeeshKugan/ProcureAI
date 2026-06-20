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

export async function createAuditLog(
  organizationId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: any
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Unauthorized" }
    }

    const db = getDb()

    // Get the app user ID from Clerk ID
    const users = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.clerkId, userId))
      .limit(1)

    if (!users || users.length === 0) {
      return { success: false, error: "User not found in database" }
    }

    const appUserId = users[0].id

    await db.insert(schema.auditLogs).values({
      organizationId,
      action,
      entityType,
      entityId,
      performedBy: appUserId,
      metadata,
    })

    return { success: true }
  } catch (error) {
    console.error("[createAuditLog Error]", error)
    return { success: false, error: "Failed to create audit log" }
  }
}
