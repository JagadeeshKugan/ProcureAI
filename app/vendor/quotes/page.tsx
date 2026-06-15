"use client"

import { useState } from "react"
import { Search, MessageSquare } from "lucide-react"

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

const mockQuotes = [
  {
    id: "QT-2024-001",
    rfqId: "RFQ-2024-001",
    title: "Industrial Sensors - Batch Purchase",
    amount: "$45,000",
    status: "Submitted",
    updatedAt: "2024-02-08",
  },
  {
    id: "QT-2024-002",
    rfqId: "RFQ-2024-002",
    title: "Custom Bracket Assembly",
    amount: "$28,500",
    status: "Accepted",
    updatedAt: "2024-02-05",
  },
  {
    id: "QT-2024-003",
    rfqId: "RFQ-2024-003",
    title: "Hydraulic Components",
    amount: "$12,300",
    status: "Rejected",
    updatedAt: "2024-02-02",
  },
  {
    id: "QT-2024-004",
    rfqId: "RFQ-2024-004",
    title: "Stainless Steel Fasteners",
    amount: "$8,750",
    status: "Submitted",
    updatedAt: "2024-02-01",
  },
]

export default function VendorQuotesPage() {
  const [search, setSearch] = useState("")

  const filtered = mockQuotes.filter((quote) =>
    quote.title.toLowerCase().includes(search.toLowerCase()) ||
    quote.rfqId.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Quotes</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track all your submitted quotes and their status.
        </p>
      </div>

      {/* Search */}
      <Card className="p-0">
        <div className="border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search quotes..."
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
                <MessageSquare />
              </EmptyMedia>
              <EmptyTitle>No quotes found</EmptyTitle>
              <EmptyDescription>
                You haven&apos;t submitted any quotes yet. Browse RFQs and submit your quotes.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote ID</TableHead>
                <TableHead>RFQ ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-mono text-xs font-medium">
                    {quote.id}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {quote.rfqId}
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <span className="line-clamp-1">{quote.title}</span>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {quote.amount}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        quote.status === "Accepted"
                          ? "default"
                          : quote.status === "Submitted"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {quote.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(quote.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost">
                      View
                    </Button>
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
