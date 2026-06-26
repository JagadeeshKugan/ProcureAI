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
    const authSession = await auth();
    const { userId, orgId, orgRole } = authSession;
    const user = await currentUser();
    if (!userId || !user) {
      throw new Error("User not authenticated");
    }

    const db = getDb();
    const mapRoleToAppRole = (role?: string | null): string => {
      const roleMap: { [key: string]: string } = {
        "org:admin": "admin",
        "org:requester": "requester",
        "org:procurement_manager": "procurement_manager",
        "org:approver": "approver"
      }
      return roleMap[role!] || "member"
    }

    // Look up organization by clerkOrgId if orgId exists
    let dbOrgId: string | null = null;
    if (orgId) {
      const existingOrg = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.clerkOrgId, orgId))
        .limit(1);

      if (existingOrg.length > 0) {
        dbOrgId = existingOrg[0].id;
        console.log("[Auth] Found organization in database:", {
          clerkOrgId: orgId,
          dbOrgId: dbOrgId,
        });
      } else {
        console.log("[Auth] Organization not found in database for clerkOrgId:", orgId);
      }
    }

    // Prepare user data from Clerk
    const userData = {
      clerkId: userId,
      email: user.emailAddresses[0]?.emailAddress || "",
      name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || "",
      organizationId: dbOrgId,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      role: mapRoleToAppRole(orgRole),
      status: "active",
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
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          organizationId: userData.organizationId,
          status: userData.status,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.clerkId, userId))
        .returning();

      console.log("[Auth] User updated:", {
        email: result[0]?.email,
        name: result[0]?.name,
        role: result[0]?.role,
        organizationId: result[0]?.organizationId,
        status: result[0]?.status,
      });
      return result[0] || null;
    } else {
      // Create new user
      const result = await db.insert(schema.users).values(userData).returning();

      console.log("[Auth] New user created:", {
        email: result[0]?.email,
        name: result[0]?.name,
        role: result[0]?.role,
        organizationId: result[0]?.organizationId,
        status: result[0]?.status,
      });
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

