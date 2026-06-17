"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingDown, Percent } from "lucide-react"

interface MetricsProps {
  totalSpend: number
  estimatedSavings: number
  budgetUtilization: number
}

export function FinanceMetrics({ totalSpend, estimatedSavings, budgetUtilization }: MetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${(totalSpend / 1000000).toFixed(2)}M</div>
          <p className="text-xs text-muted-foreground">Year-to-date</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estimated Savings</CardTitle>
          <TrendingDown className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">${(estimatedSavings / 1000000).toFixed(2)}M</div>
          <p className="text-xs text-muted-foreground">Through optimization</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{budgetUtilization}%</div>
          <p className="text-xs text-muted-foreground">Q2 target: 85%</p>
        </CardContent>
      </Card>
    </div>
  )
}
