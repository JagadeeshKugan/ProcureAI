"use client"

import * as React from "react"
import { Plus, Search, CalendarDays, FileText, Paperclip } from "lucide-react"

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { toast } from "sonner"
import {
  purchaseRequests,
  formatCurrency,
  type PurchaseRequest,
} from "@/lib/data"

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
  const [selected, setSelected] = React.useState<PurchaseRequest | null>(null)

  const filtered = purchaseRequests.filter((r) => {
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
        <CreateRequestDialog />
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

function CreateRequestDialog() {
  const [open, setOpen] = React.useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setOpen(false)
    toast.success("Purchase request created", {
      description: "Your request has been submitted for approval.",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus data-icon="inline-start" />
            Create New Request
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Purchase Request</DialogTitle>
            <DialogDescription>
              Describe what you need. AI will suggest the right category and
              vendors.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="title">Request title</FieldLabel>
              <Input id="title" placeholder="e.g. 50x Standing Desks" required />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="dept">Department</FieldLabel>
                <Select defaultValue="Engineering">
                  <SelectTrigger id="dept">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {departments.slice(1).map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="budget">Budget (USD)</FieldLabel>
                <Input id="budget" type="number" placeholder="50000" required />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="need">Business need</FieldLabel>
              <Textarea
                id="need"
                placeholder="Explain the business justification..."
                rows={4}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="date">Required by</FieldLabel>
              <Input id="date" type="date" required />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit Request</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RequestDetailsDrawer({
  request,
  onOpenChange,
}: {
  request: PurchaseRequest | null
  onOpenChange: (open: boolean) => void
}) {
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

              <div>
                <h3 className="text-sm font-medium">Business Need</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {request.businessNeed}
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium">
                  Attachments ({request.attachments.length})
                </h3>
                <div className="mt-2 flex flex-col gap-2">
                  {request.attachments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No attachments provided.
                    </p>
                  ) : (
                    request.attachments.map((file) => (
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
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  Reject
                </Button>
                <Button className="flex-1">Approve &amp; Route to RFQ</Button>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
