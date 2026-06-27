"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getVendorRFQDetail, submitQuotation } from "@/actions/vendor.actions"

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

interface RFQDetail {
  id: string
  title: string
  description: string | null
  status: string | null
  createdAt: Date
}

export default function RFQDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [rfq, setRfq] = useState<RFQDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    price: "",
    deliveryDays: "",
    warranty: "",
    notes: "",
  })

  useEffect(() => {
    const fetchRFQ = async () => {
      try {
        const result = await getVendorRFQDetail(params.id)
        if (result.success && result.data) {
          setRfq(result.data as RFQDetail)
        } else {
          toast.error(result.error || "Failed to load RFQ")
        }
      } catch (error) {
        console.error("Error fetching RFQ:", error)
        toast.error("Failed to load RFQ")
      } finally {
        setLoading(false)
      }
    }

    fetchRFQ()
  }, [params.id])

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.price || !formData.deliveryDays) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await submitQuotation(
        params.id,
        formData.price,
        parseInt(formData.deliveryDays),
        formData.warranty || undefined,
        formData.notes || undefined
      )

      if (result.success) {
        setIsSubmitting(false)
        setHasSubmitted(true)
        toast.success("Quote submitted successfully!")

        setTimeout(() => {
          router.push("/vendor/quotes")
        }, 2000)
      } else {
        setIsSubmitting(false)
        toast.error(result.error || "Failed to submit quote")
      }
    } catch (error) {
      setIsSubmitting(false)
      console.error("Error submitting quote:", error)
      toast.error("Failed to submit quote")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

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
          <p className="text-muted-foreground">RFQ not found or access denied</p>
        </div>
      </div>
    )
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
