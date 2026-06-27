"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { getPurchaseOrdersByVendor } from "@/actions/purchase-orders.actions"
import { Search, Loader2 } from "lucide-react"

interface PurchaseOrder {
  id: string
  poNumber: string
  requestNumber: string | null
  requestTitle: string | null
  buyerName: string | null
  totalAmount: string
  currency: string
  status: string | null
  expectedDelivery: Date | null
  createdAt: Date
}

export default function VendorOrdersPage() {
  const [query, setQuery] = useState("")
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const result = await getPurchaseOrdersByVendor()
        if (result.success && result.data) {
          setOrders(result.data as PurchaseOrder[])
        } else {
          toast.error(result.error || "Failed to load purchase orders")
        }
      } catch (error) {
        console.error("[VendorOrdersPage] Error:", error)
        toast.error("Failed to load purchase orders")
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const filtered = orders.filter((order) => {
    const matchesQuery =
      order.poNumber.toLowerCase().includes(query.toLowerCase()) ||
      order.requestTitle?.toLowerCase().includes(query.toLowerCase()) ||
      order.buyerName?.toLowerCase().includes(query.toLowerCase())
    return matchesQuery
  })

  function formatCurrency(value: string) {
    const num = parseFloat(value)
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Purchase Orders"
        description="View and manage purchase orders from your buyers"
      />

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-4">
            <InputGroup className="flex-1 lg:max-w-xs">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search orders..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </InputGroup>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              {orders.length === 0 ? "No purchase orders yet" : "No orders match your search"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Order Title</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.poNumber}</span>
                        {order.requestNumber && (
                          <span className="text-xs text-muted-foreground">
                            {order.requestNumber}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.requestTitle || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {order.buyerName || "Organization"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {order.expectedDelivery
                        ? new Date(order.expectedDelivery).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "2-digit",
                          })
                        : "Not set"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        render={<Link href={`/vendors/orders/${order.id}`} />}
                        nativeButton={false}
                        className="cursor-pointer"
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
