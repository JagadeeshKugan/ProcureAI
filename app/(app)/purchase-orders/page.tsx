"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FileText, Plus, TrendingUp } from "lucide-react"
import { getPurchaseOrdersByOrganization } from "@/actions/purchase-orders.actions"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"

interface PurchaseOrder {
  id: string
  poNumber: string
  requestNumber: string
  requestTitle: string
  vendorName: string
  totalAmount: string
  currency: string
  status: string
  expectedDelivery?: Date
  createdAt: Date
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  ISSUED: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-green-100 text-green-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
}

export default function PurchaseOrdersPage() {
  const { orgId, orgRole } = useAuth()
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)

  // Check authorization - org:procurement_manager or org:admin
  if (orgRole !== "org:procurement_manager" && orgRole !== "org:admin") {
    redirect("/access-denied")
  }

  useEffect(() => {
    const loadOrders = async () => {
      if (!orgId) return

      const result = await getPurchaseOrdersByOrganization(orgId)
      if (result.success && result.data) {
        setOrders(result.data as PurchaseOrder[])
      } else {
        toast.error("Failed to load purchase orders")
      }
      setLoading(false)
    }

    loadOrders()
  }, [orgId])

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "-"
    const d = new Date(date)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const issueCount = orders.filter((o) => o.status === "ISSUED").length
  const totalValue = orders.reduce((sum, o) => sum + parseFloat(o.totalAmount || "0"), 0)
  const completedCount = orders.filter((o) => o.status === "COMPLETED").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Purchase Orders"
          description="Manage and track purchase orders"
          icon={FileText}
        />
        <Link href="/purchase-orders/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create PO
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Total POs</div>
          <div className="mt-2 text-3xl font-bold">{orders.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Issued</div>
          <div className="mt-2 text-3xl font-bold text-blue-600">{issueCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Value</div>
          <div className="mt-2 text-3xl font-bold">${totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Completed</div>
          <div className="mt-2 text-3xl font-bold text-green-600">{completedCount}</div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Request</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expected Delivery</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading purchase orders...
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No purchase orders yet
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono font-bold text-sm">{order.poNumber}</TableCell>
                    <TableCell className="text-sm">{order.requestNumber}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm">{order.requestTitle}</TableCell>
                    <TableCell className="text-sm">{order.vendorName || "-"}</TableCell>
                    <TableCell className="font-medium">
                      {order.currency} {parseFloat(order.totalAmount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status] || "bg-gray-100 text-gray-800"}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(order.expectedDelivery)}</TableCell>
                    <TableCell>
                      <Link href={`/purchase-orders/${order.id}`}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
