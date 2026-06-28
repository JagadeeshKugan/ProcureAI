"use server"

import { auth } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { getDb, schema } from "@/db"
import { GoogleGenerativeAI } from "@google/generative-ai"

interface VendorRecommendation {
  recommendedVendor: string
  reason: string
  alternatives: string
  risks: string
  markdown: string
}

/**
 * Get RFQ and quotations by RFQ number for vendor recommendation
 */
export async function getRFQByNumberForRecommendation(rfqNumber: string) {
  try {
    const db = getDb()

    // Query RFQ by number
    const rfqResult = await db
      .select({
        id: schema.rfqs.id,
        rfqNumber: schema.rfqs.rfqNumber,
        title: schema.rfqs.title,
        description: schema.rfqs.description,
      })
      .from(schema.rfqs)
      .where(eq(schema.rfqs.rfqNumber, rfqNumber))
      .limit(1)

    if (!rfqResult.length) {
      return { success: false, error: `No RFQ found with number ${rfqNumber}`, data: null }
    }

    const rfq = rfqResult[0]

    // Query quotations for this RFQ
    const quotations = await db
      .select({
        id: schema.quotations.id,
        vendorName: schema.users.name,
        price: schema.quotations.price,
        deliveryDays: schema.quotations.deliveryDays,
        warranty: schema.quotations.warranty,
        notes: schema.quotations.notes,
      })
      .from(schema.quotations)
      .leftJoin(schema.users, eq(schema.quotations.vendorId, schema.users.id))
      .where(eq(schema.quotations.rfqId, rfq.id))

    return {
      success: true,
      data: {
        rfq,
        quotations: quotations || [],
      },
    }
  } catch (error) {
    console.error("[getRFQByNumberForRecommendation] Error:", error)
    return { success: false, error: "Failed to fetch RFQ data", data: null }
  }
}

/**
 * Get vendor recommendation from Gemini based on quotations
 */
export async function getVendorRecommendation(
  rfqNumber: string,
  rfqTitle: string,
  quotations: Array<{
    vendorName: string | null
    price: string | number
    deliveryDays: number
    warranty: string | null
    notes: string | null
  }>
): Promise<VendorRecommendation> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("AI service not configured")
  }

  const client = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" })

  const quotationsText = quotations
    .map(
      (q, idx) =>
        `Vendor ${idx + 1}: ${q.vendorName || "Unknown"}\n` +
        `  - Price: $${typeof q.price === "string" ? q.price : q.price.toFixed(2)}\n` +
        `  - Delivery: ${q.deliveryDays} days\n` +
        `  - Warranty: ${q.warranty || "Not specified"}\n` +
        `  - Notes: ${q.notes || "None"}`
    )
    .join("\n\n")

  const prompt = `You are a procurement analyst. Evaluate vendors for RFQ ${rfqNumber}: ${rfqTitle}

${quotationsText}

Based on price, delivery time, warranty, and overall value:
1. Recommend the best vendor
2. Explain why
3. List alternatives
4. Identify risks

Format your response in markdown with these exact sections:
## Recommended Vendor
[Vendor name and summary]

## Reason
[Why this vendor is best]

## Alternative Vendors
[Other viable options]

## Risk Considerations
[Any risks or concerns]`

  const result = await model.generateContent(prompt)
  const markdown = result.response.text()

  // Parse sections from markdown
  const extractSection = (header: string) => {
    const regex = new RegExp(`##\\s*${header}([^]*?)(?=##|$)`, "i")
    const match = markdown.match(regex)
    return match ? match[1].trim() : ""
  }

  return {
    recommendedVendor: extractSection("Recommended Vendor"),
    reason: extractSection("Reason"),
    alternatives: extractSection("Alternative Vendors"),
    risks: extractSection("Risk Considerations"),
    markdown,
  }
}
