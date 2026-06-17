"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface Request {
  id: string
  requestNumber: string
  title: string
  status: string
  createdAt: Date
  updatedAt: Date
}

interface RequestTableProps {
  requests: Request[]
  onSelectRequest: (requestId: string) => void
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  pending_approval: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  in_rfq: "bg-blue-100 text-blue-800",
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  in_rfq: "Converted to RFQ",
}

export function RequestTable({ requests, onSelectRequest }: RequestTableProps) {
  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">My Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No requests yet. Create your first one!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">My Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left py-3 font-medium">ID</th>
                <th className="text-left py-3 font-medium">Item</th>
                <th className="text-left py-3 font-medium">Status</th>
                <th className="text-left py-3 font-medium">Submitted</th>
                <th className="text-left py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr
                  key={req.id}
                  onClick={() => onSelectRequest(req.id)}
                  className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <td className="py-3 text-muted-foreground">{req.requestNumber}</td>
                  <td className="py-3 font-medium">{req.title}</td>
                  <td className="py-3">
                    <Badge className={statusColors[req.status]}>
                      {statusLabels[req.status]}
                    </Badge>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {formatDistanceToNow(new Date(req.updatedAt), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
