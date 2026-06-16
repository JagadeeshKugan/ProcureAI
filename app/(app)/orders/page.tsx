"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { purchaseOrders, formatCurrency, type PurchaseOrder } from "@/src/lib/data"
import { Download, Plus, Search, Truck } from "lucide-react"

export default function OrdersPage() {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [selected, setSelected] = useState<PurchaseOrder | null>(null)

  const filtered = purchaseOrders.filter((po) => {
    const matchesQuery =
      po.number.toLowerCase().includes(query.toLowerCase()) ||
      po.vendor.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = status === "all" || po.status === status
    return matchesQuery && matchesStatus
  })

  const totalValue = purchaseOrders.reduce((sum, po) => sum + po.amount, 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Purchase Orders"
        description="Track issued orders and delivery status across all vendors."
      >
        <Button variant="outline" className="cursor-pointer">
          <Download data-icon="inline-start" />
          Export
        </Button>
        <Button className="cursor-pointer">
          <Plus data-icon="inline-start" />
          New Order
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-sm text-muted-foreground">Open Orders</span>
            <span className="text-2xl font-semibold tracking-tight">
              {purchaseOrders.filter((p) => p.status !== "Delivered" && p.status !== "Cancelled").length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-sm text-muted-foreground">Total Committed Value</span>
            <span className="text-2xl font-semibold tracking-tight">
              {formatCurrency(totalValue, true)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-sm text-muted-foreground">Delivered This Month</span>
            <span className="text-2xl font-semibold tracking-tight">
              {purchaseOrders.filter((p) => p.status === "Delivered").length}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <InputGroup className="sm:max-w-xs">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search orders or vendors..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </InputGroup>
            <Select value={status} onValueChange={(value) => setStatus(value ?? "all")}>
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Issued">Issued</SelectItem>
                  <SelectItem value="Acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((po) => (
                  <TableRow
                    key={po.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(po)}
                  >
                    <TableCell className="font-medium">{po.number}</TableCell>
                    <TableCell>{po.vendor}</TableCell>
                    <TableCell>
                      <StatusBadge status={po.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{po.issuedDate}</TableCell>
                    <TableCell className="text-muted-foreground">{po.expectedDelivery}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(po.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <SheetTitle>{selected.number}</SheetTitle>
                  <StatusBadge status={selected.status} />
                </div>
                <SheetDescription>{selected.vendor}</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-6 overflow-y-auto px-4 pb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Issued Date</span>
                    <span className="text-sm font-medium">{selected.issuedDate}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Expected Delivery</span>
                    <span className="text-sm font-medium">{selected.expectedDelivery}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold">Line Items</h3>
                  <div className="flex flex-col gap-2">
                    {selected.items.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{item.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.qty} × {formatCurrency(item.unitPrice)}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {formatCurrency(item.qty * item.unitPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(selected.amount)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button className="cursor-pointer">
                    <Truck data-icon="inline-start" />
                    Track Shipment
                  </Button>
                  <Button variant="outline" className="cursor-pointer">
                    <Download data-icon="inline-start" />
                    Download PO PDF
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
