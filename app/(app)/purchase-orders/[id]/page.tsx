"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { redirect, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileText, Download } from "lucide-react"
import { getPurchaseOrderDetails, updatePOStatus } from "@/actions/purchase-orders.actions"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface POItem {
  id: string
  lineNumber: number
  itemName: string
  description?: string
  quantity: string
  unitPrice: string
  totalPrice: string
}

interface PODetails {
  po: {
    id: string
    poNumber: string
    requestId: string
    vendorId?: string
    status: string
    totalAmount: string
    currency: string
    expectedDelivery?: Date
    createdBy: string
    issuedAt?: Date
    createdAt: Date
  }
  items: POItem[]
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  ISSUED: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-green-100 text-green-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
}

export default function PODetailPage() {
  const { orgId, orgRole } = useAuth()
  const params = useParams()
  const poId = params.id as string

  const [poDetails, setPODetails] = useState<PODetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState<string>("")

  // Check authorization
  if (orgRole !== "org:procurement_manager" && orgRole !== "org:admin") {
    redirect("/access-denied")
  }

  useEffect(() => {
    const loadDetails = async () => {
      if (!orgId || !poId) return

      const result = await getPurchaseOrderDetails(poId, orgId)
      if (result.success && result.po) {
        setPODetails(result as any)
        setNewStatus(result.po.status)
      } else {
        toast.error("Failed to load purchase order")
      }
      setLoading(false)
    }

    loadDetails()
  }, [orgId, poId])

  const handleStatusChange = async (status: string) => {
    if (!orgId || !poId) return

    setUpdatingStatus(true)
    try {
      const result = await updatePOStatus(poId, status as any, orgId)
      if (result.success) {
        setNewStatus(status)
        toast.success(`PO status updated to ${status}`)
        // Reload details
        const detailResult = await getPurchaseOrderDetails(poId, orgId)
        if (detailResult.success && detailResult.po) {
          setPODetails(detailResult as any)
        }
      } else {
        toast.error(result.error || "Failed to update status")
      }
    } finally {
      setUpdatingStatus(false)
    }
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "-"
    const d = new Date(date)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  if (loading) {
    return <div className="text-center py-8">Loading purchase order...</div>
  }

  if (!poDetails) {
    return <div className="text-center py-8 text-red-600">Purchase order not found</div>
  }

  const totalAmount = poDetails.items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/purchase-orders">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={poDetails.po.poNumber}
          description={`Status: ${poDetails.po.status}`}
          icon={FileText}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Status</div>
          <div className="mt-3">
            <Select value={newStatus} onValueChange={handleStatusChange} disabled={updatingStatus}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ISSUED">Issued</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Amount</div>
          <div className="mt-2 text-2xl font-bold">
            {poDetails.po.currency} {totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Expected Delivery</div>
          <div className="mt-2 text-lg font-medium">{formatDate(poDetails.po.expectedDelivery)}</div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Line Items</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Line</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {poDetails.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No line items
                  </TableCell>
                </TableRow>
              ) : (
                poDetails.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.lineNumber}</TableCell>
                    <TableCell className="font-medium">{item.itemName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{item.description || "-"}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      {poDetails.po.currency} {parseFloat(item.unitPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {poDetails.po.currency} {parseFloat(item.totalPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))
              )}
              <TableRow className="font-bold">
                <TableCell colSpan={5} className="text-right">
                  Total
                </TableCell>
                <TableCell>
                  {poDetails.po.currency} {totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Created</span>
            <div className="font-medium">{formatDate(poDetails.po.createdAt)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Issued</span>
            <div className="font-medium">{formatDate(poDetails.po.issuedAt)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Request ID</span>
            <div className="font-mono text-xs">{poDetails.po.requestId.substring(0, 8)}...</div>
          </div>
          <div>
            <span className="text-muted-foreground">Vendor ID</span>
            <div className="font-mono text-xs">{poDetails.po.vendorId ? poDetails.po.vendorId.substring(0, 8) + "..." : "N/A"}</div>
          </div>
        </div>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
        <Link href="/purchase-orders" className="flex-1">
          <Button variant="outline" className="w-full">
            Back to Orders
          </Button>
        </Link>
      </div>
    </div>
  )
}
