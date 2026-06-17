import { eq, and, desc } from "drizzle-orm"
import { getDb, schema } from "@/db"
import type { auditLogs } from "@/db/schema"

export type InsertAuditLog = typeof auditLogs.$inferInsert

export class AuditLogRepository {
  private db = getDb()

  async create(data: InsertAuditLog) {
    const result = await this.db
      .insert(schema.auditLogs)
      .values(data)
      .returning()

    return result[0]
  }

  async getByEntityId(entityType: string, entityId: string, limit = 50) {
    return await this.db
      .select()
      .from(schema.auditLogs)
      .where(
        and(
          eq(schema.auditLogs.entityType, entityType),
          eq(schema.auditLogs.entityId, entityId)
        )
      )
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(limit)
  }
}

