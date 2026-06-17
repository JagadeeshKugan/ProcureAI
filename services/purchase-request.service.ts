import { PurchaseRequestRepository } from "@/repositories/purchase-request.repository"
import { AuditLogRepository } from "@/repositories/audit-log.repository"
import type { InsertPurchaseRequest } from "@/db/schema"

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

  async getRequestStatusCounts(userId: string, department: string) {
    try {
      const requests = await this.prRepository.findByRequestedBy(userId)
      
      return {
        pending: requests.filter((r: any) => r.status === "pending_approval").length,
        approved: requests.filter((r: any) => r.status === "approved").length,
        rejected: requests.filter((r: any) => r.status === "rejected").length,
        converted: requests.filter((r: any) => r.status === "in_rfq").length,
        total: requests.length,
      }
    } catch (error) {
      console.error("[PurchaseRequestService] Error getting status counts:", error)
      throw error
    }
  }

  async getRequestsWithAudit(userId: string) {
    try {
      const requests = await this.prRepository.findByRequestedBy(userId)
      
      // Fetch audit logs for each request
      const requestsWithAudit = await Promise.all(
        requests.map(async (req: any) => {
          const auditLogs = await this.auditRepository.getByEntityId(
            "purchase_request",
            req.id,
            10
          )
          return {
            ...req,
            auditLogs,
          }
        })
      )
      
      return requestsWithAudit
    } catch (error) {
      console.error("[PurchaseRequestService] Error fetching requests with audit:", error)
      throw error
    }
  }
}
