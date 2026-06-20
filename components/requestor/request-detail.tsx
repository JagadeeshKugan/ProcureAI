"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { formatCurrency } from "@/lib/data"

interface RequestDetail {
  id: string
  requestNumber: string
  title: string
  description?: string
  status: string
  priority: string
  estimatedTotal: number
  createdAt: Date
  updatedAt: Date
}

interface RequestDetailProps {
  request: RequestDetail
  onBack: () => void
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  pending_approval: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  in_rfq: "bg-blue-100 text-blue-800",
}

const priorityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-gray-100 text-gray-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
}

export function RequestDetail({ request, onBack }: RequestDetailProps) {
  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" onClick={onBack}>
        <ArrowLeft className="size-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{request.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{request.requestNumber}</p>
            </div>
            <div className="flex gap-2">
              <Badge className={statusColors[request.status]}>
                {request.status.replace(/_/g, " ").toUpperCase()}
              </Badge>
              <Badge className={priorityColors[request.priority]}>
                {request.priority.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Estimated Total</p>
              <p className="font-medium mt-1">{formatCurrency(Number(request.estimatedTotal))}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="font-medium mt-1">{new Date(request.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Updated</p>
              <p className="font-medium mt-1">{new Date(request.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Description */}
          {request.description && (
            <div>
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm text-muted-foreground mt-2">{request.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
