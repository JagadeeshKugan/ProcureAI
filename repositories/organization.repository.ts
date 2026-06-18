import { eq } from "drizzle-orm"
import { getDb, schema } from "@/db"
import type { organizations } from "@/db/schema"

export type InsertOrganization = typeof organizations.$inferInsert
export type SelectOrganization = typeof organizations.$inferSelect

export class OrganizationRepository {
  private db = getDb()

  async create(data: InsertOrganization) {
    const result = await this.db
      .insert(schema.organizations)
      .values(data)
      .returning()

    return result[0]
  }

  async findById(id: string) {
    const result = await this.db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, id))

    return result[0] || null
  }

  async findByClerkOrgId(clerkOrgId: string) {
    const result = await this.db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.clerkOrgId, clerkOrgId))

    return result[0] || null
  }

  async update(id: string, data: Partial<InsertOrganization>) {
    const result = await this.db
      .update(schema.organizations)
      .set(data)
      .where(eq(schema.organizations.id, id))
      .returning()

    return result[0] || null
  }

  async upsertByClerkOrgId(clerkOrgId: string, data: InsertOrganization) {
    // Try to find existing organization
    const existing = await this.findByClerkOrgId(clerkOrgId)

    if (existing) {
      // Update existing organization
      return await this.update(existing.id, data)
    }

    // Create new organization
    return await this.create(data)
  }
}
