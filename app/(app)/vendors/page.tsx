"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AddVendorModal } from "@/components/add-vendor-modal"
import { getAllVendors } from "@/actions/vendor-management.actions"
import { Search, Loader2 } from "lucide-react"

interface Vendor {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  companyName: string | null
  status: string | null
  createdAt: Date
  organizationId: string | null
  organizationName: string | null
}

export default function VendorsPage() {
  const [query, setQuery] = useState("")
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchVendors = async () => {
    try {
      const result = await getAllVendors()
      if (result.success && result.data) {
        setVendors(result.data as Vendor[])
      } else {
        toast.error(result.error || "Failed to load vendors")
      }
    } catch (error) {
      console.error("[VendorsPage] Error:", error)
      toast.error("Failed to load vendors")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [])

  const handleVendorCreated = () => {
    setRefreshing(true)
    fetchVendors()
  }

  const filtered = vendors.filter((v) => {
    const fullName = `${v.firstName || ""} ${v.lastName || ""}`.toLowerCase()
    const companyMatch = v.companyName?.toLowerCase() || ""
    const matchesQuery =
      fullName.includes(query.toLowerCase()) ||
      companyMatch.includes(query.toLowerCase()) ||
      v.email.toLowerCase().includes(query.toLowerCase())
    return matchesQuery
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Vendor Management"
        description="Manage your vendor network and create new vendor accounts."
      >
        <AddVendorModal onVendorCreated={handleVendorCreated} />
      </PageHeader>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-4">
            <InputGroup className="flex-1 lg:max-w-xs">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search vendors..."
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
              {vendors.length === 0 ? "No vendors created yet" : "No vendors match your search"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 rounded-lg">
                          <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                            {`${vendor.firstName?.[0] || ""}${vendor.lastName?.[0] || ""}`.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {vendor.firstName} {vendor.lastName}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {vendor.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {vendor.organizationName || vendor.companyName || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={vendor.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(vendor.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        render={<Link href={`/vendors/${vendor.id}`} />}
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
