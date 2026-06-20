"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  getPendingApprovals,
  approveRequest,
  rejectRequest,
} from "@/actions/approval-workflow.actions"

interface PendingApproval {
  id: string
  purchaseRequestId: string
  status: string
  createdAt: Date
  request: {
    id: string
    requestNumber: string
    title: string
    description?: string
    estimatedTotal: string
    department?: string
    requestedBy: string
  }
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<PendingApproval[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(
    null
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"approve" | "reject">("approve")
  const [comments, setComments] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Load pending approvals
  useEffect(() => {
    const loadApprovals = async () => {
      try {
        const result = await getPendingApprovals()
        if (result.success) {
          setApprovals(result.approvals as PendingApproval[])
        } else {
          toast.error("Failed to load approvals", {
            description: result.error,
          })
        }
      } catch (error) {
        toast.error("Error loading approvals")
      } finally {
        setIsLoading(false)
      }
    }

    loadApprovals()
  }, [])

  const handleApprove = async () => {
    if (!selectedApproval) return

    setIsProcessing(true)
    try {
      const result = await approveRequest(selectedApproval.purchaseRequestId)

      if (result.success) {
        toast.success("Request approved", {
          description: "The request has been approved successfully.",
        })
        // Remove from list
        setApprovals(
          approvals.filter((a) => a.id !== selectedApproval.id)
        )
        setDialogOpen(false)
        setSelectedApproval(null)
      } else {
        toast.error("Failed to approve", {
          description: result.error,
        })
      }
    } finally {
      setIsProcessing(false)
      setComments("")
    }
  }

  const handleReject = async () => {
    if (!selectedApproval) return

    setIsProcessing(true)
    try {
      const result = await rejectRequest(
        selectedApproval.purchaseRequestId,
        comments || "No reason provided"
      )

      if (result.success) {
        toast.success("Request rejected", {
          description: "The request has been rejected.",
        })
        // Remove from list
        setApprovals(
          approvals.filter((a) => a.id !== selectedApproval.id)
        )
        setDialogOpen(false)
        setSelectedApproval(null)
      } else {
        toast.error("Failed to reject", {
          description: result.error,
        })
      }
    } finally {
      setIsProcessing(false)
      setComments("")
    }
  }

  const openApprovalDialog = (approval: PendingApproval, mode: "approve" | "reject") => {
    setSelectedApproval(approval)
    setDialogMode(mode)
    setComments("")
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Approvals"
        description="Review and approve pending purchase requests"
      />

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Clock className="mr-2 h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Loading approvals...</span>
          </div>
        ) : approvals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="mb-3 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">No pending approvals</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              All requests have been reviewed. Great work!
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PR Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell className="font-mono text-sm">
                      {approval.request.requestNumber}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {approval.request.title}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${Number(approval.request.estimatedTotal).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {approval.request.department || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(approval.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            openApprovalDialog(approval, "approve")
                          }
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={() =>
                            openApprovalDialog(approval, "reject")
                          }
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Approval/Rejection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "approve" ? "Approve Request" : "Reject Request"}
            </DialogTitle>
            <DialogDescription>
              {selectedApproval && (
                <div className="mt-4 space-y-2">
                  <p>
                    <span className="font-semibold">PR Number:</span>{" "}
                    {selectedApproval.request.requestNumber}
                  </p>
                  <p>
                    <span className="font-semibold">Title:</span>{" "}
                    {selectedApproval.request.title}
                  </p>
                  <p>
                    <span className="font-semibold">Amount:</span> $
                    {Number(selectedApproval.request.estimatedTotal).toFixed(2)}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {dialogMode === "reject" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Reason for rejection</label>
                <Textarea
                  placeholder="Provide a reason for rejecting this request..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          {dialogMode === "approve" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Additional comments (optional)</label>
                <Textarea
                  placeholder="Add any comments..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={
                dialogMode === "approve" ? handleApprove : handleReject
              }
              disabled={isProcessing}
              className={dialogMode === "reject" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {isProcessing ? "Processing..." : dialogMode === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
