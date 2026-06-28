import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { PageHeader } from "@/components/page-header"
import { RequestStats } from "@/components/requestor/request-stats"
import { PurchaseRequestService } from "@/services/purchase-request.service"
import { DepartmentRequestorClient } from "@/components/requestor/client"
import { UserRepository } from "@/repositories/user.repository"

export const metadata = {
  title: "My Purchase Requests - ProcureAI",
  description: "Create and track your procurement requests",
}

export const dynamic = "force-dynamic"

export default async function DepartmentRequestorPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  // Get user organization
  const userRepo = new UserRepository()
  const user = await userRepo.findByClerkId(userId)
  
  if (!user || !user.organizationId) {
    redirect("/")
  }

  const service = new PurchaseRequestService()
  const requests = await service.getRequestsWithAudit(userId)
  const stats = await service.getRequestStatusCounts(userId, "engineering")

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="My Purchase Requests"
        description="Create and track your procurement requests"
      />

      <RequestStats
        pending={stats.pending}
        approved={stats.approved}
        rejected={stats.rejected}
        converted={stats.converted}
      />

      <DepartmentRequestorClient 
        initialRequests={requests} 
        userId={user.id || userId} 
        organizationId={user.organizationId}
      />
    </div>
  )
}
