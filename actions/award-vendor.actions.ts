"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { getDb, schema } from "@/db"
import { eq, and } from "drizzle-orm"
import { UserRepository } from "@/repositories/user.repository"
import { AuditLogRepository } from "@/repositories/audit-log.repository"

/**
 * Award vendor and create purchase order
 */
export async function awardVendor(rfqId: string, vendorId: string) {
  try {
    const { userId, orgRole } = await auth()

    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    // Check authorization
    if (!orgRole || !["org:admin", "org:procurement_manager"].includes(orgRole)) {
      return { success: false, error: "Unauthorized: Only admins and procurement managers can award vendors" }
    }

    const db = getDb()
    const userRepo = new UserRepository()
    const auditRepo = new AuditLogRepository()

    // Get current user
    const currentUser = await userRepo.findByClerkId(userId)
    if (!currentUser) {
      return { success: false, error: "User not found" }
    }

    // Get RFQ details
    const rfq = await db
      .select()
      .from(schema.rfqs)
      .where(eq(schema.rfqs.id, rfqId))
      .limit(1)

    if (!rfq.length) {
      return { success: false, error: "RFQ not found" }
    }

    const rfqData = rfq[0]

    // Check if RFQ is already awarded or closed
    if (rfqData.status === "awarded" || rfqData.status === "closed") {
      return { success: false, error: `Cannot award vendor: RFQ status is ${rfqData.status}` }
    }

    // Get selected quotation
    const selectedQuotation = await db
      .select()
      .from(schema.quotations)
      .where(and(
        eq(schema.quotations.rfqId, rfqId),
        eq(schema.quotations.vendorId, vendorId)
      ))
      .limit(1)

    if (!selectedQuotation.length) {
      return { success: false, error: "Quotation not found" }
    }

    const quotation = selectedQuotation[0]
    const quotationPrice = parseFloat(quotation.price.toString())

    // Get vendor details
    const vendor = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, vendorId))
      .limit(1)

    if (!vendor.length) {
      return { success: false, error: "Vendor not found" }
    }

    // Update RFQ status to awarded
    await db
      .update(schema.rfqs)
      .set({
        status: "awarded",
        selectedVendorId: vendorId,
        updatedAt: new Date(),
      })
      .where(eq(schema.rfqs.id, rfqId))

    // Update selected quotation to accepted
    await db
      .update(schema.quotations)
      .set({
        status: "accepted",
      })
      .where(and(
        eq(schema.quotations.rfqId, rfqId),
        eq(schema.quotations.vendorId, vendorId)
      ))

    // Update all other quotations to rejected
    await db
      .update(schema.quotations)
      .set({
        status: "rejected",
      })
      .where(and(
        eq(schema.quotations.rfqId, rfqId),
        eq(schema.quotations.status, "submitted")
      ))

    // Generate PO number
    const poCount = await db
      .select()
      .from(schema.purchaseOrders)

    const poNumber = `PO-${new Date().getFullYear()}-${String(poCount.length + 1).padStart(4, "0")}`

    // Calculate expected delivery date
    const expectedDelivery = quotation.deliveryDays
      ? new Date(Date.now() + quotation.deliveryDays * 24 * 60 * 60 * 1000)
      : null

    // Create purchase order
    const po = await db
      .insert(schema.purchaseOrders)
      .values({
        organizationId: rfqData.organizationId,
        requestId: rfqData.purchaseRequestId || "",
        vendorId: vendorId,
        poNumber: poNumber,
        totalAmount: quotationPrice.toString(),
        status: "DRAFT",
        expectedDelivery: expectedDelivery,
        createdBy: currentUser.id,
      })
      .returning()

    if (!po.length) {
      return { success: false, error: "Failed to create purchase order" }
    }

    // Get RFQ items and create PO items
    const rfqItems = await db
      .select()
      .from(schema.rfqItems)
      .where(eq(schema.rfqItems.rfqId, rfqId))
      .orderBy(schema.rfqItems.lineNumber)

    if (rfqItems.length > 0) {
      const poItemsToInsert = rfqItems.map((item) => {
        const quantity = parseFloat(item.quantity.toString())
        const unitPrice = parseFloat(quotation.price.toString()) / rfqItems.length // Distribute total price across items
        const totalPrice = quantity * unitPrice

        return {
          purchaseOrderId: po[0].id,
          lineNumber: item.lineNumber,
          itemName: item.itemName,
          description: item.specifications || null,
          quantity: item.quantity.toString(),
          unitPrice: unitPrice.toString(),
          totalPrice: totalPrice.toString(),
        }
      })

      await db
        .insert(schema.purchaseOrderItems)
        .values(poItemsToInsert)
    }

    // Create audit log
    await auditRepo.create({
      organizationId: rfqData.organizationId,
      entityType: "rfq",
      entityId: rfqId,
      action: "VENDOR_AWARDED",
      performedBy: currentUser.id,
      metadata: {
        rfqNumber: rfqData.rfqNumber,
        vendorId: vendorId,
        vendorName: vendor[0].name,
        poNumber: poNumber,
        quotationPrice: quotationPrice,
        deliveryDays: quotation.deliveryDays,
        warranty: quotation.warranty,
      },
    })

    // Create notification for vendor
    const adminUsers = await db
      .select()
      .from(schema.users)
      .where(and(
        eq(schema.users.organizationId, rfqData.organizationId),
        eq(schema.users.role, "procurement_manager")
      ))

    for (const admin of adminUsers) {
      await db
        .insert(schema.notifications)
        .values({
          userId: admin.id,
          type: "po_created",
          title: "Purchase Order Created",
          message: `Purchase Order ${poNumber} created for RFQ ${rfqData.rfqNumber} with ${vendor[0].name}`,
          relatedEntityType: "purchase_order",
          relatedEntityId: po[0].id,
          actionUrl: `/purchase-orders/${po[0].id}`,
        })
    }

    // Revalidate paths
    revalidatePath(`/rfq/${rfqId}`)
    revalidatePath("/purchase-orders")
    revalidatePath("/procurement/dashboard")

    return {
      success: true,
      message: "Vendor awarded successfully and Purchase Order created",
      data: {
        rfqId,
        poId: po[0].id,
        poNumber,
      },
    }
  } catch (error) {
    console.error("[awardVendor] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to award vendor",
    }
  }
}
