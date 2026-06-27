"use server"

import { auth } from "@clerk/nextjs/server"
import { getDb, schema } from "@/db"
import { eq } from "drizzle-orm"

/**
 * Fetch all vendors (users with role='vendor') from database
 */
export async function getAllVendors() {
  try {
    const { userId, orgId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const db = getDb()

    // Get all vendors with their organization info
    const vendors = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        companyName: schema.users.companyName,
        status: schema.users.status,
        createdAt: schema.users.createdAt,
        organizationId: schema.users.organizationId,
        organizationName: schema.organizations.name,
      })
      .from(schema.users)
      .leftJoin(
        schema.organizations,
        eq(schema.users.organizationId, schema.organizations.id)
      )
      .where(eq(schema.users.role, "vendor"))

    return { success: true, data: vendors }
  } catch (error) {
    console.error("[getAllVendors] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch vendors",
    }
  }
}

/**
 * Create a new vendor in database
 * Note: For full Clerk integration, you would also create a Clerk user here
 */
export async function createVendor(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  organizationName: string,
  organizationId?: string
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    // Validate input
    if (!email || !password || !firstName || !lastName || !organizationName) {
      return { success: false, error: "All fields are required" }
    }

    const db = getDb()

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1)

    if (existingUser.length > 0) {
      return { success: false, error: "Email already exists" }
    }

    // Get or create organization for vendor
    let vendorOrgId = organizationId
    if (!vendorOrgId) {
      // If no organization specified, create one
      const newOrg = await db
        .insert(schema.organizations)
        .values({
          name: organizationName,
          clerkOrgId: `vendor-${Date.now()}`, // Generate a unique clerk org ID
        })
        .returning()

      vendorOrgId = newOrg[0].id
    }

    // Generate a temporary clerk ID (in production, create in Clerk first)
    const tempClerkId = `vendor_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Create user in database
    const dbUser = await db
      .insert(schema.users)
      .values({
        clerkId: tempClerkId,
        email: email,
        firstName: firstName,
        lastName: lastName,
        name: `${firstName} ${lastName}`,
        organizationId: vendorOrgId,
        companyName: organizationName,
        role: "vendor",
        status: "active",
      })
      .returning()

    console.log("[createVendor] Vendor created:", { email, vendorOrgId })

    return { success: true, data: dbUser[0] }
  } catch (error) {
    console.error("[createVendor] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create vendor",
    }
  }
}
