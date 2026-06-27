"use server"

import { auth } from "@clerk/nextjs/server"
import { getDb, schema } from "@/db"
import { eq, and } from "drizzle-orm"
import { AuditLogRepository } from "@/repositories/audit-log.repository"

/**
 * Get RFQs assigned to the current vendor
 * Vendor users can only see RFQs where they are in the rfq_vendors table
 */
export async function getVendorRFQs() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const db = getDb()

    // Get the database user ID from Clerk ID
    const user = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.clerkId, userId))
      .limit(1)

    if (!user.length) {
      return { success: false, error: "User not found" }
    }

    const vendorId = user[0].id

    // Get RFQs assigned to this vendor
    // Query: Join rfqs with rfq_vendors where vendorId matches current user
    const rfqs = await db
      .select({
        id: schema.rfqs.id,
        rfqNumber: schema.rfqs.rfqNumber,
        title: schema.rfqs.title,
        description: schema.rfqs.description,
        status: schema.rfqs.status,
        createdAt: schema.rfqs.createdAt,
        // We'll get these from the request if available
        // For now, we just show RFQ info
      })
      .from(schema.rfqs)
      .innerJoin(
        schema.rfqVendors,
        and(
          eq(schema.rfqVendors.rfqId, schema.rfqs.id),
          eq(schema.rfqVendors.vendorId, vendorId)
        )
      )
      .orderBy(schema.rfqs.createdAt)

    console.log("[getVendorRFQs] Found RFQs:", { count: rfqs.length })

    return { success: true, data: rfqs }
  } catch (error) {
    console.error("[getVendorRFQs] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch RFQs",
    }
  }
}

/**
 * Get RFQ details by ID
 * Vendor can only access RFQs they are assigned to
 */
export async function getVendorRFQDetail(rfqId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const db = getDb()

    // Get the database user ID from Clerk ID
    const user = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.clerkId, userId))
      .limit(1)

    if (!user.length) {
      return { success: false, error: "User not found" }
    }

    const vendorId = user[0].id

    // Get RFQ details - must verify vendor has access
    const rfqVendor = await db
      .select()
      .from(schema.rfqVendors)
      .where(
        and(
          eq(schema.rfqVendors.rfqId, rfqId),
          eq(schema.rfqVendors.vendorId, vendorId)
        )
      )
      .limit(1)

    if (!rfqVendor.length) {
      return { success: false, error: "RFQ not found or access denied" }
    }

    const rfq = await db
      .select()
      .from(schema.rfqs)
      .where(eq(schema.rfqs.id, rfqId))
      .limit(1)

    if (!rfq.length) {
      return { success: false, error: "RFQ not found" }
    }

    console.log("[getVendorRFQDetail] Retrieved RFQ:", { rfqId })

    return { success: true, data: rfq[0] }
  } catch (error) {
    console.error("[getVendorRFQDetail] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch RFQ",
    }
  }
}

/**
 * Submit a quotation for an RFQ
 * Creates quotation record and updates rfq_vendors status
 */
export async function submitQuotation(
  rfqId: string,
  price: string,
  deliveryDays: number,
  warranty?: string,
  notes?: string
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const db = getDb()

    // Get the database user ID from Clerk ID
    const user = await db
      .select({ id: schema.users.id, organizationId: schema.users.organizationId })
      .from(schema.users)
      .where(eq(schema.users.clerkId, userId))
      .limit(1)

    if (!user.length) {
      return { success: false, error: "User not found" }
    }

    const vendorId = user[0].id

    // Verify vendor has access to this RFQ
    const rfqVendor = await db
      .select()
      .from(schema.rfqVendors)
      .where(
        and(
          eq(schema.rfqVendors.rfqId, rfqId),
          eq(schema.rfqVendors.vendorId, vendorId)
        )
      )
      .limit(1)

    if (!rfqVendor.length) {
      return { success: false, error: "RFQ not found or access denied" }
    }

    // Create quotation record
    const quotation = await db
      .insert(schema.quotations)
      .values({
        rfqId,
        vendorId,
        price: price,
        deliveryDays,
        warranty: warranty || null,
        notes: notes || null,
      })
      .returning()

    // Update rfq_vendors status
    await db
      .update(schema.rfqVendors)
      .set({
        status: "quote_received",
      })
      .where(
        and(
          eq(schema.rfqVendors.rfqId, rfqId),
          eq(schema.rfqVendors.vendorId, vendorId)
        )
      )

    // Create audit log
    const auditRepo = new AuditLogRepository()
    // Note: For vendor users, organizationId may be null since they don't belong to the org
    // Audit logs may need special handling for vendor users
    if (user[0].organizationId) {
      await auditRepo.create({
        organizationId: user[0].organizationId,
        action: "QUOTATION_RECEIVED",
        entityType: "quotation",
        entityId: quotation[0].id,
        performedBy: vendorId,
        metadata: {
          rfqId,
          price,
          deliveryDays,
        },
      })
    }

    console.log("[submitQuotation] Quotation submitted:", {
      quotationId: quotation[0].id,
      rfqId,
    })

    return { success: true, data: quotation[0] }
  } catch (error) {
    console.error("[submitQuotation] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit quotation",
    }
  }
}

/**
 * Get vendor's quotations
 * Vendor can only see their own quotations
 */
export async function getVendorQuotations() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const db = getDb()

    // Get the database user ID from Clerk ID
    const user = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.clerkId, userId))
      .limit(1)

    if (!user.length) {
      return { success: false, error: "User not found" }
    }

    const vendorId = user[0].id

    // Get quotations submitted by this vendor
    const quotations = await db
      .select({
        id: schema.quotations.id,
        rfqId: schema.quotations.rfqId,
        price: schema.quotations.price,
        deliveryDays: schema.quotations.deliveryDays,
        warranty: schema.quotations.warranty,
        status: schema.quotations.status,
        submittedAt: schema.quotations.submittedAt,
        rfqNumber: schema.rfqs.rfqNumber,
        rfqTitle: schema.rfqs.title,
      })
      .from(schema.quotations)
      .innerJoin(schema.rfqs, eq(schema.quotations.rfqId, schema.rfqs.id))
      .where(eq(schema.quotations.vendorId, vendorId))
      .orderBy(schema.quotations.submittedAt)

    console.log("[getVendorQuotations] Found quotations:", { count: quotations.length })

    return { success: true, data: quotations }
  } catch (error) {
    console.error("[getVendorQuotations] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch quotations",
    }
  }
}
