"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import Link from "next/link"
import { toast } from "sonner"
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
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RFQCreationModal } from "@/components/rfq-creation-modal"
import { getRFQsForOrganization } from "@/actions/rfq-fetch.actions"
import { getOrganizationIdFromClerk } from "@/actions/request-detail.actions"
import { Plus, Search, Sparkles, Loader2 } from "lucide-react"

interface RFQ {
  id: string
  rfqNumber: string
  title: string
  description: string | null
  status: string | null
  dueDate: Date | null
  expectedDeliveryDate: Date | null
  createdAt: Date
  publishedAt: Date | null
  vendorsInvited: number
  vendorsResponded: number
  estimatedValue: number
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

export default function RfqPage() {
  const { orgId, orgRole } = useAuth()
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState("all")
  const [rfqModalOpen, setRFQModalOpen] = useState(false)
  const [dbOrgId, setDbOrgId] = useState<string | null>(null)
  const [rfqs, setRfqs] = useState<RFQ[]>([])
  const [loading, setLoading] = useState(true)
  
  const isAuthorizedForRFQ = orgRole && ["org:admin", "org:procurement_manager"].includes(orgRole)

  useEffect(() => {
    const fetchData = async () => {
      if (!orgId) return
      
      try {
        // Fetch organization ID
        const orgResult = await getOrganizationIdFromClerk(orgId)
        if (orgResult.success && orgResult.organizationId) {
          setDbOrgId(orgResult.organizationId)
        }

        // Fetch RFQs
        const rfqResult = await getRFQsForOrganization()
        if (rfqResult.success && rfqResult.data) {
          setRfqs(rfqResult.data as RFQ[])
        } else {
          toast.error(rfqResult.error || "Failed to load RFQs")
        }
      } catch (error) {
        console.error("[RFQPage] Error:", error)
        toast.error("Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [orgId])

  const filtered = rfqs.filter((rfq) => {
    const matchesQuery =
      rfq.title.toLowerCase().includes(query.toLowerCase()) ||
      rfq.rfqNumber.toLowerCase().includes(query.toLowerCase())
    const matchesTab =
      tab === "all" ||
      (tab === "active" && (rfq.status === "open" || rfq.status === "draft")) ||
      (tab === "awarded" && rfq.status === "awarded") ||
      (tab === "closed" && rfq.status === "closed")
    return matchesQuery && matchesTab
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="RFQ Management"
        description="Issue requests for quotes and let AI rank vendor responses."
      >
        {isAuthorizedForRFQ && (
          <Button 
            className="cursor-pointer"
            onClick={() => setRFQModalOpen(true)}
          >
            <Plus data-icon="inline-start" />
            Create RFQ
          </Button>
        )}
      </PageHeader>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="awarded">Awarded</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
        </Tabs>
        <InputGroup className="lg:max-w-xs">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search RFQs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
      </div>

      <Card>
        <CardContent className="overflow-x-auto pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              {rfqs.length === 0 ? "No RFQs created yet" : "No RFQs match your search"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RFQ</TableHead>
                  <TableHead>Responses</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((rfq) => (
                  <TableRow key={rfq.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{rfq.title}</span>
                        <span className="text-xs text-muted-foreground">{rfq.rfqNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex w-28 flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          {rfq.vendorsResponded} / {rfq.vendorsInvited} responded
                        </span>
                        <Progress 
                          value={rfq.vendorsInvited > 0 ? (rfq.vendorsResponded / rfq.vendorsInvited) * 100 : 0} 
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {rfq.dueDate
                        ? new Date(rfq.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "Not set"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {rfq.expectedDeliveryDate
                        ? new Date(rfq.expectedDeliveryDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "Not set"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={rfq.status ?? '-'} />
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {new Date(rfq.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      {rfq.vendorsResponded > 0 && <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={`/rfq/${rfq.id}`} />}
                        nativeButton={false}
                        className="cursor-pointer"
                      >
                        <Sparkles data-icon="inline-start" />
                        Compare
                      </Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* RFQ Creation Modal - For creating RFQ from existing approved requests */}
      {dbOrgId && isAuthorizedForRFQ && (
        <RFQCreationModal
          open={rfqModalOpen}
          onOpenChange={setRFQModalOpen}
          requestId=""
          organizationId={dbOrgId}
          requestNumber=""
          requestTitle="New RFQ"
          showRequestSummary={false}
        />
      )}
    </div>
  )
}
