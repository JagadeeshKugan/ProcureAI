"use server";

import { db } from "@/lib/db";
import { vendors } from "@/lib/db/schema";
import { count, desc, gte } from "drizzle-orm";

/**
 * Fetch all vendors from the database
 * Example usage for future database integration
 */
export async function fetchVendors(limit: number = 50, offset: number = 0) {
  try {
    const result = await db
      .select()
      .from(vendors)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(vendors.aiScore));
    return { success: true, data: result };
  } catch (error) {
    console.error("[API] fetchVendors error:", error);
    return { success: false, error: "Failed to fetch vendors" };
  }
}

/**
 * Get vendor statistics from the database
 */
export async function getVendorStats() {
  try {
    const totalVendors = await db
      .select({ count: count() })
      .from(vendors);

    const highRatingVendors = await db
      .select({ count: count() })
      .from(vendors)
      .where(gte(vendors.rating, 4.5));

    return {
      success: true,
      data: {
        total: totalVendors[0]?.count || 0,
        highRating: highRatingVendors[0]?.count || 0,
      },
    };
  } catch (error) {
    console.error("[API] getVendorStats error:", error);
    return { success: false, error: "Failed to get vendor stats" };
  }
}

/**
 * Health check - verify database connection
 */
export async function checkDatabaseHealth() {
  try {
    const result = await db.select().from(vendors).limit(1);
    return { success: true, message: "Database connection OK" };
  } catch (error) {
    console.error("[API] Database health check failed:", error);
    return { success: false, error: "Database connection failed" };
  }
}
