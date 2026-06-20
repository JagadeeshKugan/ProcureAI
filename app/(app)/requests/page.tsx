"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, Search, CalendarDays, FileText, Paperclip, CheckCircle, Clock } from "lucide-react"
import { listPurchaseRequests } from "@/actions/purchase-request.actions"

import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import {
  purchaseRequests,
  formatCurrency,
  type PurchaseRequest,
} from "@/lib/data"

interface DBRequest {
  id: string
  requestNumber: string
  title: string
  department?: string
  estimatedTotal: string
  currency: string
  status: string
  createdAt: Date
  requestedBy: string
  approvalRoute?: string
}

const departments = [
  "All Departments",
  "Engineering",
  "Marketing",
  "Facilities",
  "IT Infrastructure",
  "Manufacturing",
  "Operations",
]

const statuses = [
  "All Statuses",
  "Draft",
  "Pending Approval",
  "Approved",
  "In RFQ",
  "Rejected",
]

export default function RequestsPage() {
  const [search, setSearch] = React.useState("")
  const [dept, setDept] = React.useState("All Departments")
  const [status, setStatus] = React.useState("All Statuses")
  const [selected, setSelected] = React.useState<(PurchaseRequest & { approvalRoute?: string[] }) | null>(null)
  const [dbRequests, setDbRequests] = React.useState<DBRequest[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Load database requests
  React.useEffect(() => {
    const loadRequests = async () => {
      try {
        const result = await listPurchaseRequests(1, 50)
        if (result.success && result.data?.requests) {
          setDbRequests(result.data.requests as DBRequest[])
        }
      } catch (error) {
        console.error("[RequestsPage] Failed to load requests:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadRequests()
  }, [])

  // Convert DB requests to mock format for display
  const allRequests = React.useMemo(() => {
    const converted = dbRequests.map((r) => ({
      id: r.id,
      title: r.title,
      requester: "System User",
      department: r.department || "Engineering",
      budget: Number(r.estimatedTotal) || 0,
      status: r.status === "draft" ? "Draft" : r.status === "pending_approval" ? "Pending Approval" : r.status === "approved" ? "Approved" : "In RFQ",
      category: "Equipment",
      createdDate: r.createdAt,
      requiredDate: new Date(),
      businessNeed: "",
      attachments: [],
      approvalRoute: r.approvalRoute ? JSON.parse(r.approvalRoute) : [],
    }))

    // Combine with mock data, sorted by newest first
    return [...converted, ...purchaseRequests].sort(
      (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    )
  }, [dbRequests])

  const filtered = allRequests.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.requester.toLowerCase().includes(search.toLowerCase())
    const matchesDept = dept === "All Departments" || r.department === dept
    const matchesStatus = status === "All Statuses" || r.status === status
    return matchesSearch && matchesDept && matchesStatus
  })

  return (
    <>
      <PageHeader
        title="Purchase Requests"
        description="Track, approve, and route procurement requests across departments."
      >
        <Button render={<Link href="/requests/create" />} nativeButton={false} className="cursor-pointer">
          <Plus data-icon="inline-start" />
          Create New Request
        </Button>
      </PageHeader>

      <Card className="p-0">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title or requester..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-3">
            <Select value={status} onValueChange={(value) => setStatus(value ?? "All Statuses")}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={dept} onValueChange={(value) => setDept(value ?? "All Departments")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>No requests found</EmptyTitle>
              <EmptyDescription>
                Try adjusting your filters or create a new purchase request.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r, i) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(r)}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    PR-{1042 + i}
                  </TableCell>
                  <TableCell className="max-w-[280px] font-medium">
                    <span className="block truncate">{r.title}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.department}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(r.budget)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(r.createdDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <RequestDetailsDrawer
        request={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  )
}

function RequestDetailsDrawer({
  request,
  onOpenChange,
}: {
  request: (PurchaseRequest & { approvalRoute?: string[] }) | null
  onOpenChange: (open: boolean) => void
}) {
  const approvalCount = request?.approvalRoute?.length || 0
  
  return (
    <Sheet open={!!request} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {request ? (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <StatusBadge status={request.status} />
                <span className="text-xs text-muted-foreground">
                  {request.category}
                </span>
              </div>
              <SheetTitle className="text-balance">{request.title}</SheetTitle>
              <SheetDescription>
                Requested by {request.requester} · {request.department}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-6 px-4 pb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {formatCurrency(request.budget)}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Required date</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                    <CalendarDays className="size-4 text-muted-foreground" />
                    {new Date(request.requiredDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {request.businessNeed && (
                <div>
                  <h3 className="text-sm font-medium">Business Need</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {request.businessNeed}
                  </p>
                </div>
              )}

              <Separator />

              {/* Approval Route */}
              {approvalCount > 0 && (
                <div>
                  <h3 className="text-sm font-medium">Approval Route</h3>
                  <div className="mt-3 space-y-2">
                    {Array.from({ length: approvalCount }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <span className="text-muted-foreground">
                          Approver {i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {request.attachments.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium">
                      Attachments ({request.attachments.length})
                    </h3>
                    <div className="mt-2 flex flex-col gap-2">
                      {request.attachments.map((file) => (
                        <div
                          key={file.name}
                          className="flex items-center gap-3 rounded-lg border p-2.5"
                        >
                          <div className="flex size-8 items-center justify-center rounded bg-muted">
                            <Paperclip className="size-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {file.size}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {request.status !== "Draft" && (
                <>
                  <Separator />
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 cursor-pointer">
                      Reject
                    </Button>
                    <Button className="flex-1 cursor-pointer">Approve &amp; Route to RFQ</Button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
