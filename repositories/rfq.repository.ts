import { eq, desc, and, like, count } from "drizzle-orm"
import { getDb, schema } from "@/db"

export interface PaginationParams {
  limit: number
  offset: number
}

export class RFQRepository {
  private db = getDb()

  async findById(rfqId: string) {
    const result = await this.db
      .select()
      .from(schema.rfqs)
      .where(eq(schema.rfqs.id, rfqId))

    return result[0] || null
  }

  async findByStatus(status: string, pagination: PaginationParams) {
    return await this.db
      .select()
      .from(schema.rfqs)
      .where(eq(schema.rfqs.status, status))
      .orderBy(desc(schema.rfqs.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset)
  }

  async findByDepartment(department: string, pagination: PaginationParams) {
    return await this.db
      .select()
      .from(schema.rfqs)
      .innerJoin(
        schema.purchaseRequests,
        eq(schema.rfqs.purchaseRequestId, schema.purchaseRequests.id)
      )
      .where(eq(schema.purchaseRequests.department, department))
      .orderBy(desc(schema.rfqs.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset)
  }

  async search(query: string, pagination: PaginationParams) {
    return await this.db
      .select()
      .from(schema.rfqs)
      .where(like(schema.rfqs.title, `%${query}%`))
      .orderBy(desc(schema.rfqs.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset)
  }

  async getTotal() {
    const result = await this.db
      .select({ count: count() })
      .from(schema.rfqs)

    return result[0]?.count || 0
  }

  async update(rfqId: string, data: any) {
    const result = await this.db
      .update(schema.rfqs)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.rfqs.id, rfqId))
      .returning()

    return result[0] || null
  }
}
