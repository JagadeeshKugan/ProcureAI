"use server"

import { auth } from "@clerk/nextjs/server"
import { ClerkSyncService } from "@/services/clerk-sync.service"

const syncService = new ClerkSyncService()

/**
 * Server action to sync the current authenticated Clerk user and organization
 * This should be called once during user authentication flow
 */
export async function syncClerkUserToDatabase() {
  try {
    // Get authenticated user and organization from Clerk
    const authSession = await auth()

    if (!authSession.userId) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    // Get user details from Clerk session
    const user = authSession
    const clerkUserId = authSession.userId
    const email = user.sessionClaims?.email as string
    const firstName = user.sessionClaims?.given_name as string | undefined
    const lastName = user.sessionClaims?.family_name as string | undefined

    // Get organization if available
    const clerkOrgId = authSession.orgId
    const orgName = authSession.orgSlug || "Default Organization"

    if (!email) {
      return {
        success: false,
        error: "Email not found in Clerk session",
      }
    }

    // Sync user and organization
    const result = await syncService.syncUserAndOrganization({
      clerkUserId,
      email,
      firstName,
      lastName,
      clerkOrgId: clerkOrgId || undefined,
      orgName: clerkOrgId ? orgName : undefined,
    })

    return result
  } catch (error) {
    console.error("[Clerk Sync Action] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync user",
    }
  }
}

/**
 * Server action to get the synced user and organization data
 */
export async function getSyncedUserData() {
  try {
    const authSession = await auth()

    if (!authSession.userId) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    const user = await syncService.getUserByClerkId(authSession.userId)

    if (!user) {
      return {
        success: false,
        error: "User not found in database",
      }
    }

    let organization = null
    if (user.organizationId) {
      const org = await syncService.getOrganizationByClerkId(
        authSession.orgId || ""
      )
      organization = org
    }

    return {
      success: true,
      data: {
        user,
        organization,
      },
    }
  } catch (error) {
    console.error("[Get Synced User Action] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch user data",
    }
  }
}
