"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface MonthlyTrendProps {
  data: Array<{ month: string; actual: number; budget: number }>
}

export function MonthlyTrend({ data }: MonthlyTrendProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: any) => `$${(value / 1000).toFixed(0)}K`} />
            <Legend />
            <Line type="monotone" dataKey="actual" stroke="#3b82f6" name="Actual Spend" />
            <Line type="monotone" dataKey="budget" stroke="#10b981" name="Budget" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
