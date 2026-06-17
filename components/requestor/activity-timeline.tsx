"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { CheckCircle2, Clock, AlertCircle, FileText } from "lucide-react"

interface AuditLog {
  id: string
  action: string
  performedBy: string
  createdAt: Date
  metadata?: any
}

interface ActivityTimelineProps {
  logs: AuditLog[]
}

const actionIcons: Record<string, React.ReactNode> = {
  create: <FileText className="size-4 text-blue-600" />,
  update_status: <CheckCircle2 className="size-4 text-green-600" />,
  delete: <AlertCircle className="size-4 text-red-600" />,
  update: <Clock className="size-4 text-gray-600" />,
}

const actionLabels: Record<string, string> = {
  create: "Request Created",
  update_status: "Status Updated",
  delete: "Request Deleted",
  update: "Request Updated",
}

export function ActivityTimeline({ logs }: ActivityTimelineProps) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No activity yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                {actionIcons[log.action] || <Clock className="size-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{actionLabels[log.action] || log.action}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">By {log.performedBy}</p>
                {log.metadata?.newStatus && (
                  <Badge className="mt-2 text-xs">{log.metadata.newStatus}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
