"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Card } from "@/components/ui/card"
import { CreateRequestForm } from "./create-request-form"
import { AIPurchaseRequest } from "./ai-purchase-request"

type Mode = "manual" | "ai"

interface AIRequestData {
  title: string | null
  description: string | null
  priority: "low" | "medium" | "high" | "critical" | null
  department: string | null
  budget: string | null
  quantity: string | null
  category: string | null
}

interface PurchaseRequestModeProps {
  onSubmit: (data: {
    title: string
    description: string
    quantity: number
    unitPrice: number
    priority: string
  }) => Promise<void>
  isLoading?: boolean
}

export function PurchaseRequestMode({ onSubmit, isLoading = false }: PurchaseRequestModeProps) {
  const [mode, setMode] = useState<Mode>("manual")
  const [formValues, setFormValues] = useState<Partial<AIRequestData>>({})

  const handleAIDataGenerated = (data: AIRequestData) => {
    setFormValues(data)
  }

  const handleSwitchToManual = () => {
    setMode("manual")
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-medium">Mode</div>
          <ToggleGroup value={[mode]} onValueChange={(values) => {
    const value = values[0]

    if (value === "manual" || value === "ai") {
      setMode(value)
    }
  }}>
            <ToggleGroupItem value="manual" className="flex-1">
              Manual Form
            </ToggleGroupItem>
            <ToggleGroupItem value="ai" className="flex-1 gap-2">
              <Sparkles className="h-4 w-4" />
              AI Request
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </Card>

      {mode === "manual" ? (
        <CreateRequestForm onSubmit={onSubmit} isLoading={isLoading} initialValues={formValues} />
      ) : (
        <AIPurchaseRequest
          onDataGenerated={handleAIDataGenerated}
          onSwitchToManual={handleSwitchToManual}
        />
      )}
    </div>
  )
}
