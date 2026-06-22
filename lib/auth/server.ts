"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";

/**
 * Sync user from Clerk to PostgreSQL database
 * Called after Clerk authentication
 * Idempotent - updates existing user or creates new one
 */
export async function syncUserToDatabase() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      throw new Error("User not authenticated");
    }

    const db = getDb();

    // Prepare user data from Clerk
    const userData = {
      clerkId: userId,
      email: user.emailAddresses[0]?.emailAddress || "",
      name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || "",
      // Role will be synced from orgRole which includes: org:approver, admin, buyer, requester, procurement_manager
      role: "requester", // Default role, will be updated via useAuth().orgRole in components
    };

    // Check if user exists
    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.clerkId, userId))
      .limit(1);

    if (existingUser.length > 0) {
      // Update existing user
      const result = await db
        .update(schema.users)
        .set({
          email: userData.email,
          name: userData.name,
          role: userData.role,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.clerkId, userId))
        .returning();

      console.log("[Auth] User updated:", result[0]?.email);
      return result[0] || null;
    } else {
      // Create new user
      const result = await db.insert(schema.users).values(userData).returning();

      console.log("[Auth] New user created:", result[0]?.email);
      return result[0] || null;
    }
  } catch (error) {
    console.error("[Auth] Failed to sync user:", error);
    throw error;
  }
}

/**
 * Get current user from database with Clerk context
 */
export async function getCurrentUser() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    const db = getDb();
    const dbUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.clerkId, userId))
      .limit(1);

    return dbUser[0] || null;
  } catch (error) {
    console.error("[Auth] Failed to get current user:", error);
    return null;
  }
}

