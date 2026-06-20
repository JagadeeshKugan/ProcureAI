"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import { Clock, FileText } from "lucide-react"
import { getAuditLogs } from "@/actions/audit-logs.actions"
import { PageHeader } from "@/components/page-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"

interface AuditLogEntry {
  id: string
  organizationId: string
  action: string
  entityType: string
  entityId: string
  userName: string | null
  userEmail: string | null
  metadata?: any
  createdAt: Date
}

const actionColors: Record<string, string> = {
  REQUEST_CREATED: "bg-blue-100 text-blue-800",
  REQUEST_SUBMITTED: "bg-purple-100 text-purple-800",
  REQUEST_APPROVED: "bg-green-100 text-green-800",
  FINANCE_APPROVED: "bg-emerald-100 text-emerald-800",
  PO_CREATED: "bg-indigo-100 text-indigo-800",
  STATUS_CHANGED: "bg-amber-100 text-amber-800",
}

const getActionLabel = (action: string) => {
  return action
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ")
}

export default function AuditPage() {
  const { orgId, orgRole } = useAuth()
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Check authorization - only org:admin
  if (orgRole !== "org:admin") {
    redirect("/access-denied")
  }

  useEffect(() => {
    const loadLogs = async () => {
      if (!orgId) return

      const result = await getAuditLogs(orgId, 100)
      if (result.success && result.data) {
        setLogs(result.data as AuditLogEntry[])
      } else {
        toast.error("Failed to load audit logs")
      }
      setLoading(false)
    }

    loadLogs()
  }, [orgId])

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Track all system activities and changes"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Events</div>
          <div className="mt-2 text-3xl font-bold">{logs.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Today</div>
          <div className="mt-2 text-3xl font-bold">
            {logs.filter((log) => {
              const today = new Date().toDateString()
              return new Date(log.createdAt).toDateString() === today
            }).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Last Activity</div>
          <div className="mt-2 text-sm font-medium">
            {logs.length > 0 ? formatDate(logs[0].createdAt) : "No activity"}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading audit logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{log.userName || "System"}</div>
                      <div className="text-xs text-muted-foreground">{log.userEmail}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={actionColors[log.action] || "bg-gray-100 text-gray-800"}>
                        {getActionLabel(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {log.entityType.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.entityId.substring(0, 8)}...</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.metadata ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {log.metadata.status ? `Status: ${log.metadata.status}` : log.metadata.comments ? log.metadata.comments.substring(0, 50) : JSON.stringify(log.metadata).substring(0, 50)}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
