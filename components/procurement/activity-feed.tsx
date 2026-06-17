"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ActivityItem {
  id: string
  action: string
  entity: string
  entityType: "request" | "rfq" | "quote"
  timestamp: string
  user?: string
  details?: string
}

interface ProcurementActivityFeedProps {
  activities: ActivityItem[]
  isLoading?: boolean
}

const actionColors: Record<string, string> = {
  created: "success",
  updated: "info",
  sent: "warning",
  received: "default",
  approved: "success",
  rejected: "destructive",
  closed: "secondary",
}

const actionIcons: Record<string, string> = {
  created: "✓",
  updated: "~",
  sent: "→",
  received: "←",
  approved: "✓",
  rejected: "✗",
  closed: "■",
}

export function ProcurementActivityFeed({
  activities,
  isLoading = false,
}: ProcurementActivityFeedProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No activity yet. Start by creating a purchase request or RFQ.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                  <span className="text-xs font-semibold text-primary">
                    {actionIcons[activity.action] || "•"}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)}{" "}
                      <span className="font-semibold">{activity.entity}</span>
                    </p>
                    {activity.details && (
                      <p className="text-sm text-muted-foreground mt-1">{activity.details}</p>
                    )}
                  </div>
                  <Badge
                    variant={(actionColors[activity.action] || "default") as any}
                    className="flex-shrink-0"
                  >
                    {activity.entityType}
                  </Badge>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                  {activity.user && <span>{activity.user}</span>}
                  <span>{new Date(activity.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
