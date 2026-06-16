import { Badge } from "@/components/ui/badge"
import { cn } from "@/src/lib/utils"

const statusStyles: Record<string, string> = {
  // Request statuses
  Draft: "bg-muted text-muted-foreground border-transparent",
  "Pending Approval":
    "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-transparent",
  Approved:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent",
  "In RFQ": "bg-primary/15 text-primary border-transparent",
  Rejected: "bg-destructive/15 text-destructive border-transparent",
  // RFQ statuses
  Open: "bg-primary/15 text-primary border-transparent",
  "Closing Soon":
    "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-transparent",
  Closed: "bg-muted text-muted-foreground border-transparent",
  Awarded:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent",
  // Vendor statuses
  Active:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent",
  "Under Review":
    "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-transparent",
  Inactive: "bg-muted text-muted-foreground border-transparent",
  // PO statuses
  Issued: "bg-primary/15 text-primary border-transparent",
  Acknowledged:
    "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-transparent",
  Delivered:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent",
  Cancelled: "bg-destructive/15 text-destructive border-transparent",
  // Risk levels
  Low: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent",
  Medium: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-transparent",
  High: "bg-destructive/15 text-destructive border-transparent",
}

export function StatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", statusStyles[status], className)}
    >
      {status}
    </Badge>
  )
}
