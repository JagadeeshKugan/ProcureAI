import { Suspense } from "react"
import { PageHeader } from "@/components/page-header"
import { FinanceMetrics } from "@/components/finance/metrics"
import { SpendByDepartment } from "@/components/finance/spend-by-department"
import { MonthlyTrend } from "@/components/finance/monthly-trend"
import { CostInsights } from "@/components/finance/cost-insights"
import { ExportSection } from "@/components/finance/export-section"
import { AnalyticsService } from "@/services/analytics.service"

export const metadata = {
  title: "Finance Analytics - ProcureAI",
  description: "Finance and procurement analytics dashboard",
}

export const dynamic = "force-dynamic"

async function FinanceContent() {
  const analyticsService = new AnalyticsService()
  const data = await analyticsService.getFinanceOverview({})

  return (
    <>
      <PageHeader title="Finance Analytics" description="Procurement spend and budget overview" />

      <div className="space-y-6">
        {/* Key Metrics */}
        <FinanceMetrics
          totalSpend={data.totalSpend}
          estimatedSavings={data.estimatedSavings}
          budgetUtilization={data.budgetUtilization}
        />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SpendByDepartment data={data.spendByCategory} />
          <MonthlyTrend data={data.monthlyTrend} />
        </div>

        {/* Insights and Export */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CostInsights insights={data.costInsights} />
          <ExportSection />
        </div>
      </div>
    </>
  )
}

export default function FinancePage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading analytics...</div>}>
      <FinanceContent />
    </Suspense>
  )
}
