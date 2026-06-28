import { and, eq, inArray, sql } from "drizzle-orm"
import { getDb, schema } from "@/db"

export interface DashboardMetrics {
  totalVendors: number
  totalVendorsDelta: number
  pendingRequests: number
  pendingRequestsDelta: number
  activeRfqs: number
  activeRfqsDelta: number
  savings: number
  savingsDelta: number
}

export class DashboardService {
  private db = getDb()

  /**
   * Get total active vendor count for an organization
   */
  async getTotalVendors(organizationId: string): Promise<number> {
    try {
      const result = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.users)
        .where(
          and(
            eq(schema.users.organizationId, organizationId),
            eq(schema.users.role, "vendor"),
            eq(schema.users.status, "active")
          )
        )

      return (result[0]?.count as number) || 0
    } catch (error) {
      console.error("[DashboardService] Error fetching total vendors:", error)
      return 0
    }
  }

  /**
   * Get count of pending purchase requests (submitted, approved, procurement_review statuses)
   */
  async getPendingRequests(organizationId: string): Promise<number> {
    try {
      const result = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.purchaseRequests)
        .where(
          and(
            eq(schema.purchaseRequests.organizationId, organizationId),
            inArray(schema.purchaseRequests.status, [
              "submitted",
              "approved",
              "procurement_review",
            ])
          )
        )

      return (result[0]?.count as number) || 0
    } catch (error) {
      console.error("[DashboardService] Error fetching pending requests:", error)
      return 0
    }
  }

  /**
   * Get count of active RFQs (draft, open, awarded statuses)
   */
  async getActiveRfqs(organizationId: string): Promise<number> {
    try {
      const result = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.rfqs)
        .innerJoin(
          schema.purchaseRequests,
          eq(schema.rfqs.purchaseRequestId, schema.purchaseRequests.id)
        )
        .where(
          and(
            eq(schema.purchaseRequests.organizationId, organizationId),
            inArray(schema.rfqs.status, ["draft", "open", "awarded"])
          )
        )

      return (result[0]?.count as number) || 0
    } catch (error) {
      console.error("[DashboardService] Error fetching active RFQs:", error)
      return 0
    }
  }

  /**
   * Calculate procurement savings:
   * SUM(estimated_total from purchase_requests) - SUM(selected quotation prices from awarded RFQs)
   */
  async getProcurementSavings(organizationId: string): Promise<number> {
    try {
      // Get total estimated budget from purchase requests
      const estimatedResult = await this.db
        .select({
          total: sql<number>`COALESCE(SUM(CAST(estimated_total AS NUMERIC)), 0)`,
        })
        .from(schema.purchaseRequests)
        .where(eq(schema.purchaseRequests.organizationId, organizationId))

      const estimatedTotal = (estimatedResult[0]?.total as number) || 0

      // Get actual spend from selected quotations in awarded RFQs
      // When an RFQ is awarded, its selected quotation price becomes the actual spend
      const actualResult = await this.db
        .select({
          total: sql<number>`COALESCE(SUM(CAST(q.price AS NUMERIC)), 0)`,
        })
        .from(schema.rfqs)
        .innerJoin(
          schema.quotations,
          and(
            eq(schema.rfqs.id, schema.quotations.rfqId),
            eq(schema.quotations.status, "accepted") // Selected/accepted quotations
          )
        )
        .innerJoin(
          schema.purchaseRequests,
          eq(schema.rfqs.purchaseRequestId, schema.purchaseRequests.id)
        )
        .where(
          and(
            eq(schema.purchaseRequests.organizationId, organizationId),
            eq(schema.rfqs.status, "awarded") // Only count awarded RFQs
          )
        )

      const actualSpend = (actualResult[0]?.total as number) || 0

      // Savings = estimated - actual
      return Math.max(0, estimatedTotal - actualSpend)
    } catch (error) {
      console.error("[DashboardService] Error calculating procurement savings:", error)
      return 0
    }
  }

  /**
   * Get all dashboard metrics for an organization in parallel
   */
  async getOrganizationMetrics(organizationId: string): Promise<DashboardMetrics> {
    try {
      // Execute all queries in parallel
      const [totalVendors, pendingRequests, activeRfqs, savings] = await Promise.all([
        this.getTotalVendors(organizationId),
        this.getPendingRequests(organizationId),
        this.getActiveRfqs(organizationId),
        this.getProcurementSavings(organizationId),
      ])

      // Calculate deltas (these would ideally be calculated against previous period,
      // but for now we return fixed values as per original data)
      return {
        totalVendors,
        totalVendorsDelta: 12, // TODO: Calculate from previous period
        pendingRequests,
        pendingRequestsDelta: -8, // TODO: Calculate from previous period
        activeRfqs,
        activeRfqsDelta: 4, // TODO: Calculate from previous period
        savings,
        savingsDelta: 18.4, // TODO: Calculate from previous period
      }
    } catch (error) {
      console.error("[DashboardService] Error fetching dashboard metrics:", error)
      // Return zero values on error
      return {
        totalVendors: 0,
        totalVendorsDelta: 0,
        pendingRequests: 0,
        pendingRequestsDelta: 0,
        activeRfqs: 0,
        activeRfqsDelta: 0,
        savings: 0,
        savingsDelta: 0,
      }
    }
  }
}
