import { Suspense } from "react"
import { Plus, Filter } from "lucide-react"
import Link from "next/link"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { WorkQueueStats } from "@/components/procurement/work-queue-stats"
import { WorkQueue } from "@/components/procurement/work-queue"
import { RFQManagement } from "@/components/procurement/rfq-management"
import { ProcurementActivityFeed } from "@/components/procurement/activity-feed"

// Mock data - replace with actual server component data fetching
const mockWorkQueueStats = {
  pendingRequests: 12,
  rfqsRequiringAction: 5,
  completedThisWeek: 8,
  avgProcessingTime: 4,
}

const mockWorkItems = [
  {
    id: "1",
    title: "Office Supplies Purchase Request",
    type: "request" as const,
    status: "pending_approval",
    department: "Operations",
    priority: "medium",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "IT Equipment RFQ",
    type: "rfq" as const,
    status: "responses_received",
    department: "IT Infrastructure",
    priority: "high",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    title: "Manufacturing Parts Procurement",
    type: "request" as const,
    status: "pending_approval",
    department: "Manufacturing",
    priority: "critical",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

const mockRFQs = [
  {
    id: "1",
    rfqNumber: "RFQ-2026-0001",
    title: "Laptop Procurement - Q2 2026",
    status: "sent",
    totalResponses: 3,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    rfqNumber: "RFQ-2026-0002",
    title: "Office Furniture Replacement",
    status: "draft",
    totalResponses: 0,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

const mockActivities = [
  {
    id: "1",
    action: "created",
    entity: "Purchase Request PR-2026-0001",
    entityType: "request" as const,
    timestamp: new Date().toISOString(),
    user: "You",
    details: "New office supplies request submitted",
  },
  {
    id: "2",
    action: "sent",
    entity: "RFQ-2026-0001",
    entityType: "rfq" as const,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user: "You",
    details: "RFQ sent to 5 vendors for laptop procurement",
  },
  {
    id: "3",
    action: "received",
    entity: "Quote from TechCorp",
    entityType: "quote" as const,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    user: "TechCorp",
    details: "Quote received for RFQ-2026-0001",
  },
]

export default function ProcurementOfficerDashboard() {
  return (
    <>
      <PageHeader
        title="Procurement Officer Dashboard"
        description="Manage purchase requests, RFQs, and vendor quotes"
      >
        <Link href="/procurement/requests/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </Link>
      </PageHeader>

      {/* Work Queue Stats */}
      <Suspense fallback={<WorkQueueStats stats={mockWorkQueueStats} isLoading />}>
        <WorkQueueStats stats={mockWorkQueueStats} />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Work Queue - Full Width */}
        <div className="lg:col-span-2">
          <Suspense fallback={<WorkQueue items={mockWorkItems} isLoading />}>
            <WorkQueue items={mockWorkItems} />
          </Suspense>
        </div>

        {/* Activity Feed - Sidebar */}
        <div>
          <Suspense fallback={<ProcurementActivityFeed activities={mockActivities} isLoading />}>
            <ProcurementActivityFeed activities={mockActivities} />
          </Suspense>
        </div>
      </div>

      {/* RFQ Management - Full Width */}
      <Suspense fallback={<RFQManagement rfqs={mockRFQs} isLoading />}>
        <RFQManagement rfqs={mockRFQs} />
      </Suspense>
    </>
  )
}
