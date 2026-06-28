"use server"

import { auth } from "@clerk/nextjs/server"
import { getDb, schema } from "@/db"
import { eq } from "drizzle-orm"

export async function getUserProfile() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const db = getDb()

    // Fetch user from database using clerkId
    const result = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.clerkId, userId))
      .limit(1)

    if (!result.length) {
      return {
        success: false,
        error: "User not found",
        data: {
          name: "Guest User",
          role: "unknown",
          email: "",
        },
      }
    }

    const user = result[0]

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
        email: user.email,
        role: user.role || "requester",
        department: user.department,
        status: user.status,
        createdAt: user.createdAt,
      },
    }
  } catch (error) {
    console.error("[getUserProfile] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch user profile",
    }
  }
}
