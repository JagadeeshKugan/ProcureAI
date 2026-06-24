"use client"

import {
  FileText,
  Check,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
} from "lucide-react"

interface TimelineEvent {
  id: string
  type: string
  title: string
  status: string
  timestamp: Date | string
  description: string
  amount?: string | null
  metadata?: any
}

interface ProcurementTimelineProps {
  events: TimelineEvent[]
  isLoading?: boolean
}

export function ProcurementTimeline({
  events,
  isLoading = false,
}: ProcurementTimelineProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "request_created":
        return <FileText className="h-5 w-5 text-blue-500" />
      case "assigned":
        return <Users className="h-5 w-5 text-purple-500" />
      case "vendor_selected":
        return <Package className="h-5 w-5 text-green-500" />
      case "po_created":
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      case "po_issued":
        return <Check className="h-5 w-5 text-green-500" />
      case "assignment_completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (type: string) => {
    switch (type) {
      case "request_created":
        return "bg-blue-50 border-blue-200"
      case "assigned":
        return "bg-purple-50 border-purple-200"
      case "vendor_selected":
        return "bg-green-50 border-green-200"
      case "po_created":
        return "bg-orange-50 border-orange-200"
      case "po_issued":
        return "bg-green-50 border-green-200"
      case "assignment_completed":
        return "bg-green-50 border-green-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Loading timeline...
          </p>
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 border-2 border-dashed rounded-lg">
        <div className="text-center">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No timeline events yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-4">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className={`rounded-full p-2 ${getStatusColor(event.type)}`}>
              {getIcon(event.type)}
            </div>
            {index < events.length - 1 && (
              <div className="w-1 h-12 bg-gray-200 mt-2" />
            )}
          </div>

          {/* Event content */}
          <div className={`flex-1 pb-4 px-4 rounded-lg border ${getStatusColor(event.type)}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-sm">{event.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {event.description}
                </p>

                {event.metadata && (
                  <div className="mt-2 text-xs space-y-1">
                    {event.metadata.reason && (
                      <p className="text-muted-foreground">
                        Reason: {event.metadata.reason}
                      </p>
                    )}
                    {event.metadata.score && (
                      <p className="text-muted-foreground">
                        Score: {parseFloat(event.metadata.score).toFixed(1)}/100
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="text-xs font-medium text-muted-foreground">
                  {new Date(event.timestamp).toLocaleDateString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(event.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>

            {event.amount && (
              <div className="mt-3 pt-3 border-t border-current border-opacity-10">
                <p className="text-sm font-semibold">
                  Amount: ${parseFloat(event.amount).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
