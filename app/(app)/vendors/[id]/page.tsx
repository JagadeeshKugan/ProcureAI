"use client"

import { use } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { StatusBadge } from "@/components/status-badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { vendors, purchaseOrders, formatCurrency } from "@/lib/data"
import {
  ArrowLeft,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Sparkles,
  Star,
} from "lucide-react"

const monthlyOnTime = [
  { month: "Jan", rate: 92 },
  { month: "Feb", rate: 95 },
  { month: "Mar", rate: 88 },
  { month: "Apr", rate: 96 },
  { month: "May", rate: 94 },
  { month: "Jun", rate: 97 },
]

export default function VendorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const vendor = vendors.find((v) => v.id === id)
  if (!vendor) notFound()

  const vendorOrders = purchaseOrders.filter((po) => po.vendor === vendor.name)

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link href="/vendors">
          <ArrowLeft data-icon="inline-start" />
          Back to Vendors
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-16 rounded-xl">
            <AvatarFallback className="rounded-xl bg-primary/10 text-lg font-semibold text-primary">
              {vendor.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-balance">
                {vendor.name}
              </h1>
              <StatusBadge status={vendor.status} />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {vendor.location}
              </span>
              <span className="flex items-center gap-1">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                {vendor.rating} rating
              </span>
              <Badge variant="secondary">{vendor.category}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <MessageSquare data-icon="inline-start" />
            Message
          </Button>
          <Button>Create RFQ</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-sm text-muted-foreground">Total Spend</span>
            <span className="text-2xl font-semibold tracking-tight">
              {formatCurrency(vendor.spend, true)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-sm text-muted-foreground">Orders Placed</span>
            <span className="text-2xl font-semibold tracking-tight">{vendor.orders}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-sm text-muted-foreground">On-Time Delivery</span>
            <span className="text-2xl font-semibold tracking-tight">
              {vendor.onTimeDelivery}%
            </span>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              AI Match Score
            </span>
            <span className="text-2xl font-semibold tracking-tight text-primary">
              {vendor.aiScore}
            </span>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>AI Vendor Assessment</CardTitle>
                <CardDescription>
                  Generated from delivery history, pricing competitiveness, and compliance.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {vendor.name} is a{" "}
                  <span className="font-medium text-foreground">strong strategic supplier</span>{" "}
                  in {vendor.category.toLowerCase()}, with an on-time delivery rate of{" "}
                  {vendor.onTimeDelivery}% and consistent quality scores. Pricing sits within
                  the competitive band for the category, and contract compliance is fully up to
                  date. Recommended for continued preferred-vendor status.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Price Competitiveness", value: vendor.aiScore - 4 },
                    { label: "Reliability", value: vendor.onTimeDelivery },
                    { label: "Quality", value: vendor.performanceScore },
                  ].map((m) => (
                    <div key={m.label} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{m.label}</span>
                        <span className="font-medium">{m.value}</span>
                      </div>
                      <Progress value={m.value} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Primary Contact</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback>
                      {vendor.contact.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{vendor.contact.name}</span>
                    <span className="text-xs text-muted-foreground">Account Manager</span>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-col gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <Mail className="size-4 text-muted-foreground" />
                    {vendor.contact.email}
                  </span>
                  <span className="flex items-center gap-2">
                    <Phone className="size-4 text-muted-foreground" />
                    {vendor.contact.phone}
                  </span>
                  <span className="flex items-center gap-2">
                    <FileText className="size-4 text-muted-foreground" />
                    Lead time: {vendor.leadTime}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>On-Time Delivery Rate</CardTitle>
              <CardDescription>Monthly delivery performance over the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  rate: { label: "On-time %", color: "var(--chart-1)" },
                }}
                className="h-[280px] w-full"
              >
                <BarChart data={monthlyOnTime}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis domain={[60, 100]} tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="rate" fill="var(--color-rate)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {vendor.documents.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {vendor.documents.map((doc) => (
                    <div
                      key={doc.name}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-secondary">
                          <FileText className="size-4 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{doc.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {doc.type} · {doc.date}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No documents on file for this vendor.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {vendorOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorOrders.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.number}</TableCell>
                        <TableCell>
                          <StatusBadge status={po.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">{po.issuedDate}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(po.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No orders placed with this vendor yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
