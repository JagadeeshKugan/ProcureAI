import Link from "next/link"
import { Suspense } from "react"
import {
  Building2,
  Clock,
  FileSpreadsheet,
  PiggyBank,
  Plus,
  GitCompareArrows,
  ArrowRight,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { KpiCard } from "@/components/dashboard/kpi-card"
import {
  SpendByCategoryChart,
  MonthlyTrendChart,
  VendorPerformanceChart,
} from "@/components/dashboard/charts"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/data"
import { getDashboardMetrics } from "@/actions/dashboard.actions"
import { auth } from "@clerk/nextjs/server"

const quickActions = [
  {
    title: "Create Request",
    desc: "Start a new purchase request",
    href: "/requests",
    icon: Plus,
  },
  {
    title: "Generate RFQ",
    desc: "AI-drafted request for quote",
    href: "/rfq",
    icon: FileSpreadsheet,
  },
  {
    title: "Compare Quotes",
    desc: "Analyze supplier quotations",
    href: "/purchase-orders",
    icon: GitCompareArrows,
  },
]

async function DashboardMetrics() {
  const result = await getDashboardMetrics()
  const metrics = result.data || {
    totalVendors: 0,
    totalVendorsDelta: 0,
    pendingRequests: 0,
    pendingRequestsDelta: 0,
    activeRfqs: 0,
    activeRfqsDelta: 0,
    savings: 0,
    savingsDelta: 0,
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Total Vendors"
        value={metrics.totalVendors.toString()}
        delta={metrics.totalVendorsDelta}
        icon={Building2}
      />
      <KpiCard
        label="Pending Requests"
        value={metrics.pendingRequests.toString()}
        delta={metrics.pendingRequestsDelta}
        icon={Clock}
        invertDelta
      />
      <KpiCard
        label="Active RFQs"
        value={metrics.activeRfqs.toString()}
        delta={metrics.activeRfqsDelta}
        icon={FileSpreadsheet}
      />
      <KpiCard
        label="Procurement Savings"
        value={formatCurrency(metrics.savings, true)}
        delta={metrics.savingsDelta}
        deltaLabel="%"
        icon={PiggyBank}
      />
    </div>
  )
}

export default async function DashboardPage() {
  const { orgId, orgRole } = await auth()

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Welcome back, Alex. Here is your procurement overview."
      >
       { ['org:admin','org:requester'].includes(orgRole!) && <Button
          variant="outline"
          render={<Link href="/requests" />}
          nativeButton={false}
          className="cursor-pointer"
        >
          <Plus data-icon="inline-start" />
          New Request
        </Button>}
        <Button render={<Link href="/copilot" />} nativeButton={false} className="cursor-pointer">
          Ask Copilot
        </Button>
      </PageHeader>

      {/* KPIs */}
      <Suspense fallback={<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>}>
        <DashboardMetrics />
      </Suspense>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MonthlyTrendChart />
        <SpendByCategoryChart />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <VendorPerformanceChart />
          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href} className="group">
                <Card className="h-full transition-colors hover:border-primary/40 hover:bg-accent/40">
                  <CardContent className="flex h-full flex-col gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <action.icon className="size-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{action.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {action.desc}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-medium text-primary">
                      Go
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
        <ActivityFeed />
      </div>
    </>
  )
}
