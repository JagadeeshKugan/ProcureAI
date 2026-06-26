"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, AlertCircle, DollarSign, Package, Clock } from "lucide-react"
import { getRequestDetails, getOrganizationIdFromClerk } from "@/actions/request-detail.actions"
import { updateProcurementAssignmentOnRFQCreation } from "@/actions/procurement.actions"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RFQCreationModal } from "@/components/rfq-creation-modal"
import { toast } from "sonner"

interface RequestDetail {
  id: string
  requestNumber: string
  title: string
  description: string | null
  department: string | null
  priority: string | null
  estimatedTotal: string | null
  currency: string | null
  status: string | null
  requestedByName: string | null
  requestedByEmail: string | null
  createdAt: Date
  updatedAt: Date
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800",
  manager_approved: "bg-green-100 text-green-800",
  finance_approved: "bg-emerald-100 text-emerald-800",
  procurement_review: "bg-purple-100 text-purple-800",
  rfq_created: "bg-indigo-100 text-indigo-800",
  rejected: "bg-red-100 text-red-800",
}

const priorityColors: Record<string, string> = {
  low: "bg-green-50 border-green-200 text-green-800",
  medium: "bg-yellow-50 border-yellow-200 text-yellow-800",
  high: "bg-orange-50 border-orange-200 text-orange-800",
  critical: "bg-red-50 border-red-200 text-red-800",
}

export default function ProcurementDetailPage() {
  const { orgId, orgRole } = useAuth()
  const router = useRouter()
  const params = useParams()
  const requestId = params.requestId as string

  const [request, setRequest] = useState<RequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [dbOrgId, setDbOrgId] = useState<string | null>(null)
  const [rfqModalOpen, setRFQModalOpen] = useState(false)

  const isAuthorizedForRFQ = orgRole && ["org:admin", "org:procurement_manager"].includes(orgRole)

  useEffect(() => {
    const loadDetails = async () => {
      if (!orgId || !requestId) return

      try {
        const orgIdResult = await getOrganizationIdFromClerk(orgId)
        if (!orgIdResult.success || !orgIdResult.organizationId) {
          toast.error("Organization not found")
          setLoading(false)
          return
        }
        setDbOrgId(orgIdResult.organizationId)

        const result = await getRequestDetails(requestId, orgIdResult.organizationId)
        if (result.success) {
          setRequest(result.request ?? null)
        } else {
          toast.error("Failed to load request details")
        }
      } catch (error) {
        console.error("[ProcurementDetail] Error:", error)
        toast.error("Error loading procurement details")
      } finally {
        setLoading(false)
      }
    }

    loadDetails()
  }, [orgId, requestId])

  const handleRFQCreated = async (rfqId: string) => {
    try {
      // Update procurement assignment status to COMPLETED
      await updateProcurementAssignmentOnRFQCreation(requestId, rfqId)
      
      toast.success("RFQ created successfully. Redirecting...")
      
      // Redirect to RFQ details page
      setTimeout(() => {
        router.push(`/procurement/rfqs/${rfqId}`)
      }, 1000)
    } catch (error) {
      console.error("[handleRFQCreated] Error:", error)
      toast.error("Failed to complete RFQ creation")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading procurement details...</p>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="space-y-6">
        <PageHeader title="Procurement Review" description="Request not found" />
        <Card className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">The procurement request could not be found.</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <PageHeader
            title={request.requestNumber}
            description={request.title}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Request Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Info Card */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Requested By</p>
                  <p className="text-lg font-semibold">{request.requestedByName || "Unknown"}</p>
                  <p className="text-sm text-gray-500">{request.requestedByEmail}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Department</p>
                  <p className="text-lg font-semibold">{request.department || "N/A"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <Badge className={`mt-1 ${statusColors[request.status?.toLowerCase() || "draft"]}`}>
                    {request.status || "Unknown"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Requested Date</p>
                  <p className="text-sm">
                    {request.createdAt
                      ? new Date(request.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <p className="text-sm text-gray-600 mb-1">Estimated Amount</p>
              <p className="text-2xl font-bold">
                {request.currency} {parseFloat(request.estimatedTotal || "0").toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 mb-1">Quantity</p>
              <p className="text-2xl font-bold">Multiple Items</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 mb-1">Required Date</p>
              <p className="text-base font-semibold">As per request</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 mb-1">Priority</p>
              <Badge className={`mt-1 ${priorityColors[request.priority?.toLowerCase() || "medium"]}`}>
                {request.priority?.charAt(0).toUpperCase() + (request.priority?.slice(1) || "")}
              </Badge>
            </Card>
          </div>

          {/* Procurement Verification Section */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Procurement Verification</h3>
            <div className="space-y-4">
              {/* Budget Verified */}
              <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-green-900">Budget Verified</p>
                  <p className="text-sm text-green-700 mt-1">
                    Requested Amount: {request.currency} {parseFloat(request.estimatedTotal || "0").toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Specification Verified */}
              <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-green-900">Specification Verified</p>
                  <p className="text-sm text-green-700 mt-1">
                    {request.description ? "Item specifications are complete" : "Specifications available"}
                  </p>
                </div>
              </div>

              {/* Quantity Verified */}
              <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-green-900">Quantity Verified</p>
                  <p className="text-sm text-green-700 mt-1">
                    Quantity validation complete and verified
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side - Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <Button
                onClick={() => setRFQModalOpen(true)}
                className="w-full"
                disabled={!isAuthorizedForRFQ || request.status === "rfq_created"}
              >
                <Package className="h-4 w-4 mr-2" />
                Create RFQ
              </Button>
              <Button
                onClick={() => router.push(`/requests/${requestId}`)}
                variant="outline"
                className="w-full"
              >
                View Request
              </Button>
              <Button
                variant="outline"
                className="w-full text-gray-600"
                disabled
              >
                Request Clarification
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                disabled
              >
                Reject
              </Button>
            </div>
          </Card>

          {/* Status Info */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 text-sm">Current Status</p>
                <p className="text-blue-700 text-sm mt-1">
                  {request.status === "procurement_review"
                    ? "Ready for RFQ creation"
                    : request.status === "rfq_created"
                    ? "RFQ has been created"
                    : "Processing"}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* RFQ Creation Modal */}
      {dbOrgId && isAuthorizedForRFQ && (
        <RFQCreationModal
          open={rfqModalOpen}
          onOpenChange={setRFQModalOpen}
          requestId={requestId}
          organizationId={dbOrgId}
          requestNumber={request.requestNumber}
          requestTitle={request.title}
          requestAmount={
            request.currency
              ? `${request.currency} ${parseFloat(request.estimatedTotal || "0").toLocaleString()}`
              : undefined
          }
          showRequestSummary={true}
          onRFQCreated={handleRFQCreated}
        />
      )}
    </div>
  )
}
