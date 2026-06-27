"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getVendorRFQs } from "@/actions/vendor.actions"

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

interface RFQ {
  id: string
  rfqNumber: string
  title: string
  description: string | null
  status: string | null
  createdAt: Date
}

export default function VendorRFQsPage() {
  const [search, setSearch] = useState("")
  const [rfqs, setRfqs] = useState<RFQ[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRFQs = async () => {
      try {
        const result = await getVendorRFQs()
        if (result.success) {
          setRfqs(result.data || [])
        } else {
          toast.error(result.error || "Failed to load RFQs")
        }
      } catch (error) {
        console.error("Error fetching RFQs:", error)
        toast.error("Failed to load RFQs")
      } finally {
        setLoading(false)
      }
    }

    fetchRFQs()
  }, [])

  const filtered = rfqs.filter((rfq) =>
    rfq.title.toLowerCase().includes(search.toLowerCase()) ||
    rfq.rfqNumber.toLowerCase().includes(search.toLowerCase())
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>No RFQs found</EmptyTitle>
              <EmptyDescription>
                {rfqs.length === 0
                  ? "You haven't been assigned any RFQs yet."
                  : "Try adjusting your search or check back later for new RFQs."}
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
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((rfq) => (
                <TableRow key={rfq.id}>
                  <TableCell className="font-mono text-xs font-medium">
                    {rfq.rfqNumber}
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <span className="line-clamp-1">{rfq.title}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        rfq.status === "draft"
                          ? "secondary"
                          : rfq.status === "sent"
                            ? "default"
                            : "outline"
                      }
                    >
                      {rfq.status || "unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(rfq.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
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
