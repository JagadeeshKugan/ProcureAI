import { eq } from "drizzle-orm"
import { getDb, schema } from "@/src/db"
import type { users } from "@/src/db/schema"

export type InsertUser = typeof users.$inferInsert
export type SelectUser = typeof users.$inferSelect

export class UserRepository {
  private db = getDb()

  async create(data: InsertUser) {
    const result = await this.db
      .insert(schema.users)
      .values(data)
      .returning()

    return result[0]
  }

  async findById(id: string) {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))

    return result[0] || null
  }

  async findByClerkId(clerkId: string) {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.clerkId, clerkId))

    return result[0] || null
  }

  async findByEmail(email: string) {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))

    return result[0] || null
  }

  async update(id: string, data: Partial<InsertUser>) {
    const result = await this.db
      .update(schema.users)
      .set(data)
      .where(eq(schema.users.id, id))
      .returning()

    return result[0] || null
  }

  async delete(id: string) {
    await this.db.delete(schema.users).where(eq(schema.users.id, id))
  }

  async upsertByClerkId(clerkId: string, data: InsertUser) {
    // Try to find existing user
    const existing = await this.findByClerkId(clerkId)

    if (existing) {
      // Update existing user
      return await this.update(existing.id, data)
    }

    // Create new user
    return await this.create(data)
  }
}

