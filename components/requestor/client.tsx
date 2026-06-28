"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { PurchaseRequestMode } from "./purchase-request-mode"
import { RequestTable } from "./request-table"
import { RequestDetail } from "./request-detail"
import { ActivityTimeline } from "./activity-timeline"
import { createPurchaseRequestAction } from "@/actions/requestor.actions"

interface RequestWithAudit {
  id: string
  requestNumber: string
  title: string
  description?: string
  status: string
  priority: string
  estimatedTotal: number
  createdAt: Date
  updatedAt: Date
  auditLogs?: any[]
}

interface DepartmentRequestorClientProps {
  initialRequests: RequestWithAudit[]
  userId: string
  organizationId: string
}

export function DepartmentRequestorClient({
  initialRequests,
  userId,
  organizationId,
}: DepartmentRequestorClientProps) {
  const [requests, setRequests] = useState<RequestWithAudit[]>(initialRequests)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateRequest = async (data: {
    title: string
    description: string
    quantity: number
    unitPrice: number
    priority: string
  }) => {
    setIsLoading(true)
    try {
      const response = await createPurchaseRequestAction({
        title: data.title,
        description: data.description,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        priority: data.priority,
        userId,
        organizationId,
      })

      if (response.success) {
        // Reload page to reflect new request
        window.location.reload()
      }
    } catch (error) {
      console.error("Failed to create request:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedRequest = selectedRequestId
    ? requests.find((r) => r.id === selectedRequestId)
    : null

  return (
    <>
      <PurchaseRequestMode onSubmit={handleCreateRequest} isLoading={isLoading} />

      {selectedRequest ? (
        <div className="space-y-4">
          <RequestDetail
            request={selectedRequest}
            onBack={() => setSelectedRequestId(null)}
          />
          {selectedRequest.auditLogs && (
            <ActivityTimeline logs={selectedRequest.auditLogs} />
          )}
        </div>
      ) : (
        <RequestTable
          requests={requests}
          onSelectRequest={(requestId) => setSelectedRequestId(requestId)}
        />
      )}
    </>
  )
}
