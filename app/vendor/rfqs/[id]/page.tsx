"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

// Mock RFQ data
const mockRFQs: Record<string, any> = {
  "RFQ-2024-001": {
    id: "RFQ-2024-001",
    title: "Industrial Sensors - Batch Purchase",
    description:
      "We are seeking reliable industrial temperature and pressure sensors for our manufacturing facility. High precision and durability required.",
    quantity: 500,
    deadline: "2024-02-15",
    attachments: ["Specifications.pdf", "Technical_Requirements.docx"],
    unit: "pieces",
  },
  "RFQ-2024-002": {
    id: "RFQ-2024-002",
    title: "Custom Bracket Assembly",
    description: "Custom stainless steel bracket assembly for automotive applications.",
    quantity: 1000,
    deadline: "2024-02-10",
    attachments: ["CAD_Drawing.pdf"],
    unit: "units",
  },
}

export default function RFQDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const rfq = mockRFQs[params.id]
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    price: "",
    deliveryDays: "",
    warranty: "",
    notes: "",
  })

  if (!rfq) {
    return (
      <div className="flex flex-col gap-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="-ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex h-96 items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">RFQ not found</p>
        </div>
      </div>
    )
  }

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.price || !formData.deliveryDays) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsSubmitting(false)
    setHasSubmitted(true)
    toast.success("Quote submitted successfully!")

    setTimeout(() => {
      router.push("/vendor/quotes")
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="-ml-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{rfq.title}</h1>
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="default">{rfq.quantity.toLocaleString()} {rfq.unit}</Badge>
          <span className="text-sm text-muted-foreground">
            Due: {new Date(rfq.deadline).toLocaleDateString("en-US")}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* RFQ Details */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-6">
            <h2 className="font-semibold">Details</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {rfq.description}
            </p>
          </Card>

          {rfq.attachments && rfq.attachments.length > 0 && (
            <Card className="p-6">
              <h2 className="font-semibold">Attachments</h2>
              <div className="mt-4 space-y-2">
                {rfq.attachments.map((file: string) => (
                  <div
                    key={file}
                    className="flex items-center gap-2 rounded-lg border p-3"
                  >
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{file}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Quote Form */}
        <div>
          <Card className="sticky top-6 p-6">
            <h2 className="font-semibold">Submit Your Quote</h2>

            {hasSubmitted ? (
              <div className="mt-6 rounded-lg bg-green-50 p-4 text-center">
                <p className="text-sm font-medium text-green-800">
                  Quote submitted successfully!
                </p>
                <p className="mt-1 text-xs text-green-600">
                  Redirecting to quotes...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitQuote} className="mt-6 space-y-4">
                <FieldGroup>
                  <FieldLabel>
                    Price per {rfq.unit} <span className="text-red-500">*</span>
                  </FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      className="pl-7"
                      required
                    />
                  </div>
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel>
                    Delivery Time (days) <span className="text-red-500">*</span>
                  </FieldLabel>
                  <Input
                    type="number"
                    placeholder="e.g., 30"
                    value={formData.deliveryDays}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        deliveryDays: e.target.value,
                      }))
                    }
                    required
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel>Warranty</FieldLabel>
                  <Input
                    type="text"
                    placeholder="e.g., 12 months"
                    value={formData.warranty}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        warranty: e.target.value,
                      }))
                    }
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel>Additional Notes</FieldLabel>
                  <Textarea
                    placeholder="Any additional information about your quote..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="min-h-24"
                  />
                </FieldGroup>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Submitting..." : "Submit Quote"}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
