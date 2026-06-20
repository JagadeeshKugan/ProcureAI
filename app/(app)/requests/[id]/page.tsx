"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileText, Clock, CheckCircle, AlertCircle, DollarSign, ShoppingCart } from "lucide-react"
import { getRequestDetails } from "@/actions/request-detail.actions"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

interface RequestDetail {
  id: string
  requestNumber: string
  title: string
  description?: string
  department?: string
  priority: string
  estimatedTotal: string
  currency: string
  status: string
  requestedByName: string
  requestedByEmail: string
  createdAt: Date
  updatedAt: Date
}

interface FinanceApproval {
  id: string
  status: string
  budgetCode?: string
  costCenter?: string
  budgetAvailable?: string
  financeComments?: string
  approvedAt?: Date
  createdAt: Date
}

interface PurchaseOrder {
  id: string
  poNumber: string
  status: string
  totalAmount: string
  createdAt: Date
}

interface AuditLog {
  id: string
  action: string
  entityType: string
  userName?: string
  userEmail?: string
  oldValues?: any
  newValues?: any
  createdAt: Date
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800",
  manager_approved: "bg-green-100 text-green-800",
  finance_approved: "bg-emerald-100 text-emerald-800",
  procurement_review: "bg-purple-100 text-purple-800",
  in_rfq: "bg-indigo-100 text-indigo-800",
  rejected: "bg-red-100 text-red-800",
}

const priorityColors: Record<string, string> = {
  low: "bg-green-50 border-green-200 text-green-800",
  medium: "bg-yellow-50 border-yellow-200 text-yellow-800",
  high: "bg-orange-50 border-orange-200 text-orange-800",
  critical: "bg-red-50 border-red-200 text-red-800",
}

const getActionLabel = (action: string) => {
  return action
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ")
}

const getActionIcon = (action: string) => {
  switch (action) {
    case "REQUEST_CREATED":
      return <FileText className="h-4 w-4" />
    case "REQUEST_SUBMITTED":
    case "REQUEST_APPROVED":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "FINANCE_APPROVED":
      return <DollarSign className="h-4 w-4 text-emerald-600" />
    case "PO_CREATED":
      return <ShoppingCart className="h-4 w-4 text-blue-600" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

export default function RequestDetailPage() {
  const { orgId } = useAuth()
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string

  const [request, setRequest] = useState<RequestDetail | null>(null)
  const [financeApproval, setFinanceApproval] = useState<FinanceApproval | null>(null)
  const [po, setPO] = useState<PurchaseOrder | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDetails = async () => {
      if (!orgId || !requestId) return

      const result = await getRequestDetails(requestId, orgId)
      if (result.success) {
        setRequest(result.request)
        setFinanceApproval(result.financeApproval)
        setPO(result.purchaseOrder)
        setAuditLogs(result.auditLogs)
      } else {
        toast.error("Failed to load request details")
      }
      setLoading(false)
    }

    loadDetails()
  }, [orgId, requestId])

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "-"
    const d = new Date(date)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  if (loading) {
    return <div className="text-center py-8">Loading request details...</div>
  }

  if (!request) {
    return <div className="text-center py-8 text-red-600">Request not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={request.requestNumber}
          description={request.title}
          icon={FileText}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className={`p-4 border-l-4 ${priorityColors[request.priority]}`}>
          <div className="text-sm font-medium text-muted-foreground">Priority</div>
          <div className="mt-2 text-lg font-bold capitalize">{request.priority}</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Status</div>
          <div className="mt-2">
            <Badge className={statusColors[request.status] || "bg-gray-100 text-gray-800"}>
              {request.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Amount</div>
          <div className="mt-2 text-lg font-bold">
            {request.currency} {parseFloat(request.estimatedTotal).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Department</div>
          <div className="mt-2 text-lg font-bold">{request.department || "-"}</div>
        </Card>
      </div>

      {request.description && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3">Description</h3>
          <p className="text-muted-foreground">{request.description}</p>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {financeApproval && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Finance Approval</h3>
              <Badge className={financeApproval.status === "APPROVED" ? "bg-green-100 text-green-800" : financeApproval.status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>
                {financeApproval.status}
              </Badge>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Budget Code:</span>
                <div className="font-medium">{financeApproval.budgetCode || "-"}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Cost Center:</span>
                <div className="font-medium">{financeApproval.costCenter || "-"}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Budget Available:</span>
                <div className="font-medium">{financeApproval.budgetAvailable || "-"}</div>
              </div>
              {financeApproval.financeComments && (
                <div>
                  <span className="text-muted-foreground">Comments:</span>
                  <div className="font-medium">{financeApproval.financeComments}</div>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Approved At:</span>
                <div className="font-medium">{formatDate(financeApproval.approvedAt)}</div>
              </div>
            </div>
          </Card>
        )}

        {po && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Purchase Order</h3>
              <Link href={`/purchase-orders/${po.id}`}>
                <Button size="sm" variant="outline">
                  View PO
                </Button>
              </Link>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">PO Number:</span>
                <div className="font-mono font-bold">{po.poNumber}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge className={`mt-1 ${statusColors[po.status.toLowerCase()] || "bg-gray-100 text-gray-800"}`}>
                  {po.status}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Total Amount:</span>
                <div className="font-bold">
                  {request.currency} {parseFloat(po.totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <div className="font-medium">{formatDate(po.createdAt)}</div>
              </div>
            </div>
          </Card>
        )}
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Approval Timeline
        </h3>
        <Separator className="mb-6" />

        <div className="space-y-6">
          {auditLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No activity recorded</p>
          ) : (
            auditLogs.map((log, index) => (
              <div key={log.id} className="relative">
                {index < auditLogs.length - 1 && (
                  <div className="absolute left-4 top-12 w-0.5 h-8 bg-border" />
                )}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {getActionIcon(log.action)}
                    </div>
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{getActionLabel(log.action)}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          by {log.userName || "System"} ({log.userEmail || "system"})
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </div>
                    </div>
                    {log.newValues && Object.keys(log.newValues).length > 0 && (
                      <div className="mt-2 text-sm bg-muted p-2 rounded">
                        <div className="font-mono text-xs">
                          {Object.entries(log.newValues)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(" • ")}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-3">Metadata</h3>
        <Separator className="mb-4" />
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Requested By:</span>
            <div className="font-medium">{request.requestedByName}</div>
            <div className="text-xs text-muted-foreground">{request.requestedByEmail}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Created:</span>
            <div className="font-medium">{formatDate(request.createdAt)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Last Updated:</span>
            <div className="font-medium">{formatDate(request.updatedAt)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Request ID:</span>
            <div className="font-mono text-xs">{request.id.substring(0, 8)}...</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
