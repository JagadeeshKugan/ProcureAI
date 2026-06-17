import type { InsertRfq } from "@/db/schema"
import { getDb, schema } from "@/db"
import { eq, desc, and, like, count, gt } from "drizzle-orm"

export interface RFQFilters {
  status?: string
  department?: string
  searchQuery?: string
  limit?: number
  offset?: number
}

export interface RFQResponse {
  success: boolean
  data?: any
  error?: string
}

export class RFQService {
  private db = getDb()

  async createRFQ(
    purchaseRequestId: string,
    title: string,
    description?: string
  ): Promise<RFQResponse> {
    try {
      // Generate RFQ number
      const year = new Date().getFullYear()
      const rfqResult = await this.db
        .select({ count: count() })
        .from(schema.rfqs)
        .where(like(schema.rfqs.rfqNumber, `RFQ-${year}-%`))

      const nextNumber = (rfqResult[0]?.count || 0) + 1
      const rfqNumber = `RFQ-${year}-${String(nextNumber).padStart(4, "0")}`

      const rfqData: InsertRfq = {
        rfqNumber,
        purchaseRequestId,
        title,
        description,
        status: "draft",
      }

      const result = await this.db.insert(schema.rfqs).values(rfqData).returning()

      return {
        success: true,
        data: result[0],
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create RFQ",
      }
    }
  }

  async getRFQById(rfqId: string) {
    const result = await this.db
      .select()
      .from(schema.rfqs)
      .where(eq(schema.rfqs.id, rfqId))

    return result[0] || null
  }

  async getRFQsWithFilters(filters: RFQFilters) {
    const conditions: any[] = []

    if (filters.status) {
      conditions.push(eq(schema.rfqs.status, filters.status))
    }

    if (filters.department) {
      conditions.push(eq(schema.purchaseRequests.department, filters.department))
    }

    if (filters.searchQuery) {
      conditions.push(like(schema.rfqs.title, `%${filters.searchQuery}%`))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const limit = filters.limit || 20
    const offset = filters.offset || 0

    return await this.db
      .select()
      .from(schema.rfqs)
      .leftJoin(
        schema.purchaseRequests,
        eq(schema.rfqs.purchaseRequestId, schema.purchaseRequests.id)
      )
      .where(whereClause)
      .orderBy(desc(schema.rfqs.createdAt))
      .limit(limit)
      .offset(offset)
  }

  async getRFQStats() {
    const total = await this.db
      .select({ count: count() })
      .from(schema.rfqs)

    const byStatus = await this.db
      .select({
        status: schema.rfqs.status,
        count: count(),
      })
      .from(schema.rfqs)
      .groupBy(schema.rfqs.status)

    return {
      total: total[0]?.count || 0,
      byStatus,
    }
  }

  async updateRFQStatus(rfqId: string, status: string): Promise<RFQResponse> {
    try {
      const result = await this.db
        .update(schema.rfqs)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(schema.rfqs.id, rfqId))
        .returning()

      return {
        success: true,
        data: result[0],
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update RFQ",
      }
    }
  }
}
