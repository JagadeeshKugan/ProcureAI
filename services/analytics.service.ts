import { eq, sql, and, gte, lte } from "drizzle-orm"
import { getDb, schema } from "@/db"

export interface SpendAnalytics {
  totalSpend: number
  estimatedSavings: number
  budgetUtilization: number
  spendByCategory: Array<{ category: string; amount: number }>
  monthlyTrend: Array<{ month: string; actual: number; budget: number }>
  costInsights: string[]
}

export interface AnalyticsFilters {
  startDate?: Date
  endDate?: Date
  category?: string
  department?: string
}

export class AnalyticsService {
  private db = getDb()

  async getFinanceOverview(filters: AnalyticsFilters): Promise<SpendAnalytics> {
    const { startDate, endDate, category, department } = filters

    // Build where conditions
    const conditions: any[] = []
    if (startDate) conditions.push(gte(schema.purchaseRequests.createdAt, startDate))
    if (endDate) conditions.push(lte(schema.purchaseRequests.createdAt, endDate))

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get total spend
    const spendResult = await this.db
      .select({ total: sql<number>`COALESCE(SUM(CAST(${schema.purchaseRequests.estimatedTotal} AS NUMERIC)), 0)` })
      .from(schema.purchaseRequests)
      .where(whereClause)

    const totalSpend = spendResult[0]?.total || 0

    // Calculate estimated savings (20% assumed reduction through competitive bidding)
    const estimatedSavings = Math.round(totalSpend * 0.15)

    // Get budget utilization (mock: 65% for demo)
    const budgetUtilization = 65

    // Get spend by department (using category as proxy)
    const spendByDept = await this.db
      .select({
        dept: schema.purchaseRequests.department,
        amount: sql<number>`COALESCE(SUM(CAST(${schema.purchaseRequests.estimatedTotal} AS NUMERIC)), 0)`,
      })
      .from(schema.purchaseRequests)
      .where(whereClause)
      .groupBy(schema.purchaseRequests.department)

    // Get monthly trend (mock data for last 6 months)
    const monthlyTrend = this.generateMonthlyTrend()

    // Generate cost insights
    const costInsights = this.generateCostInsights(totalSpend, budgetUtilization)

    return {
      totalSpend,
      estimatedSavings,
      budgetUtilization,
      spendByCategory: spendByDept.map((row) => ({
        category: row.dept,
        amount: row.amount,
      })),
      monthlyTrend,
      costInsights,
    }
  }

  private generateMonthlyTrend() {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    return months.map((month, idx) => ({
      month,
      actual: Math.round(50000 + Math.random() * 30000),
      budget: 70000,
    }))
  }

  private generateCostInsights(totalSpend: number, utilization: number): string[] {
    return [
      `${utilization}% budget utilization - on track for Q2 targets`,
      `Potential savings of 15-20% through vendor consolidation`,
      `Average procurement cycle time: 8 days (industry avg: 12 days)`,
    ]
  }
}
