"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
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

    // Prepare user data from Clerk
    const userData = {
      clerkId: userId,
      email: user.emailAddresses[0]?.emailAddress || "",
      name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || "",
      imageUrl: user.imageUrl || null,
      // Extract role from Clerk unsafeMetadata (accessible in client and server actions)
      role: (user.unsafeMetadata?.role as string) || "buyer",
      company: (user.unsafeMetadata?.company as string) || null,
      companyId: (user.unsafeMetadata?.companyId as string) || null,
      status: "active",
      metadata: {
        clerkMetadata: user.publicMetadata,
        lastSyncedAt: new Date().toISOString(),
      },
    };

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (existingUser.length > 0) {
      // Update existing user
      const result = await db
        .update(users)
        .set({
          email: userData.email,
          name: userData.name,
          imageUrl: userData.imageUrl,
          role: userData.role,
          company: userData.company,
          companyId: userData.companyId,
          status: userData.status,
          metadata: userData.metadata,
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, userId))
        .returning();

      console.log("[Auth] User updated:", result[0]?.email);
      return result[0] || null;
    } else {
      // Create new user
      const result = await db.insert(users).values(userData).returning();

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

    const dbUser = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    return dbUser[0] || null;
  } catch (error) {
    console.error("[Auth] Failed to get current user:", error);
    return null;
  }
}

