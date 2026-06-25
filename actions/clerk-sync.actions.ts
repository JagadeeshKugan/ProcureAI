"use server"

import { auth, currentUser } from "@clerk/nextjs/server"
import { ClerkSyncService } from "@/services/clerk-sync.service"

const syncService = new ClerkSyncService()

/**
 * Server action to sync the current authenticated Clerk user and organization
 * This should be called once during user authentication flow
 * Stores organizationId and userRole in the database on successful login
 */
export async function syncClerkUserToDatabase() {
  try {
    // Get authenticated user and organization from Clerk
    const authSession = await auth()
    const clerkUser = await currentUser()

    if (!authSession.userId) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    // Get user details from Clerk
    const clerkUserId = authSession.userId
    const email = clerkUser?.emailAddresses[0]?.emailAddress
    const firstName = clerkUser?.firstName ?? ''
    const lastName = clerkUser?.lastName ?? ''

    console.log("[clerkuser]", clerkUser, authSession)
    // Get organization if available
    const clerkOrgId = authSession.orgId
    const orgName = authSession.orgSlug || "Default Organization"
    const orgRole = authSession.orgRole as string | undefined

    if (!email) {
      return {
        success: false,
        error: "Email not found in Clerk session",
      }
    }

    console.log("[syncClerkUserToDatabase] Syncing user with org context", {
      clerkUserId,
      email,
      clerkOrgId,
      orgRole,
    })

    // Sync user and organization
    const result = await syncService.syncUserAndOrganization({
      clerkUserId,
      email,
      firstName,
      lastName,
      clerkOrgId: clerkOrgId || undefined,
      orgName: clerkOrgId ? orgName : undefined,
      orgRole: orgRole || undefined,
    })

    console.log("[syncClerkUserToDatabase] Sync result:", {
      success: result.success,
      hasUser: !!result.data?.user,
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
