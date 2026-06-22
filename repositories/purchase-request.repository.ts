import { eq, desc, and, like, sql } from "drizzle-orm"
import { getDb, schema } from "@/db"
import type {
  InsertPurchaseRequest,
  InsertPurchaseRequestItem,
} from "@/db/schema"

export class PurchaseRequestRepository {
  private db = getDb()

  async create(data: InsertPurchaseRequest) {
    const result = await this.db
      .insert(schema.purchaseRequests)
      .values(data)
      .returning()

    return result[0]
  }

  async createItems(items: InsertPurchaseRequestItem[]) {
    if (items.length === 0) return []
    const result = await this.db
      .insert(schema.purchaseRequestItems)
      .values(items)
      .returning()
    return result
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

  async findByOrganization(organizationId: string, limit: number = 50, offset: number = 0) {
    return await this.db
      .select()
      .from(schema.purchaseRequests)
      .where(eq(schema.purchaseRequests.organizationId, organizationId))
      .orderBy(desc(schema.purchaseRequests.createdAt))
      .limit(limit)
      .offset(offset)
  }

  async findItemsByRequestId(requestId: string) {
    const result = await this.db
      .select()
      .from(schema.purchaseRequestItems)
      .where(eq(schema.purchaseRequestItems.purchaseRequestId, requestId))
      .orderBy(schema.purchaseRequestItems.lineNumber)
    return result
  }

  async countByOrganization(organizationId: string) {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.purchaseRequests)
      .where(eq(schema.purchaseRequests.organizationId, organizationId))
    return (result[0]?.count as number) || 0
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

  async getApprovalRoute(
    organizationId: string,
    estimatedTotal: number,
    department: string
  ): Promise<string[]> {
    // Get organization members by role
    const deptManager = await this.db
      .select()
      .from(schema.organizationMembers)
      .where(
        and(
          eq(schema.organizationMembers.organizationId, organizationId),
          eq(schema.organizationMembers.role, "department_manager")
        )
      )
      .limit(1)

    const financeTeam = await this.db
      .select()
      .from(schema.organizationMembers)
      .where(
        and(
          eq(schema.organizationMembers.organizationId, organizationId),
          eq(schema.organizationMembers.role, "finance")
        )
      )
      .limit(1)

    const procurementTeam = await this.db
      .select()
      .from(schema.organizationMembers)
      .where(
        and(
          eq(schema.organizationMembers.organizationId, organizationId),
          eq(schema.organizationMembers.role, "procurement")
        )
      )
      .limit(1)

    const approvalRoute: string[] = []

    // Add department manager
    if (deptManager.length > 0) {
      approvalRoute.push(deptManager[0].userId)
    }

    // Add finance team if amount > 50000
    if (estimatedTotal > 50000 && financeTeam.length > 0) {
      approvalRoute.push(financeTeam[0].userId)
    }

    // Add procurement team
    if (procurementTeam.length > 0) {
      approvalRoute.push(procurementTeam[0].userId)
    }

    return approvalRoute
  }

  async createWithItems(
    request: InsertPurchaseRequest,
    items: InsertPurchaseRequestItem[]
  ) {
    let purchaseRequest: any
    let insertedItems: any[] = []

    await this.db.transaction(async (tx) => {
      // Insert purchase request
      const prResult = await tx
        .insert(schema.purchaseRequests)
        .values(request)
        .returning()

      purchaseRequest = prResult[0]

      // Insert items if provided
      if (items.length > 0) {
        const itemsWithRequestId = items.map((item) => ({
          ...item,
          purchaseRequestId: purchaseRequest.id,
        }))

        insertedItems = await tx
          .insert(schema.purchaseRequestItems)
          .values(itemsWithRequestId)
          .returning()
      }
    })

    return {
      purchaseRequest,
      items: insertedItems,
    }
  }
}

