"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, FileText } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

const mockRFQs = [
  {
    id: "RFQ-2024-001",
    title: "Industrial Sensors - Batch Purchase",
    deadline: "2024-02-15",
    status: "Open",
    quantity: 500,
  },
  {
    id: "RFQ-2024-002",
    title: "Custom Bracket Assembly",
    deadline: "2024-02-10",
    status: "Submitted",
    quantity: 1000,
  },
  {
    id: "RFQ-2024-003",
    title: "Hydraulic Components",
    deadline: "2024-02-20",
    status: "Open",
    quantity: 250,
  },
  {
    id: "RFQ-2024-004",
    title: "Circuit Board Manufacturing",
    deadline: "2024-02-05",
    status: "Closed",
    quantity: 2000,
  },
  {
    id: "RFQ-2024-005",
    title: "Stainless Steel Fasteners",
    deadline: "2024-02-18",
    status: "Open",
    quantity: 5000,
  },
]

export default function VendorRFQsPage() {
  const [search, setSearch] = useState("")

  const filtered = mockRFQs.filter((rfq) =>
    rfq.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">RFQs</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse available RFQs and submit your quotes.
        </p>
      </div>

      {/* Search */}
      <Card className="p-0">
        <div className="border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search RFQs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>No RFQs found</EmptyTitle>
              <EmptyDescription>
                Try adjusting your search or check back later for new RFQs.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RFQ ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((rfq) => (
                <TableRow key={rfq.id}>
                  <TableCell className="font-mono text-xs font-medium">
                    {rfq.id}
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <span className="line-clamp-1">{rfq.title}</span>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {rfq.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(rfq.deadline).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        rfq.status === "Open"
                          ? "default"
                          : rfq.status === "Submitted"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {rfq.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/vendor/rfqs/${rfq.id}`}>
                      <Button size="sm" variant="ghost">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
