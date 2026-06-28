import { getDb, schema } from "@/db"
import { eq, and, desc } from "drizzle-orm"
import {
  InsertProcurementAssignment,
  SelectProcurementAssignment,
  InsertVendorSelection,
  SelectVendorSelection,
} from "@/db/schema"

export class ProcurementRepository {
  private db = getDb()

  /**
   * Create a procurement assignment for an approved request
   */
  async createAssignment(
    data: InsertProcurementAssignment
  ): Promise<SelectProcurementAssignment> {
    const result = await this.db
      .insert(schema.procurementAssignments)
      .values(data)
      .returning()

    return result[0]!
  }

  /**
   * Get procurement assignment for a specific request
   */
  async getAssignmentByRequest(
    requestId: string
  ): Promise<SelectProcurementAssignment | null> {
    const result = await this.db
      .select()
      .from(schema.procurementAssignments)
      .where(eq(schema.procurementAssignments.requestId, requestId))
      .limit(1)

    return result[0] || null
  }

  /**
   * Get all assignments for a procurement manager
   */
  async getAssignmentsByUser(
    userId: string,
    status?: string
  ): Promise<SelectProcurementAssignment[]> {
    const conditions = [eq(schema.procurementAssignments.assignedTo, userId)]

    if (status) {
      conditions.push(eq(schema.procurementAssignments.status, status))
    }

    return await this.db
      .select()
      .from(schema.procurementAssignments)
      .where(and(...conditions))
      .orderBy(desc(schema.procurementAssignments.assignedAt))
  }

  /**
   * Get all assignments in an organization
   */
  async getAssignmentsByOrganization(
    organizationId: string
  ): Promise<SelectProcurementAssignment[]> {
    return await this.db
      .select()
      .from(schema.procurementAssignments)
      .where(
        eq(schema.procurementAssignments.organizationId, organizationId)
      )
      .orderBy(desc(schema.procurementAssignments.assignedAt))
  }

  /**
   * Update assignment status
   */
  async updateAssignmentStatus(
    assignmentId: string,
    status: string
  ): Promise<SelectProcurementAssignment | null> {
    const result = await this.db
      .update(schema.procurementAssignments)
      .set({
        status,
        completedAt:
          status === "COMPLETED" ? new Date() : null,
      })
      .where(eq(schema.procurementAssignments.id, assignmentId))
      .returning()

    return result[0] || null
  }

  /**
   * Create a vendor selection
   */
  async createVendorSelection(
    data: InsertVendorSelection
  ): Promise<SelectVendorSelection> {
    const result = await this.db
      .insert(schema.vendorSelections)
      .values(data)
      .returning()

    return result[0]!
  }

  /**
   * Get vendor selection for a request (if any)
   */
  async getVendorSelectionByRequest(
    requestId: string
  ): Promise<SelectVendorSelection | null> {
    const result = await this.db
      .select()
      .from(schema.vendorSelections)
      .where(eq(schema.vendorSelections.requestId, requestId))
      .limit(1)

    return result[0] || null
  }

  /**
   * Get all vendor selections in an organization
   */
  async getVendorSelectionsByOrganization(
    organizationId: string
  ): Promise<SelectVendorSelection[]> {
    return await this.db
      .select()
      .from(schema.vendorSelections)
      .where(eq(schema.vendorSelections.organizationId, organizationId))
      .orderBy(desc(schema.vendorSelections.createdAt))
  }

  /**
   * Count approved requests awaiting procurement assignment
   */
  async countPendingRequests(organizationId: string): Promise<number> {
    const result = await this.db
      .select()
      .from(schema.purchaseRequests)
      .where(
        and(
          eq(schema.purchaseRequests.organizationId, organizationId),
          eq(schema.purchaseRequests.status, "finance_approved")
        )
      )

    return result.length
  }

  /**
   * Get approved requests ready for procurement
   */
  async getApprovedRequests(organizationId: string) {
    return await this.db
      .select()
      .from(schema.purchaseRequests)
      .where(
        and(
          eq(schema.purchaseRequests.organizationId, organizationId),
          eq(schema.purchaseRequests.status, "procurement_review")
        )
      )
      .orderBy(desc(schema.purchaseRequests.createdAt))
  }

  /**
   * Get procurement metrics for dashboard
   */
  async getProcurementMetrics(organizationId: string) {
    // Get count by status
    const allRequests = await this.db
      .select()
      .from(schema.purchaseRequests)
      .where(
        eq(schema.purchaseRequests.organizationId, organizationId)
      )

    const approvedCount = allRequests.filter(
      (r) => r.status === "procurement_review"
    ).length
    const rfqCount = allRequests.filter((r) => r.status === "in_rfq").length
    const completedCount = allRequests.filter(
      (r) => r.status === "rfq_created"
    ).length

    const assignments = await this.getAssignmentsByOrganization(organizationId)
    const activeAssignments = assignments.filter(
      (a) => a.status !== "COMPLETED"
    ).length

    return {
      approvedRequests: approvedCount,
      openRFQs: rfqCount,
      activeAssignments,
      completedProcurements: completedCount,
    }
  }
}
