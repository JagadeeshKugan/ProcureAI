"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileText, Clock, CheckCircle2, DollarSign } from "lucide-react"

// Mock data
const vendorStats = [
  {
    title: "Active RFQs",
    value: "8",
    icon: FileText,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "Pending Quotes",
    value: "3",
    icon: Clock,
    color: "bg-yellow-50 text-yellow-600",
  },
  {
    title: "Accepted Orders",
    value: "12",
    icon: CheckCircle2,
    color: "bg-green-50 text-green-600",
  },
  {
    title: "Total Value",
    value: "$156.2K",
    icon: DollarSign,
    color: "bg-purple-50 text-purple-600",
  },
]

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

export default function VendorDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Overview of your RFQs, quotes, and orders.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {vendorStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`rounded-lg p-2 ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* RFQ Table */}
      <Card>
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Recent RFQs</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            RFQs available for you to submit quotes.
          </p>
        </div>
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
            {mockRFQs.map((rfq) => (
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
      </Card>
    </div>
  )
}
