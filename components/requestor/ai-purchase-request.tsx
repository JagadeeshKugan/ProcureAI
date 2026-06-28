"use client"

import { useState } from "react"
import { Loader2, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

interface AIRequestData {
  title: string
  description: string
  priority: "low" | "medium" | "high" | "critical" | null
  department: string
  budget: string
  quantity: string
  category: string | null
}

interface AIPurchaseRequestProps {
  onDataGenerated: (data: AIRequestData) => void
  onSwitchToManual: () => void
}

export function AIPurchaseRequest({ onDataGenerated, onSwitchToManual }: AIPurchaseRequestProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerate = async () => {
    if (!input.trim()) {
      toast.error("Please describe what you need")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/ai/purchase-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate request")
      }

      const data: AIRequestData = await response.json()
      onDataGenerated(data)
      onSwitchToManual()
      toast.success("Request generated! Review and edit before submitting.")
    } catch (error) {
      console.error("[AIPurchaseRequest] Error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to generate request")
    } finally {
      setIsLoading(false)
    }
  }

  const examples = [
    "Need 25 Dell laptops for the development team by August. Budget ₹20 lakhs.",
    "Purchase 50 office chairs for the Chennai office before September.",
    "Require 100 units of office paper (A4) and printer ink cartridges for monthly supply.",
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Create with AI</CardTitle>
              <CardDescription>Describe what you need in natural language</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="text-sm">
              AI assists with request creation. Final review is required before submission.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label className="text-sm font-medium">What do you need?</label>
            <Textarea
              placeholder="Describe what you need.

Examples:
Need 25 Dell laptops for the development team by August. Budget ₹20 lakhs.

Purchase 50 office chairs for the Chennai office before September."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Quick Examples */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Quick examples:</p>
            <div className="space-y-2">
              {examples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setInput(example)}
                  disabled={isLoading}
                  className="w-full text-left text-sm p-2 rounded border border-border hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <p className="line-clamp-2">{example}</p>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isLoading || !input.trim()}
            className="w-full gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing procurement request...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Request
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
