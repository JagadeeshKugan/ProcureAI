"use client"

import Link from "next/link"
import { FileText, Clock, CheckCircle2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

interface WorkItem {
  id: string
  title: string
  type: "request" | "rfq"
  status: string
  department: string
  priority: string
  createdAt: string
  dueDate?: string
}

interface WorkQueueProps {
  items: WorkItem[]
  isLoading?: boolean
}

const statusConfig: Record<string, { badge: string; icon: any }> = {
  pending_approval: { badge: "warning", icon: Clock },
  draft: { badge: "secondary", icon: FileText },
  sent: { badge: "info", icon: Clock },
  responses_received: { badge: "warning", icon: Clock },
  evaluation: { badge: "default", icon: FileText },
  closed: { badge: "success", icon: CheckCircle2 },
}

const priorityConfig: Record<string, string> = {
  low: "text-blue-600",
  medium: "text-yellow-600",
  high: "text-orange-600",
  critical: "text-red-600",
}

export function WorkQueue({ items, isLoading = false }: WorkQueueProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Work Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Work Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>No pending items</EmptyTitle>
              <EmptyDescription>All caught up! No pending requests or RFQs.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>My Work Queue</CardTitle>
        <Badge variant="outline">{items.length} items</Badge>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium max-w-xs">
                  <div className="truncate">{item.title}</div>
                </TableCell>
                <TableCell className="text-sm">
                  {item.type === "request" ? "Purchase Request" : "RFQ"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.department}</TableCell>
                <TableCell>
                  <span className={`text-sm font-medium ${priorityConfig[item.priority] || ""}`}>
                    {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{item.status.replace(/_/g, " ")}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost">
                    <Link href={`/requests/${item.id}`} className="flex items-center gap-2">
                      View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
