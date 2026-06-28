import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "")

const SYSTEM_PROMPT = `You are an expert procurement assistant. Your task is to convert natural language procurement requests into structured purchase requests.

When given a natural language description, extract and return a JSON object with the following fields:
- title: A concise title for the purchase request
- description: A detailed description of what's being requested
- priority: Priority level (low, medium, high, critical)
- department: Department making the request (if mentioned, otherwise "General")
- budget: Estimated budget in rupees (extract number only)
- quantity: Quantity requested (extract number only)
- category: Category of the item (e.g., IT Hardware, Office Supplies, Furniture, etc.)

Return ONLY valid JSON, no additional text. If a field cannot be determined, use null.

Example input: "Need 25 Dell laptops for the development team by August. Budget ₹20 lakhs."
Example output: {"title":"Dell Laptops for Development Team","description":"25 Dell laptops needed for development team deployment by August","priority":"high","department":"Development","budget":2000000,"quantity":25,"category":"IT Hardware"}`

interface ParsedRequest {
  title: string | null
  description: string | null
  priority: "low" | "medium" | "high" | "critical" | null
  department: string | null
  budget: string | null
  quantity: string | null
  category: string | null
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment variable
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: "GOOGLE_GENERATIVE_AI_API_KEY not configured" },
        { status: 500 }
      )
    }

    const { text } = await request.json()

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid request text" },
        { status: 400 }
      )
    }

    // Call Google Generative AI
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${SYSTEM_PROMPT}\n\nUser request: "${text}"`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    })

    const response = result.response
    const content = response.text()

    // Parse JSON response
    let parsedData: ParsedRequest
    try {
      // Extract JSON from the response (handle potential markdown formatting)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No JSON found in response")
      }
      parsedData = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error("[AI Purchase Request] JSON parse error:", parseError, "Content:", content)
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      )
    }

    // Validate and normalize the parsed data
    const validatedData: ParsedRequest = {
      title: parsedData.title || null,
      description: parsedData.description || null,
      priority: ["low", "medium", "high", "critical"].includes(parsedData.priority || "")
        ? parsedData.priority
        : "medium",
      department: parsedData.department || null,
      budget: parsedData.budget ? String(parsedData.budget) : null,
      quantity: parsedData.quantity ? String(parsedData.quantity) : null,
      category: parsedData.category || null,
    }

    return NextResponse.json(validatedData)
  } catch (error) {
    console.error("[AI Purchase Request] Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}
