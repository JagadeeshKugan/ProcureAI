"use client"

import { useState } from "react"
import Link from "next/link"
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
import { rfqs, formatCurrency } from "@/lib/data"
import { Plus, Search, Sparkles } from "lucide-react"

export default function RfqPage() {
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState("all")

  const filtered = rfqs.filter((rfq) => {
    const matchesQuery =
      rfq.title.toLowerCase().includes(query.toLowerCase()) ||
      rfq.number.toLowerCase().includes(query.toLowerCase())
    const matchesTab =
      tab === "all" ||
      (tab === "active" && (rfq.status === "Open" || rfq.status === "Closing Soon")) ||
      (tab === "awarded" && rfq.status === "Awarded") ||
      (tab === "closed" && rfq.status === "Closed")
    return matchesQuery && matchesTab
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="RFQ Management"
        description="Issue requests for quotes and let AI rank vendor responses."
      >
        <Button>
          <Plus data-icon="inline-start" />
          Create RFQ
        </Button>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RFQ</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Responses</TableHead>
                <TableHead>Closing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Est. Value</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((rfq) => (
                <TableRow key={rfq.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{rfq.title}</span>
                      <span className="text-xs text-muted-foreground">{rfq.number}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{rfq.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex w-28 flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        {rfq.vendorsResponded} / {rfq.vendorsInvited} responded
                      </span>
                      <Progress value={(rfq.vendorsResponded / rfq.vendorsInvited) * 100} />
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{rfq.closingDate}</TableCell>
                  <TableCell>
                    <StatusBadge status={rfq.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(rfq.estimatedValue, true)}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/rfq/${rfq.id}`}>
                        <Sparkles data-icon="inline-start" />
                        Compare
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
