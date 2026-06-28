import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

interface QuotationData {
  vendorName: string
  price: number
  deliveryDays: number
  warranty: string | null
  notes: string | null
}

interface ComparisonRequest {
  rfqId: string
  title: string
  quotations: QuotationData[]
}

interface VendorScore {
  vendor: string
  score: number
}

interface ComparisonResponse {
  recommendedVendor: string
  summary: string
  reason: string
  vendorScores: VendorScore[]
}

const client = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const body: ComparisonRequest = await request.json()
    const { rfqId, title, quotations } = body

    if (!quotations || quotations.length === 0) {
      return NextResponse.json(
        { error: "No quotations provided" },
        { status: 400 }
      )
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      )
    }

    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" })

    const quotationsText = quotations
      .map(
        (q, idx) =>
          `Vendor ${idx + 1}: ${q.vendorName}\n` +
          `  - Price: $${q.price}\n` +
          `  - Delivery: ${q.deliveryDays} days\n` +
          `  - Warranty: ${q.warranty || "Not specified"}\n` +
          `  - Notes: ${q.notes || "None"}`
      )
      .join("\n\n")

    const prompt = `You are a procurement analyst. Evaluate the following vendor quotations for RFQ: ${title}

${quotationsText}

Analyze based on:
1. Price - Total cost of ownership
2. Delivery Time - Days to delivery
3. Warranty - Coverage and terms
4. Overall Value - Best balance of cost, time, and quality

Provide your analysis in the following JSON format (return ONLY valid JSON, no markdown or extra text):
{
  "recommendedVendor": "Name of the vendor",
  "summary": "One sentence summary of recommendation",
  "reason": "2-3 sentences explaining why this vendor is best",
  "vendorScores": [
    {"vendor": "Vendor Name", "score": 95},
    {"vendor": "Vendor Name", "score": 85}
  ]
}

Ensure vendorScores includes all vendors with numeric scores from 0-100.`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("[vendor-comparison] Failed to parse AI response:", responseText)
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      )
    }

    const analysis: ComparisonResponse = JSON.parse(jsonMatch[0])

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("[vendor-comparison] Error:", error)
    return NextResponse.json(
      { error: "Failed to analyze vendors" },
      { status: 500 }
    )
  }
}
