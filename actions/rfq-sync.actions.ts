"use server"

import { auth } from "@clerk/nextjs/server"
import { ProcurementService } from "@/services/procurement.service"
import { UserRepository } from "@/repositories/user.repository"

/**
 * Synchronize RFQ status when purchase request status changes
 * This is called from various procurement actions when PR status is updated
 */
export async function syncRFQStatusOnPRStatusChange(
  requestId: string,
  newPRStatus: string,
  organizationId: string
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      console.warn(
        "[syncRFQStatusOnPRStatusChange] Not authenticated - skipping RFQ sync"
      )
      return { success: false, error: "Not authenticated" }
    }

    // Get current user for audit logging
    const userRepo = new UserRepository()
    const user = await userRepo.findByClerkId(userId)

    if (!user) {
      console.warn(
        "[syncRFQStatusOnPRStatusChange] User not found - skipping RFQ sync"
      )
      return { success: false, error: "User not found" }
    }

    // Call procurement service to sync RFQ status
    const procurementService = new ProcurementService()
    await procurementService.syncRFQStatusWithPurchaseRequest(
      requestId,
      newPRStatus,
      organizationId,
      user.id
    )

    return { success: true }
  } catch (error) {
    console.error("[syncRFQStatusOnPRStatusChange] Error:", error)
    // Don't throw - sync is a secondary operation
    return { success: false }
  }
}
