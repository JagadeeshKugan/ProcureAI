"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Card } from "@/components/ui/card"
import { AIPurchaseRequest } from "./ai-purchase-request"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { toast } from "sonner"
import { createPRDraft, submitPRForApproval } from "@/actions/purchase-request-submit.actions"

type Mode = "manual" | "ai"

interface AIRequestData {
  title: string
  description: string 
  priority: "low" | "medium" | "high" | "critical" | null
  department: string
  budget: string
  quantity: string
  category: string | null
}

interface PurchaseRequestModeProps {
  onSubmit?: (data: {
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
  const [open, setOpen] = useState(false)
  const [IsSubmitting,setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleAIDataGenerated = (data: AIRequestData) => {
    setFormValues(data)
    setOpen(true);
  }
   
  const handleSubmit = async () => {
       if (!formValues) {
         toast.error("Missing required fields", {
           description: "Please fill in all required fields before submitting.",
         })
         return
       }
   
       setIsSubmitting(true)
       try {
         // First create draft
         const draftResult = await createPRDraft({
           title: formValues.title ?? 'new request ',
           description: formValues.description,
           priority: formValues.priority as any,
           estimatedTotal: formValues.budget!,
           department: formValues.department,
           items: [
             {
               itemName: formValues.title ?? 'new request',
               quantity: formValues.quantity ?? '1',
               unitPrice: formValues.budget,
             },
           ],
         })
   
         if (!draftResult.success || !draftResult.requestId) {
           toast.error("Failed to create request", {
             description: draftResult.error || "Failed to create purchase request",
           })
           return
         }
   
         // Then submit for approval
         const submitResult = await submitPRForApproval(draftResult.requestId)
   
         if (submitResult.success) {
           toast.success("Request submitted", {
             description: `${draftResult.requestNumber} submitted with ${submitResult.approverCount} approvers.`,
           })
           router.push("/requests")
         } else {
           toast.error("Failed to submit", {
             description: submitResult.error,
           })
         }
       } finally {
         setIsSubmitting(false);
         setOpen(false);
       }
     }
   
  const handleSwitchToManual = () => {
    setMode("manual")
  }

  if(IsSubmitting){
    return <div>Submitting data ...</div>
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
        <Button className={'cursor-pointer'} onClick={() => router.push('/requests/create')}> Go to requests</Button>
      ) : (
        <AIPurchaseRequest
          onDataGenerated={handleAIDataGenerated}
          onSwitchToManual={handleSwitchToManual}
        />
      )}
      <Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>
        AI Generated Request
      </DialogTitle>
    </DialogHeader>

    <pre>
      {JSON.stringify(formValues, null, 2)}
    </pre>

    <Button
      onClick={async () => {
        if (!formValues) return

        await handleSubmit(); }}
    >
      Create Request
    </Button>
  </DialogContent>
</Dialog>
    </div>
  )
}
