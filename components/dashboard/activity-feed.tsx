import {
  FileText,
  FileSpreadsheet,
  ScrollText,
  Building2,
  Sparkles,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { recentActivity, type Activity } from "@/lib/data"
import { cn } from "@/lib/utils"

const iconMap: Record<Activity["type"], React.ComponentType<{ className?: string }>> = {
  request: FileText,
  rfq: FileSpreadsheet,
  po: ScrollText,
  vendor: Building2,
  ai: Sparkles,
}

export function ActivityFeed() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions across procurement</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="relative flex flex-col gap-5">
          {recentActivity.map((item, i) => {
            const Icon = iconMap[item.type]
            return (
              <li key={item.id} className="flex gap-3">
                <div className="relative flex flex-col items-center">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      item.type === "ai"
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  {i < recentActivity.length - 1 ? (
                    <div className="mt-1 w-px flex-1 bg-border" />
                  ) : null}
                </div>
                <div className="pb-1">
                  <p className="text-sm leading-snug">
                    <span className="font-medium">{item.actor}</span>{" "}
                    <span className="text-muted-foreground">{item.action}</span>{" "}
                    <span className="font-medium">{item.target}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.time}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}
