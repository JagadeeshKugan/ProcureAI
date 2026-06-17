"use server"

import { auth } from "@clerk/nextjs/server"
import { PurchaseRequestService } from "@/services/purchase-request.service"
import { UserService } from "@/services/user.service"
import {
  createPurchaseRequestSchema,
  type CreatePurchaseRequestInput,
} from "@/lib/validations"

export async function createPurchaseRequest(input: CreatePurchaseRequestInput) {
  try {
    // Get current user from Clerk
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return {
        success: false,
        error: "Not authenticated",
      }
    }

    // Validate input
    const validatedInput = createPurchaseRequestSchema.parse(input)

    // Ensure the requestedBy matches current user
    const clerkId = sessionClaims?.sub as string
    const userService = new UserService()
    const user = await userService.getUserByClerkId(clerkId)

    if (!user) {
      return {
        success: false,
        error: "User not found in database. Please sign out and sign in again.",
      }
    }

    // Override requestedBy with current user
    validatedInput.requestedBy = user.id

    // Create purchase request
    const prService = new PurchaseRequestService()
    const result = await prService.createPurchaseRequest(validatedInput)

    return result
  } catch (error) {
    console.error("[createPurchaseRequest] Error:", error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}

export async function syncUserFromClerk() {
  try {
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return {
        success: false,
        error: "Not authenticated",
      }
    }

    const userService = new UserService()

    const result = await userService.syncUserFromClerk({
      clerkId: sessionClaims?.sub as string,
      email: sessionClaims?.email as string,
      firstName: sessionClaims?.firstName as string | undefined,
      lastName: sessionClaims?.lastName as string | undefined,
      publicMetadata: (sessionClaims?.publicMetadata as Record<string, any>) || {},
    })

    return result
  } catch (error) {
    console.error("[syncUserFromClerk] Error:", error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}
