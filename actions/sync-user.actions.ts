"use server"

import { auth, currentUser } from "@clerk/nextjs/server"
import { UserRepository } from "@/repositories/user.repository"

export async function syncCurrentUser(organizationId?: string, orgRole?: string) {
  try {
    const { userId } = await auth()
    const clerkUser = await currentUser()

    if (!userId || !clerkUser) {
      return {
        success: false,
        error: "Not authenticated",
        user: null,
      }
    }

    const userRepo = new UserRepository()

    // Try to find existing user by clerkId
    let appUser = await userRepo.findByClerkId(userId)

    // Map Clerk organization role to app role
    const mapRoleToAppRole = (role: string): string => {
      const roleMap: { [key: string]: string } = {
        "org:admin": "admin",
        "org:member": "requester",
        "org:manager": "procurement_manager",
      }
      return roleMap[role] || "requester"
    }

    const appRole = orgRole ? mapRoleToAppRole(orgRole) : "requester"

    if (!appUser) {
      // Create new user record with organization context
      appUser = await userRepo.create({
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
        name:
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
          clerkUser.emailAddresses[0]?.emailAddress ||
          "",
        role: appRole,
        organizationId: organizationId || null,
        status: "active",
        department: null,
      })
    } else if (organizationId || orgRole) {
      // Update existing user with organization context if provided
      appUser = await userRepo.update(appUser.id, {
        organizationId: organizationId || appUser.organizationId,
        role: orgRole ? appRole : appUser.role,
      })
    }

    return {
      success: true,
      user: appUser,
      isNewUser: !appUser,
    }
  } catch (error) {
    console.error("[syncCurrentUser] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync user",
      user: null,
    }
  }
}
