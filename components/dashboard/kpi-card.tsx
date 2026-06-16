import { TrendingUp, TrendingDown } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/src/lib/utils"

export function KpiCard({
  label,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  positiveIsGood = true,
  invertDelta = false,
}: {
  label: string
  value: string
  delta: number
  deltaLabel?: string
  icon: React.ComponentType<{ className?: string }>
  positiveIsGood?: boolean
  invertDelta?: boolean
}) {
  const isUp = delta >= 0
  const good = invertDelta ? !isUp : isUp
  const colorClass = positiveIsGood
    ? good
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-destructive"
    : "text-muted-foreground"

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4.5" />
          </div>
        </div>
        <div className="flex items-end justify-between gap-2">
          <span className="text-3xl font-semibold tracking-tight tabular-nums">
            {value}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className={cn("flex items-center gap-0.5 font-medium", colorClass)}>
            {isUp ? (
              <TrendingUp className="size-3.5" />
            ) : (
              <TrendingDown className="size-3.5" />
            )}
            {isUp ? "+" : ""}
            {delta}
            {deltaLabel}
          </span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
      </CardContent>
    </Card>
  )
}
