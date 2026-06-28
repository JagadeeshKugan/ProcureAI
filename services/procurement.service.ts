import { ProcurementRepository } from "@/repositories/procurement.repository"
import { AuditLogRepository } from "@/repositories/audit-log.repository"
import { UserRepository } from "@/repositories/user.repository"
import { PurchaseRequestRepository } from "@/repositories/purchase-request.repository"
import {
  InsertProcurementAssignment,
  InsertVendorSelection,
} from "@/db/schema"
import { getDb, schema } from "@/db"
import { eq } from "drizzle-orm"

export interface ProcurementResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export class ProcurementService {
  private procurementRepo: ProcurementRepository
  private auditRepo: AuditLogRepository
  private userRepo: UserRepository
  private requestRepo: PurchaseRequestRepository

  constructor() {
    this.procurementRepo = new ProcurementRepository()
    this.auditRepo = new AuditLogRepository()
    this.userRepo = new UserRepository()
    this.requestRepo = new PurchaseRequestRepository()
  }

  /**
   * Assign an approved request to a procurement manager
   */
  async assignRequestToProcurement(
    requestId: string,
    organizationId: string,
    assignedTo: string,
    performedBy: string
  ): Promise<ProcurementResponse> {
    try {
      // Verify request exists and is approved
      const request = await this.requestRepo.findById(requestId)
      if (!request) {
        return { success: false, error: "Request not found" }
      }

      if (request.status !== "finance_approved") {
        return {
          success: false,
          error: `Request must be finance approved to assign to procurement (current status: ${request.status})`,
        }
      }

      // Check for existing assignment
      const existing = await this.procurementRepo.getAssignmentByRequest(
        requestId
      )
      if (existing) {
        return { success: false, error: "Request is already assigned" }
      }

      // Create assignment
      const assignment = await this.procurementRepo.createAssignment({
        requestId,
        organizationId,
        assignedTo,
        status: "OPEN",
      } as InsertProcurementAssignment)

      // Create audit log
      await this.auditRepo.create({
        organizationId,
        entityType: "procurement_assignment",
        entityId: assignment.id,
        action: "create",
        performedBy,
        metadata: {
          requestId,
          assignedTo,
          status: "OPEN",
        },
      })

      console.log("[ProcurementService] Request assigned to procurement:", {
        requestId,
        assignedTo,
      })

      return { success: true, data: assignment }
    } catch (error) {
      console.error("[ProcurementService] Error assigning request:", error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to assign request",
      }
    }
  }

  /**
   * Update procurement assignment status
   */
  async updateAssignmentStatus(
    assignmentId: string,
    status: string,
    organizationId: string,
    performedBy: string
  ): Promise<ProcurementResponse> {
    try {
      const assignment = await this.procurementRepo.updateAssignmentStatus(
        assignmentId,
        status
      )

      if (!assignment) {
        return { success: false, error: "Assignment not found" }
      }

      // Create audit log
      await this.auditRepo.create({
        organizationId,
        entityType: "procurement_assignment",
        entityId: assignmentId,
        action: "update_status",
        performedBy,
        metadata: {
          newStatus: status,
        },
      })

      console.log("[ProcurementService] Assignment status updated:", {
        assignmentId,
        status,
      })

      return { success: true, data: assignment }
    } catch (error) {
      console.error("[ProcurementService] Error updating assignment:", error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update assignment",
      }
    }
  }

  /**
   * Select a vendor for a request (creates or updates vendor selection)
   */
  async selectVendor(
    requestId: string,
    rfqId: string | null,
    vendorId: string,
    organizationId: string,
    selectedBy: string,
    selectionReason?: string,
    aiScore?: number
  ): Promise<ProcurementResponse> {
    try {
      // Verify request exists
      const request = await this.requestRepo.findById(requestId)
      if (!request) {
        return { success: false, error: "Request not found" }
      }

      // Check if vendor already selected
      const existing = await this.procurementRepo.getVendorSelectionByRequest(
        requestId
      )
      if (existing) {
        return {
          success: false,
          error: "Vendor is already selected for this request",
        }
      }

      // Create vendor selection
      const selection = await this.procurementRepo.createVendorSelection({
        requestId,
        rfqId,
        vendorId,
        organizationId,
        selectedBy,
        selectionReason,
        aiScore,
      } as InsertVendorSelection)

      // Create audit log
      await this.auditRepo.create({
        organizationId,
        entityType: "vendor_selection",
        entityId: selection.id,
        action: "create",
        performedBy: selectedBy,
        metadata: {
          requestId,
          vendorId,
          reason: selectionReason,
          aiScore,
        },
      })

      console.log("[ProcurementService] Vendor selected:", {
        requestId,
        vendorId,
      })

      return { success: true, data: selection }
    } catch (error) {
      console.error("[ProcurementService] Error selecting vendor:", error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to select vendor",
      }
    }
  }

  /**
   * Get dashboard metrics for procurement manager
   */
  async getDashboardMetrics(
    organizationId: string
  ): Promise<ProcurementResponse> {
    try {
      const metrics = await this.procurementRepo.getProcurementMetrics(
        organizationId
      )

      return { success: true, data: metrics }
    } catch (error) {
      console.error(
        "[ProcurementService] Error fetching metrics:",
        error
      )
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch metrics",
      }
    }
  }

  /**
   * Get approved requests for procurement manager
   */
  async getApprovedRequests(
    organizationId: string
  ): Promise<ProcurementResponse> {
    try {
      const requests = await this.procurementRepo.getApprovedRequests(
        organizationId
      )

      return { success: true, data: requests }
    } catch (error) {
      console.error(
        "[ProcurementService] Error fetching approved requests:",
        error
      )
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch requests",
      }
    }
  }

  /**
   * Get assignments for a user
   */
  async getUserAssignments(
    userId: string,
    status?: string
  ): Promise<ProcurementResponse> {
    try {
      const assignments = await this.procurementRepo.getAssignmentsByUser(
        userId,
        status
      )

      return { success: true, data: assignments }
    } catch (error) {
      console.error(
        "[ProcurementService] Error fetching user assignments:",
        error
      )
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch assignments",
      }
    }
  }

  /**
   * Synchronize RFQ status with purchase request status changes
   * Maps PR status changes to RFQ status updates
   */
  async syncRFQStatusWithPurchaseRequest(
    requestId: string,
    newStatus: string,
    organizationId: string,
    performedBy: string
  ): Promise<void> {
    try {
      const db = getDb()

      // Find RFQ linked to this purchase request
      const rfq = await db
        .select()
        .from(schema.rfqs)
        .where(eq(schema.rfqs.purchaseRequestId, requestId))
        .limit(1)

      // If no RFQ exists, nothing to sync
      if (!rfq.length) {
        return
      }

      const currentRfq = rfq[0]
      let newRfqStatus: string | null = null
      let auditAction: string | null = null

      // Map PR status to RFQ status
      switch (newStatus) {
        case "vendor_selected":
          if (currentRfq.status !== "awarded") {
            newRfqStatus = "awarded"
            auditAction = "RFQ_AWARDED"
          }
          break
        case "po_created":
          if (currentRfq.status !== "awarded") {
            newRfqStatus = "awarded"
            auditAction = "RFQ_AWARDED"
          }
          break
        case "completed":
          if (currentRfq.status !== "closed") {
            newRfqStatus = "closed"
            auditAction = "RFQ_CLOSED"
          }
          break
        case "cancelled":
          if (currentRfq.status !== "cancelled") {
            newRfqStatus = "cancelled"
            auditAction = "RFQ_CANCELLED"
          }
          break
      }

      // Only update if status differs
      if (newRfqStatus) {
        // Update RFQ status
        await db
          .update(schema.rfqs)
          .set({
            status: newRfqStatus,
            updatedAt: new Date(),
          })
          .where(eq(schema.rfqs.id, currentRfq.id))

        // Create audit log if action determined
        if (auditAction) {
          await this.auditRepo.create({
            organizationId,
            entityType: "rfq",
            entityId: currentRfq.id,
            action: auditAction,
            performedBy,
            metadata: {
              requestId,
              previousStatus: currentRfq.status,
              newStatus: newRfqStatus,
              reason: `Synced from purchase request status: ${newStatus}`,
            },
          })
        }

        console.log("[ProcurementService] RFQ status synced:", {
          rfqId: currentRfq.id,
          previousStatus: currentRfq.status,
          newStatus: newRfqStatus,
          prStatus: newStatus,
        })
      }
    } catch (error) {
      console.error("[ProcurementService] Error syncing RFQ status:", error)
      // Don't throw - this is a secondary operation
    }
  }
}
