"use client"

import { Card } from "@/components/ui/card"
import { ShoppingCart } from "lucide-react"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

export default function VendorOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track your accepted quotes and purchase orders.
        </p>
      </div>

      <Card>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShoppingCart />
            </EmptyMedia>
            <EmptyTitle>No orders yet</EmptyTitle>
            <EmptyDescription>
              Your accepted quotes will appear here as purchase orders.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Card>
    </div>
  )
}
