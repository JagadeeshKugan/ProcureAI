"use client"

import { useState, useEffect } from "react"
import { Search, MessageSquare, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getVendorQuotations } from "@/actions/vendor.actions"

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

interface Quotation {
  id: string
  rfqId: string
  rfqNumber: string
  rfqTitle: string
  price: string
  deliveryDays: number
  warranty: string | null
  status: string | null
  submittedAt: Date
}

export default function VendorQuotesPage() {
  const [search, setSearch] = useState("")
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const result = await getVendorQuotations()
        if (result.success) {
          setQuotations(result.data || [])
        } else {
          toast.error(result.error || "Failed to load quotations")
        }
      } catch (error) {
        console.error("Error fetching quotations:", error)
        toast.error("Failed to load quotations")
      } finally {
        setLoading(false)
      }
    }

    fetchQuotations()
  }, [])

  const filtered = quotations.filter((quote) =>
    quote.rfqTitle.toLowerCase().includes(search.toLowerCase()) ||
    quote.rfqNumber.toLowerCase().includes(search.toLowerCase())
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
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
                <TableHead>RFQ Number</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Delivery (days)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-mono text-xs font-medium">
                    {quote.rfqNumber}
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <span className="line-clamp-1">{quote.rfqTitle}</span>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    ${parseFloat(quote.price).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {quote.deliveryDays}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        quote.status === "accepted"
                          ? "default"
                          : quote.status === "submitted"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {quote.status || "unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(quote.submittedAt).toLocaleDateString("en-US", {
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
