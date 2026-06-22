"use server"

import { auth, currentUser } from "@clerk/nextjs/server"
import { UserRepository } from "@/repositories/user.repository"

export async function syncCurrentUser() {
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

    if (!appUser) {
      // Create new user record
      appUser = await userRepo.create({
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
        name:
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
          clerkUser.emailAddresses[0]?.emailAddress ||
          "",
        role: "requester",
        status: "pending",
        department: null,
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
