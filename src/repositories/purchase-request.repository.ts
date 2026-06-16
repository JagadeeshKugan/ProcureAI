import { eq, desc, and, like } from "drizzle-orm"
import { getDb, schema } from "@/src/db"
import type { InsertPurchaseRequest } from "@/src/db/schema"

export class PurchaseRequestRepository {
  private db = getDb()

  async create(data: InsertPurchaseRequest) {
    const result = await this.db
      .insert(schema.purchaseRequests)
      .values(data)
      .returning()

    return result[0]
  }

  async findById(id: string) {
    const result = await this.db
      .select()
      .from(schema.purchaseRequests)
      .where(eq(schema.purchaseRequests.id, id))

    return result[0] || null
  }

  async findByRequestNumber(requestNumber: string) {
    const result = await this.db
      .select()
      .from(schema.purchaseRequests)
      .where(eq(schema.purchaseRequests.requestNumber, requestNumber))

    return result[0] || null
  }

  async findByRequestedBy(userId: string) {
    return await this.db
      .select()
      .from(schema.purchaseRequests)
      .where(eq(schema.purchaseRequests.requestedBy, userId))
      .orderBy(desc(schema.purchaseRequests.createdAt))
  }

  async findByDepartment(department: string) {
    return await this.db
      .select()
      .from(schema.purchaseRequests)
      .where(eq(schema.purchaseRequests.department, department))
      .orderBy(desc(schema.purchaseRequests.createdAt))
  }

  async search(query: string, department?: string, status?: string) {
    const conditions: any[] = [
      like(schema.purchaseRequests.title, `%${query}%`),
    ]

    if (department) {
      conditions.push(eq(schema.purchaseRequests.department, department))
    }

    if (status) {
      conditions.push(eq(schema.purchaseRequests.status, status))
    }

    return await this.db
      .select()
      .from(schema.purchaseRequests)
      .where(and(...conditions))
      .orderBy(desc(schema.purchaseRequests.createdAt))
  }

  async update(id: string, data: Partial<InsertPurchaseRequest>) {
    const result = await this.db
      .update(schema.purchaseRequests)
      .set(data)
      .where(eq(schema.purchaseRequests.id, id))
      .returning()

    return result[0] || null
  }

  async delete(id: string) {
    await this.db
      .delete(schema.purchaseRequests)
      .where(eq(schema.purchaseRequests.id, id))
  }

  async getNextRequestNumber(year: number): Promise<string> {
    const result = await this.db
      .select()
      .from(schema.purchaseRequests)
      .where(like(schema.purchaseRequests.requestNumber, `PR-${year}-%`))
      .orderBy(desc(schema.purchaseRequests.requestNumber))
      .limit(1)

    if (result.length === 0) {
      return `PR-${year}-0001`
    }

    const lastNumber = parseInt(
      result[0].requestNumber.split("-").pop() || "0"
    )
    return `PR-${year}-${String(lastNumber + 1).padStart(4, "0")}`
  }
}

