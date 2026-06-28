"use server"

import { auth } from "@clerk/nextjs/server"
import { DashboardService } from "@/services/dashboard.service"
import { getOrganizationIdFromClerk } from "@/actions/request-detail.actions"
import { OrganizationRepository } from "@/repositories/organization.repository"

export async function getDashboardMetrics() {
  try {
    const { orgId } = await auth()

    if (!orgId) {
      return {
        success: false,
        error: "No organization found",
        data: null,
      }
    }
    const orgRepo = new OrganizationRepository();
    const org = await orgRepo.findByClerkOrgId(orgId);
    const orgUid =  org.id!;
    const dashboardService = new DashboardService()
    const metrics = await dashboardService.getOrganizationMetrics(orgUid)

    return {
      success: true,
      error: null,
      data: metrics,
    }
  } catch (error) {
    console.error("[getDashboardMetrics] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch dashboard metrics",
      data: null,
    }
  }
}
