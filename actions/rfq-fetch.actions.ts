"use server"

import { auth } from "@clerk/nextjs/server"
import { getDb, schema } from "@/db"
import { eq, desc } from "drizzle-orm"
import { UserRepository } from "@/repositories/user.repository"

/**
 * Get all RFQs for the current organization
 */
export async function getRFQsForOrganization() {
  try {
    const { userId, orgId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const userRepo = new UserRepository()
    const user = await userRepo.findByClerkId(userId)
    
    if (!user?.organizationId) {
      return { success: false, error: "User organization not found" }
    }

    const db = getDb()

    // Get all RFQs for the organization with vendor and quotation stats
    const rfqs = await db
      .select({
        id: schema.rfqs.id,
        rfqNumber: schema.rfqs.rfqNumber,
        title: schema.rfqs.title,
        description: schema.rfqs.description,
        status: schema.rfqs.status,
        dueDate: schema.rfqs.dueDate,
        expectedDeliveryDate: schema.rfqs.expectedDeliveryDate,
        createdAt: schema.rfqs.createdAt,
        publishedAt: schema.rfqs.publishedAt,
      })
      .from(schema.rfqs)
      .where(eq(schema.rfqs.organizationId, user.organizationId))
      .orderBy(desc(schema.rfqs.createdAt))

    // Get vendor count for each RFQ
    const rfqsWithStats = await Promise.all(
      rfqs.map(async (rfq) => {
        const vendors = await db
          .select()
          .from(schema.rfqVendors)
          .where(eq(schema.rfqVendors.rfqId, rfq.id))

        const quotations = await db
          .select()
          .from(schema.quotations)
          .where(eq(schema.quotations.rfqId, rfq.id))

        return {
          ...rfq,
          vendorsInvited: vendors.length,
          vendorsResponded: quotations.length,
          estimatedValue: 0, // Can be calculated from RFQ items or quotations
        }
      })
    )

    return { success: true, data: rfqsWithStats }
  } catch (error) {
    console.error("[getRFQsForOrganization] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch RFQs",
    }
  }
}

/**
 * Get single RFQ with quotation comparison data
 */
export async function getRFQWithQuotations(rfqId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const userRepo = new UserRepository()
    const user = await userRepo.findByClerkId(userId)
    
    if (!user?.organizationId) {
      return { success: false, error: "User organization not found" }
    }

    const db = getDb()

    // Get RFQ
    const rfq = await db
      .select()
      .from(schema.rfqs)
      .where(eq(schema.rfqs.id, rfqId))
      .limit(1)

    if (!rfq.length) {
      return { success: false, error: "RFQ not found" }
    }

    // Verify organization access
    if (rfq[0].organizationId !== user.organizationId) {
      return { success: false, error: "Access denied" }
    }

    // Get quotations with vendor details
    const quotations = await db
      .select({
        id: schema.quotations.id,
        vendorId: schema.quotations.vendorId,
        vendorName: schema.users.name,
        vendorEmail: schema.users.email,
        price: schema.quotations.price,
        deliveryDays: schema.quotations.deliveryDays,
        warranty: schema.quotations.warranty,
        notes: schema.quotations.notes,
        status: schema.quotations.status,
        submittedAt: schema.quotations.submittedAt,
      })
      .from(schema.quotations)
      .innerJoin(schema.users, eq(schema.quotations.vendorId, schema.users.id))
      .where(eq(schema.quotations.rfqId, rfqId))
      .orderBy(desc(schema.quotations.submittedAt))

    // Get RFQ items
    const items = await db
      .select()
      .from(schema.rfqItems)
      .where(eq(schema.rfqItems.rfqId, rfqId))
      .orderBy(schema.rfqItems.lineNumber)

    return {
      success: true,
      data: {
        rfq: rfq[0],
        quotations,
        items,
      },
    }
  } catch (error) {
    console.error("[getRFQWithQuotations] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch RFQ details",
    }
  }
}
