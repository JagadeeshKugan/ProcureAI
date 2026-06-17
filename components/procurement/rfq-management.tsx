"use client"

import { Plus, Edit2, Eye } from "lucide-react"
import Link from "next/link"
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
import { FileText } from "lucide-react"

interface RFQ {
  id: string
  rfqNumber: string
  title: string
  status: string
  totalResponses?: number
  createdAt: string
  dueDate?: string
}

interface RFQManagementProps {
  rfqs: RFQ[]
  isLoading?: boolean
}

const statusColors: Record<string, string> = {
  draft: "secondary",
  sent: "default",
  responses_received: "warning",
  evaluation: "info",
  awarded: "success",
}

export function RFQManagement({ rfqs, isLoading = false }: RFQManagementProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>RFQ Management</CardTitle>
          <Button disabled size="sm">
            <Plus className="size-4" />
            Create RFQ
          </Button>
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>RFQ Management</CardTitle>
        <Link href="/procurement/rfqs/create">
          <Button size="sm">
            <Plus className="size-4 mr-2" />
            Create RFQ
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {!rfqs || rfqs.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>No RFQs created yet</EmptyTitle>
              <EmptyDescription>
                Start by creating a new RFQ to request quotes from vendors.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RFQ Number</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Responses</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rfqs.map((rfq) => (
                <TableRow key={rfq.id}>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {rfq.rfqNumber}
                  </TableCell>
                  <TableCell className="font-medium max-w-xs">
                    <div className="truncate">{rfq.title}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={(statusColors[rfq.status] || "default") as any}>
                      {rfq.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{rfq.totalResponses || 0}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(rfq.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {rfq.status === "draft" ? (
                        <Link href={`/procurement/rfqs/${rfq.id}/edit`}>
                          <Button size="sm" variant="ghost">
                            <Edit2 className="size-4" />
                          </Button>
                        </Link>
                      ) : null}
                      <Link href={`/procurement/rfqs/${rfq.id}`}>
                        <Button size="sm" variant="ghost">
                          <Eye className="size-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
