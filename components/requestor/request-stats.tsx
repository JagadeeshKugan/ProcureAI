"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Clock, XCircle, FileText } from "lucide-react"

interface RequestStatsProps {
  pending: number
  approved: number
  rejected: number
  converted: number
}

export function RequestStats({ pending, approved, rejected, converted }: RequestStatsProps) {
  const stats = [
    { label: "Pending", value: pending, icon: Clock, color: "text-yellow-600" },
    { label: "Approved", value: approved, icon: CheckCircle2, color: "text-green-600" },
    { label: "Rejected", value: rejected, icon: XCircle, color: "text-red-600" },
    { label: "Converted to RFQ", value: converted, icon: FileText, color: "text-blue-600" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`size-8 ${stat.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
