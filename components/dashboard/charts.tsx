"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  spendByCategory,
  monthlyTrend,
  vendorPerformance,
  formatCurrency,
} from "@/lib/data"

const spendConfig = {
  spend: { label: "Spend", color: "var(--chart-1)" },
} satisfies ChartConfig

const trendConfig = {
  spend: { label: "Spend", color: "var(--chart-1)" },
  savings: { label: "Savings", color: "var(--chart-2)" },
} satisfies ChartConfig

const perfConfig = {
  score: { label: "Performance", color: "var(--chart-1)" },
} satisfies ChartConfig

export function SpendByCategoryChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spend by Category</CardTitle>
        <CardDescription>Year-to-date procurement spend</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={spendConfig} className="h-[260px] w-full">
          <BarChart
            data={spendByCategory}
            layout="vertical"
            margin={{ left: 12, right: 16 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => formatCurrency(v, true)}
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="category"
              tickLine={false}
              axisLine={false}
              width={110}
              fontSize={12}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatCurrency(Number(value))}
                />
              }
            />
            <Bar dataKey="spend" fill="var(--color-spend)" radius={6} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function MonthlyTrendChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Procurement Trend</CardTitle>
        <CardDescription>Spend versus realized savings</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={trendConfig} className="h-[260px] w-full">
          <AreaChart data={monthlyTrend} margin={{ left: 4, right: 12 }}>
            <defs>
              <linearGradient id="fillSpend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-spend)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-spend)" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="fillSavings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-savings)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-savings)" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <YAxis
              tickFormatter={(v) => formatCurrency(v, true)}
              tickLine={false}
              axisLine={false}
              width={48}
              fontSize={12}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <span className="flex w-full items-center justify-between gap-3">
                      <span className="text-muted-foreground capitalize">
                        {name}
                      </span>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(Number(value))}
                      </span>
                    </span>
                  )}
                />
              }
            />
            <Area
              dataKey="spend"
              type="monotone"
              fill="url(#fillSpend)"
              stroke="var(--color-spend)"
              strokeWidth={2}
            />
            <Area
              dataKey="savings"
              type="monotone"
              fill="url(#fillSavings)"
              stroke="var(--color-savings)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function VendorPerformanceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Performance</CardTitle>
        <CardDescription>Top suppliers by overall score</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={perfConfig} className="h-[260px] w-full">
          <BarChart data={vendorPerformance} margin={{ left: 4, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={11}
              tickFormatter={(v: string) => v.split(" ")[0]}
            />
            <YAxis
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              width={32}
              fontSize={12}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="score" radius={6}>
              {vendorPerformance.map((_, i) => (
                <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
