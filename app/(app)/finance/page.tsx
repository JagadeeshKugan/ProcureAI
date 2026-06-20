"use client"

import { useEffect, useState, Suspense } from "react"
import { useAuth } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import { Check, X, DollarSign, Tabs } from "lucide-react"
import { getFinancePendingApprovals, approveFinanceRequest } from "@/actions/finance.actions"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FinanceApproval {
  id: string
  requestId: string
  requestNumber: string
  title: string
  estimatedTotal: string
  currency: string
  department?: string
  requester: string
  status: string
  budgetCode?: string
  costCenter?: string
  budgetAvailable?: string
  financeComments?: string
  createdAt: Date
}

function FinanceApprovalsContent() {
  const { orgId, orgRole } = useAuth()
  const [approvals, setApprovals] = useState<FinanceApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApproval, setSelectedApproval] = useState<FinanceApproval | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [comments, setComments] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "reject">("approve")

  // Check authorization - only org:admin
  if (orgRole !== "org:admin") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        You do not have permission to access this module. Only admins can approve finance requests.
      </div>
    )
  }

  useEffect(() => {
    const loadApprovals = async () => {
      if (!orgId) return

      const result = await getFinancePendingApprovals(orgId)
      if (result.success && result.data) {
        setApprovals(result.data as FinanceApproval[])
      } else {
        toast.error("Failed to load approvals")
      }
      setLoading(false)
    }

    loadApprovals()
  }, [orgId])

  const handleApprovalAction = (approval: FinanceApproval, action: "approve" | "reject") => {
    setSelectedApproval(approval)
    setActionType(action)
    setComments("")
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!selectedApproval || !orgId) return

    setIsSubmitting(true)
    try {
      const result = await approveFinanceRequest(
        {
          requestId: selectedApproval.requestId,
          approved: actionType === "approve",
          financeComments: comments,
          budgetCode: selectedApproval.budgetCode,
          costCenter: selectedApproval.costCenter,
          budgetAvailable: selectedApproval.budgetAvailable,
        },
        orgId
      )

      if (result.success) {
        toast.success(result.message || "Action completed")
        setApprovals(approvals.filter((a) => a.id !== selectedApproval.id))
        setIsDialogOpen(false)
        setComments("")
      } else {
        toast.error(result.error || "Failed to process action")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Pending Approvals</div>
          <div className="mt-2 text-3xl font-bold">{approvals.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Amount</div>
          <div className="mt-2 text-3xl font-bold">
            ${approvals.reduce((sum, a) => sum + parseFloat(a.estimatedTotal || "0"), 0).toFixed(2)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Status</div>
          <div className="mt-2 text-3xl font-bold text-yellow-600">{approvals.length > 0 ? "Pending" : "Clear"}</div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading approvals...
                  </TableCell>
                </TableRow>
              ) : approvals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No pending approvals
                  </TableCell>
                </TableRow>
              ) : (
                approvals.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell className="font-mono font-medium">{approval.requestNumber}</TableCell>
                    <TableCell className="max-w-xs truncate">{approval.title}</TableCell>
                    <TableCell>{approval.department || "-"}</TableCell>
                    <TableCell>
                      {approval.currency} {parseFloat(approval.estimatedTotal).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>{approval.requester}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Pending
                      </Badge>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprovalAction(approval, "approve")}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprovalAction(approval, "reject")}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve" : "Reject"} Finance Request
            </DialogTitle>
            <DialogDescription>
              {selectedApproval?.requestNumber}: {selectedApproval?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Amount:</span>
                <div className="font-medium">
                  {selectedApproval?.currency} {parseFloat(selectedApproval?.estimatedTotal || "0").toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Department:</span>
                <div className="font-medium">{selectedApproval?.department || "-"}</div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Comments</label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={actionType === "approve" ? "Add approval notes..." : "Add rejection reason..."}
                className="mt-2"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              >
                {actionType === "approve" ? "Approve" : "Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance & Budget"
        description="Manage budget approvals and financial oversight"
        icon={DollarSign}
      />

      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="approvals">Finance Approvals</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>

      <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
        <TabsContent value="approvals" className="space-y-6">
          <FinanceApprovalsContent />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
            Analytics dashboard coming soon. Finance approvals module is now active.
          </div>
        </TabsContent>
      </Suspense>
    </div>
  )
}
