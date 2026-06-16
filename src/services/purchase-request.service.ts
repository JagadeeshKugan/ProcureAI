import { PurchaseRequestRepository } from "@/src/repositories/purchase-request.repository"
import { AuditLogRepository } from "@/src/repositories/audit-log.repository"
import type { InsertPurchaseRequest } from "@/src/db/schema"

export interface CreatePurchaseRequestInput {
  title: string
  description?: string
  department: string
  priority: string
  estimatedBudget: number // in cents
  requestedBy: string
}

export interface PurchaseRequestResponse {
  success: boolean
  data?: any
  error?: string
}

export class PurchaseRequestService {
  private prRepository = new PurchaseRequestRepository()
  private auditRepository = new AuditLogRepository()

  async createPurchaseRequest(
    input: CreatePurchaseRequestInput
  ): Promise<PurchaseRequestResponse> {
    try {
      // Generate request number
      const year = new Date().getFullYear()
      const requestNumber = await this.prRepository.getNextRequestNumber(year)

      // Prepare data
      const prData: InsertPurchaseRequest = {
        requestNumber,
        title: input.title,
        description: input.description,
        department: input.department,
        priority: input.priority,
        estimatedBudget: input.estimatedBudget,
        status: "draft",
        requestedBy: input.requestedBy,
      }

      // Create purchase request
      const purchaseRequest = await this.prRepository.create(prData)

      // Create audit log
      await this.auditRepository.create({
        entityType: "purchase_request",
        entityId: purchaseRequest.id,
        action: "create",
        performedBy: input.requestedBy,
        metadata: {
          title: input.title,
          department: input.department,
          budget: input.estimatedBudget,
        },
      })

      return {
        success: true,
        data: purchaseRequest,
      }
    } catch (error) {
      console.error("[PurchaseRequestService] Error creating purchase request:", error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create purchase request",
      }
    }
  }

  async getPurchaseRequestsByUser(userId: string) {
    try {
      return await this.prRepository.findByRequestedBy(userId)
    } catch (error) {
      console.error("[PurchaseRequestService] Error fetching requests:", error)
      throw error
    }
  }

  async updatePurchaseRequestStatus(
    requestId: string,
    newStatus: string,
    performedBy: string
  ): Promise<PurchaseRequestResponse> {
    try {
      const updated = await this.prRepository.update(requestId, {
        status: newStatus,
      })

      if (!updated) {
        return {
          success: false,
          error: "Purchase request not found",
        }
      }

      // Create audit log
      await this.auditRepository.create({
        entityType: "purchase_request",
        entityId: requestId,
        action: `update_status`,
        performedBy,
        metadata: {
          newStatus,
        },
      })

      return {
        success: true,
        data: updated,
      }
    } catch (error) {
      console.error("[PurchaseRequestService] Error updating status:", error)
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update purchase request status",
      }
    }
  }

  async deletePurchaseRequest(
    requestId: string,
    performedBy: string
  ): Promise<PurchaseRequestResponse> {
    try {
      // Create audit log before deletion
      await this.auditRepository.create({
        entityType: "purchase_request",
        entityId: requestId,
        action: "delete",
        performedBy,
      })

      await this.prRepository.delete(requestId)

      return {
        success: true,
      }
    } catch (error) {
      console.error("[PurchaseRequestService] Error deleting purchase request:", error)
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete purchase request",
      }
    }
  }
}
