import { PurchaseRequestRepository } from "@/repositories/purchase-request.repository"
import { AuditLogRepository } from "@/repositories/audit-log.repository"
import type { InsertPurchaseRequest } from "@/db/schema"

export interface CreatePurchaseRequestInput {
  title: string
  description?: string
  priority: string
  currency?: string
  organizationId: string
  requestedBy: string
  items: Array<{
    itemName: string
    quantity: number
    estimatedUnitPrice?: number
  }>
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

      // Calculate estimated total
      let estimatedTotal = 0
      input.items.forEach((item) => {
        const itemTotal = (item.estimatedUnitPrice || 0) * item.quantity
        estimatedTotal += itemTotal
      })

      // Prepare data
      const prData: InsertPurchaseRequest = {
        requestNumber,
        title: input.title,
        description: input.description,
        priority: input.priority,
        currency: input.currency || "USD",
        organizationId: input.organizationId,
        estimatedTotal: estimatedTotal.toString(),
        status: "draft",
        requestedBy: input.requestedBy,
      }

      // Create purchase request
      const purchaseRequest = await this.prRepository.create(prData)

      // Create audit log
      await this.auditRepository.create({
        organizationId: input.organizationId,
        entityType: "purchase_request",
        entityId: purchaseRequest.id,
        action: "create",
        performedBy: input.requestedBy,
        metadata: {
          title: input.title,
          itemCount: input.items.length,
          estimatedTotal,
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
    performedBy: string,
    organizationId:string
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
        organizationId,
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

  async calculateApprovalRoute(
    organizationId: string,
    estimatedTotal: number,
    department: string
  ): Promise<string[]> {
    try {
      return await this.prRepository.getApprovalRoute(
        organizationId,
        estimatedTotal,
        department
      )
    } catch (error) {
      console.error("[PurchaseRequestService] Error calculating approval route:", error)
      throw error
    }
  }

  async submitRequest(
    requestId: string,
    performedBy: string,
    organizationId: string
  ): Promise<PurchaseRequestResponse> {
    try {
      const request = await this.prRepository.findById(requestId)
      if (!request) {
        return {
          success: false,
          error: "Purchase request not found",
        }
      }

      // Calculate approval route based on estimated total
      const approvalRoute = await this.calculateApprovalRoute(
        organizationId,
        parseFloat(request.estimatedTotal || "0"),
        request.department || ""
      )

      // Update request with approval route and set status to submitted
      const updated = await this.prRepository.update(requestId, {
        status: "submitted",
        approvalRoute: JSON.stringify(approvalRoute),
      })

      // Create audit log
      await this.auditRepository.create({
        organizationId,
        entityType: "purchase_request",
        entityId: requestId,
        action: "submit",
        performedBy,
        metadata: {
          approvalRoute,
          status: "submitted",
        },
      })

      return {
        success: true,
        data: updated,
      }
    } catch (error) {
      console.error("[PurchaseRequestService] Error submitting request:", error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to submit purchase request",
      }
    }
  }

  async saveDraft(
    requestId: string,
    updates: Partial<InsertPurchaseRequest>,
    performedBy: string,
    organizationId: string
  ): Promise<PurchaseRequestResponse> {
    try {
      // Ensure status is draft
      const updateData = {
        ...updates,
        status: "draft",
      }

      const updated = await this.prRepository.update(requestId, updateData)

      if (!updated) {
        return {
          success: false,
          error: "Purchase request not found",
        }
      }

      // Create audit log
      await this.auditRepository.create({
        organizationId,
        entityType: "purchase_request",
        entityId: requestId,
        action: "save_draft",
        performedBy,
        metadata: {
          status: "draft",
        },
      })

      return {
        success: true,
        data: updated,
      }
    } catch (error) {
      console.error("[PurchaseRequestService] Error saving draft:", error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to save purchase request draft",
      }
    }
  }

  async createWithApprovalRoute(
    input: CreatePurchaseRequestInput & { department?: string }
  ): Promise<PurchaseRequestResponse> {
    try {
      // Generate request number
      const year = new Date().getFullYear()
      const requestNumber = await this.prRepository.getNextRequestNumber(year)

      // Calculate estimated total
      let estimatedTotal = 0
      input.items.forEach((item) => {
        const itemTotal = (item.estimatedUnitPrice || 0) * item.quantity
        estimatedTotal += itemTotal
      })

      // Calculate approval route
      const approvalRoute = await this.calculateApprovalRoute(
        input.organizationId,
        estimatedTotal,
        input.department || ""
      )

      // Prepare purchase request data
      const prData: InsertPurchaseRequest = {
        requestNumber,
        title: input.title,
        description: input.description,
        department: input.department,
        priority: input.priority,
        currency: input.currency || "USD",
        organizationId: input.organizationId,
        estimatedTotal: estimatedTotal.toString(),
        approvalRoute: JSON.stringify(approvalRoute),
        status: "draft",
        requestedBy: input.requestedBy,
      }

      // Prepare items
      const prItems = input.items.map((item, index) => ({
        lineNumber: index + 1,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: (item.estimatedUnitPrice || 0).toString(),
        totalPrice: ((item.estimatedUnitPrice || 0) * item.quantity).toString(),
      }))

      // Create with items in transaction
      const result = await this.prRepository.createWithItems(prData, prItems as any)

      // Create audit log
      await this.auditRepository.create({
        organizationId: input.organizationId,
        entityType: "purchase_request",
        entityId: result.purchaseRequest.id,
        action: "create",
        performedBy: input.requestedBy,
        metadata: {
          title: input.title,
          itemCount: input.items.length,
          estimatedTotal,
          approvalRoute,
        },
      })

      return {
        success: true,
        data: result.purchaseRequest,
      }
    } catch (error) {
      console.error("[PurchaseRequestService] Error creating purchase request with approval route:", error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create purchase request",
      }
    }
  }
}
