"use server"

import { auth } from "@clerk/nextjs/server"
import { getDb, schema } from "@/db"
import { eq, and } from "drizzle-orm"
import { z } from "zod"
import { UserRepository } from "@/repositories/user.repository"

// Generate PO number in format: PO-YYYY-0001
async function generatePONumber(organizationId: string): Promise<string> {
  const db = getDb()
  const year = new Date().getFullYear()
  const {userId} = await auth();
  const userRepo = new UserRepository()
  const appUser = await userRepo.findByClerkId(userId!)
  const organizationUId = appUser.organizationId;
  const lastPO = await db
    .select({ poNumber: schema.purchaseOrders.poNumber })
    .from(schema.purchaseOrders)
    .where(
      and(
        eq(schema.purchaseOrders.organizationId, organizationUId!),
        eq(schema.purchaseOrders.status, "DRAFT")
      )
    )
    .orderBy(schema.purchaseOrders.createdAt)
    .limit(1)

  let sequence = 1
  if (lastPO.length > 0) {
    const match = lastPO[0].poNumber.match(/PO-\d+-(\d+)/)
    if (match) {
      sequence = parseInt(match[1]) + 1
    }
  }

  return `PO-${year}-${String(sequence).padStart(4, "0")}`
}

const createPOSchema = z.object({
  requestId: z.string().uuid(),
  vendorId: z.string().uuid().optional(),
  items: z.array(
    z.object({
      itemName: z.string(),
      description: z.string().optional(),
      quantity: z.string(),
      unitPrice: z.string(),
    })
  ),
  expectedDelivery: z.string().optional(),
})

export async function createPurchaseOrder(
  data: z.infer<typeof createPOSchema>,
  organizationId: string
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const validation = createPOSchema.safeParse(data)
    if (!validation.success) {
      return { success: false, error: "Invalid input" }
    }

    const db = getDb()
    const userRepo = new UserRepository()
    const appUser = await userRepo.findByClerkId(userId)

    if (!appUser) {
      return { success: false, error: "User not found in database" }
    }

    // Generate PO number
    const poNumber = await generatePONumber(organizationId)

    // Calculate total
    const totalAmount = validation.data.items.reduce(
      (sum, item) => sum + parseFloat(item.unitPrice) * parseFloat(item.quantity),
      0
    )

    let poId: string | null = null

    // Create PO in transaction
    await db.transaction(async (tx) => {
      const [po] = await tx
        .insert(schema.purchaseOrders)
        .values({
          organizationId,
          requestId: validation.data.requestId,
          vendorId: validation.data.vendorId,
          poNumber,
          status: "DRAFT",
          totalAmount: totalAmount.toString(),
          currency: "USD",
          expectedDelivery: validation.data.expectedDelivery ? new Date(validation.data.expectedDelivery) : undefined,
          createdBy: appUser.id,
        })
        .returning()

      poId = po.id

      // Create PO items
      const items = validation.data.items.map((item, index) => ({
        purchaseOrderId: po.id,
        lineNumber: index + 1,
        itemName: item.itemName,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: (parseFloat(item.unitPrice) * parseFloat(item.quantity)).toString(),
      }))

      await tx.insert(schema.purchaseOrderItems).values(items)

      // Create audit log
      await tx.insert(schema.auditLogs).values({
        organizationId,
        action: "PO_CREATED",
        entityType: "purchase_order",
        entityId: po.id,
        performedBy: appUser.id,
        metadata: { poNumber, status: "DRAFT", totalAmount },
      })
    })

    return { success: true, poId, poNumber, totalAmount }
  } catch (error) {
    console.error("[createPurchaseOrder Error]", error)
    return { success: false, error: "Failed to create purchase order" }
  }
}

export async function getPurchaseOrdersByOrganization(organizationId: string) {
  try {
    const db = getDb()
    const {userId} = await auth();
       const userRepo = new UserRepository()
    const appUser = await userRepo.findByClerkId(userId!)
    const organizationUId = appUser.organizationId;
    const orders = await db
      .select({
        id: schema.purchaseOrders.id,
        poNumber: schema.purchaseOrders.poNumber,
        requestNumber: schema.purchaseRequests.requestNumber,
        requestTitle: schema.purchaseRequests.title,
        vendorName: schema.users.name,
        totalAmount: schema.purchaseOrders.totalAmount,
        currency: schema.purchaseOrders.currency,
        status: schema.purchaseOrders.status,
        expectedDelivery: schema.purchaseOrders.expectedDelivery,
        createdAt: schema.purchaseOrders.createdAt,
      })
      .from(schema.purchaseOrders)
      .leftJoin(
        schema.purchaseRequests,
        eq(schema.purchaseOrders.requestId, schema.purchaseRequests.id)
      )
      .leftJoin(schema.users, eq(schema.purchaseOrders.vendorId, schema.users.id))
      .where(eq(schema.purchaseOrders.organizationId, organizationUId!))
      .orderBy(schema.purchaseOrders.createdAt)

    return { success: true, data: orders }
  } catch (error) {
    console.error("[getPurchaseOrdersByOrganization Error]", error)
    return { success: false, error: "Failed to fetch purchase orders" }
  }
}

export async function getPurchaseOrderDetails(poId: string, organizationId: string) {
  try {
     const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const db = getDb()
    const userRepo = new UserRepository()
    const appUser = await userRepo.findByClerkId(userId)
    const organizationUId = appUser.organizationId;
    if (!appUser) {
      return { success: false, error: "User not found in database" }
    }
    const po = await db
      .select()
      .from(schema.purchaseOrders)
      .where(
        and(
          eq(schema.purchaseOrders.id, poId),
          eq(schema.purchaseOrders.organizationId, organizationUId!)
        )
      )
      .limit(1)

    if (!po.length) {
      return { success: false, error: "Purchase order not found" }
    }

    const items = await db
      .select()
      .from(schema.purchaseOrderItems)
      .where(eq(schema.purchaseOrderItems.purchaseOrderId, poId))

    return { success: true, po: po[0], items }
  } catch (error) {
    console.error("[getPurchaseOrderDetails Error]", error)
    return { success: false, error: "Failed to fetch purchase order details" }
  }
}

export async function updatePOStatus(
  poId: string,
  status: "DRAFT" | "ISSUED" | "DELIVERED" | "COMPLETED" | "CANCELLED",
  organizationId: string
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const db = getDb()
    const userRepo = new UserRepository()
    const appUser = await userRepo.findByClerkId(userId)
    const organizationUId = appUser.organizationId;
    if (!appUser) {
      return { success: false, error: "User not found in database" }
    }

    await db.transaction(async (tx) => {
      await tx
        .update(schema.purchaseOrders)
        .set({ status })
        .where(
          and(
            eq(schema.purchaseOrders.id, poId),
            eq(schema.purchaseOrders.organizationId, organizationUId!)
          )
        )

      // Create audit log
      await tx.insert(schema.auditLogs).values({
        organizationId,
        action: "STATUS_CHANGED",
        entityType: "purchase_order",
        entityId: poId,
        performedBy: appUser.id,
        metadata: { status },
      })
    })

    return { success: true }
  } catch (error) {
    console.error("[updatePOStatus Error]", error)
    return { success: false, error: "Failed to update purchase order status" }
  }
}
