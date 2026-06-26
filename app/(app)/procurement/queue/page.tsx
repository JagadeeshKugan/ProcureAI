"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Play,
  Check,
} from "lucide-react"
import { getProcurementQueue, updateAssignmentStatus } from "@/actions/procurement.actions"
import { getOrganizationIdFromClerk } from "@/actions/request-detail.actions"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface QueueItem {
  assignmentId: string
  assignmentStatus: string
  assignedAt: Date
  requestId: string
  requestNumber: string
  title: string
  department: string | null
  estimatedTotal: string | null
  currency: string
  priority: string | null
  requestStatus: string | null
}

export default function ProcurementQueue() {
  const { orgId } = useAuth()
  const router = useRouter()
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    const loadQueue = async () => {
      if (!orgId) return

      try {
        // Get database org ID from Clerk org ID
        const orgIdResult = await getOrganizationIdFromClerk(orgId)
        if (!orgIdResult.success || !orgIdResult.organizationId) {
          toast.error("Organization not found")
          setLoading(false)
          return
        }

        const result = await getProcurementQueue(orgIdResult.organizationId)
        if (result.success && result.data) {
          setQueue(result.data as QueueItem[])
        } else {
          toast.error(result.error || "Failed to load queue")
        }
      } catch (error) {
        console.error("[ProcurementQueue] Error:", error)
        toast.error("An error occurred while loading the queue")
      } finally {
        setLoading(false)
      }
    }

    loadQueue()
  }, [orgId])

  const handleStatusUpdate = async (
    assignmentId: string,
    newStatus: string
  ) => {
    if (!orgId) return

    try {
      setUpdatingId(assignmentId)

      const orgIdResult = await getOrganizationIdFromClerk(orgId)
      if (!orgIdResult.success || !orgIdResult.organizationId) {
        toast.error("Organization not found")
        return
      }

      const result = await updateAssignmentStatus(
        assignmentId,
        newStatus,
        orgIdResult.organizationId
      )

      if (result.success) {
        toast.success(`Assignment status updated to ${newStatus}`)
        // Refresh the queue
        const queueResult = await getProcurementQueue(orgIdResult.organizationId)
        if (queueResult.success && queueResult.data) {
          setQueue(queueResult.data as QueueItem[])
        }
      } else {
        toast.error(result.error || "Failed to update status")
      }
    } catch (error) {
      console.error("[handleStatusUpdate] Error:", error)
      toast.error("An error occurred while updating status")
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN":
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "COMPLETED":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-amber-50"
      case "IN_PROGRESS":
        return "bg-blue-50"
      case "COMPLETED":
        return "bg-green-50"
      default:
        return "bg-gray-50"
    }
  }

  const openItems = queue.filter((q) => q.assignmentStatus === "OPEN")
  const inProgressItems = queue.filter(
    (q) => q.assignmentStatus === "IN_PROGRESS"
  )
  const completedItems = queue.filter(
    (q) => q.assignmentStatus === "COMPLETED"
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Procurement Queue"
          description="Manage your assigned procurement tasks"
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your queue...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Procurement Queue"
        description="Manage your assigned procurement tasks"
      />

      {/* Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Open Tasks
              </p>
              <p className="text-3xl font-bold mt-2">{openItems.length}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                In Progress
              </p>
              <p className="text-3xl font-bold mt-2">{inProgressItems.length}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Completed
              </p>
              <p className="text-3xl font-bold mt-2">{completedItems.length}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Queue Items */}
      {queue.length === 0 ? (
        <Card className="p-8">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No items in your queue</p>
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((item) => (
                <TableRow
                  key={item.assignmentId}
                  className={getStatusColor(item.assignmentStatus)}
                >
                  <TableCell className="font-medium">
                    {item.requestNumber}
                  </TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>{item.department || "-"}</TableCell>
                  <TableCell>
                    {item.currency}{" "}
                    {item.estimatedTotal
                      ? parseFloat(item.estimatedTotal).toFixed(2)
                      : "0.00"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.priority === "critical"
                          ? "destructive"
                          : item.priority === "high"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {item.priority || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.assignmentStatus)}
                      <Badge variant="outline">
                        {item.assignmentStatus}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.assignmentStatus === "OPEN" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusUpdate(
                              item.assignmentId,
                              "IN_PROGRESS"
                            )
                          }
                          disabled={updatingId === item.assignmentId}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                      )}
                      {item.assignmentStatus === "IN_PROGRESS" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusUpdate(item.assignmentId, "COMPLETED")
                          }
                          disabled={updatingId === item.assignmentId}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Complete
                        </Button>
                      )}
                      {item.assignmentStatus !== "COMPLETED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            router.push(`/requests/${item.requestId}`)
                          }
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
