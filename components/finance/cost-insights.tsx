"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb } from "lucide-react"

interface InsightsProps {
  insights: string[]
}

export function CostInsights({ insights }: InsightsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">Cost Optimization</CardTitle>
        <Lightbulb className="h-4 w-4 text-yellow-600" />
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {insights.map((insight, idx) => (
            <li key={idx} className="text-sm text-muted-foreground flex gap-2">
              <span className="text-yellow-600">•</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
