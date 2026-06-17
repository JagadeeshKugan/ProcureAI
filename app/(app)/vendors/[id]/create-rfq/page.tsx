"use client"

import { use } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { vendors, categories } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Plus, X, Sparkles } from "lucide-react"

export default function CreateRFQPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const vendor = vendors.find((v) => v.id === id)
  if (!vendor) notFound()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [quantity, setQuantity] = useState("")
  const [budget, setBudget] = useState("")
  const [deadline, setDeadline] = useState("")
  const [lineItems, setLineItems] = useState<
    Array<{ id: string; item: string; qty: string; unitPrice: string }>
  >([])
  const [newLineItem, setNewLineItem] = useState({ item: "", qty: "", unitPrice: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addLineItem = () => {
    if (newLineItem.item && newLineItem.qty && newLineItem.unitPrice) {
      setLineItems([
        ...lineItems,
        {
          id: Date.now().toString(),
          ...newLineItem,
        },
      ])
      setNewLineItem({ item: "", qty: "", unitPrice: "" })
    }
  }

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id))
  }

  const totalAmount = lineItems.reduce(
    (sum, item) => sum + (Number(item.qty) * Number(item.unitPrice) || 0),
    0
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setIsSubmitting(false)
      toast.success("RFQ Created Successfully", {
        description: `RFQ for ${vendor.name} has been created and sent. Expected response within 3-5 business days.`,
      })
      window.location.href = `/vendors/${id}`
    } catch (error) {
      setIsSubmitting(false)
      toast.error("Failed to create RFQ", {
        description: "Please try again later.",
      })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit cursor-pointer"
        render={<Link href={`/vendors/${id}`} />}
      >
        <ArrowLeft data-icon="inline-start" />
        Back to {vendor.name}
      </Button>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Create Request for Quote</h1>
        <p className="text-muted-foreground">
          Send an RFQ to {vendor.name} for specific products or services.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* RFQ Header */}
            <Card>
              <CardHeader>
                <CardTitle>RFQ Details</CardTitle>
                <CardDescription>Basic information about your request</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="title">RFQ Title *</FieldLabel>
                    <Input
                      id="title"
                      placeholder="e.g. Office Supplies - Q3 2024"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                    <FieldDescription>
                      A clear title for this request for quote
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="description">Description *</FieldLabel>
                    <Textarea
                      id="description"
                      placeholder="Describe what you need from this vendor. Include any specifications, preferences, or requirements."
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="category">Category *</FieldLabel>
                      <Select value={category} onValueChange={(value) => setCategory(value ?? "")}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="deadline">Deadline *</FieldLabel>
                      <Input
                        id="deadline"
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        required
                      />
                    </Field>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle>Line Items</CardTitle>
                <CardDescription>Add specific products or services you&apos;re requesting</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col gap-4">
                  {/* Add Line Item Form */}
                  <div className="rounded-lg border border-dashed border-border p-4">
                    <div className="grid gap-3">
                      <Field>
                        <FieldLabel htmlFor="item">Item / Product</FieldLabel>
                        <Input
                          id="item"
                          placeholder="e.g. Office Chair, Model XYZ"
                          value={newLineItem.item}
                          onChange={(e) =>
                            setNewLineItem({ ...newLineItem, item: e.target.value })
                          }
                        />
                      </Field>
                      <div className="grid grid-cols-3 gap-3">
                        <Field>
                          <FieldLabel htmlFor="qty">Quantity</FieldLabel>
                          <Input
                            id="qty"
                            type="number"
                            placeholder="10"
                            value={newLineItem.qty}
                            onChange={(e) =>
                              setNewLineItem({ ...newLineItem, qty: e.target.value })
                            }
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="unitPrice">Unit Price (USD)</FieldLabel>
                          <Input
                            id="unitPrice"
                            type="number"
                            placeholder="0.00"
                            value={newLineItem.unitPrice}
                            onChange={(e) =>
                              setNewLineItem({ ...newLineItem, unitPrice: e.target.value })
                            }
                          />
                        </Field>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full cursor-pointer"
                            onClick={addLineItem}
                          >
                            <Plus className="size-4" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Line Items List */}
                  {lineItems.length > 0 && (
                    <div className="space-y-2">
                      {lineItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg bg-secondary/30 p-3"
                        >
                          <div className="flex flex-col gap-1 flex-1">
                            <span className="text-sm font-medium">{item.item}</span>
                            <span className="text-xs text-muted-foreground">
                              {item.qty} × ${Number(item.unitPrice).toFixed(2)} = $
                              {(Number(item.qty) * Number(item.unitPrice)).toFixed(2)}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => removeLineItem(item.id)}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="notes">Special instructions or requirements</FieldLabel>
                    <Textarea
                      id="notes"
                      placeholder="Any additional information the vendor should know..."
                      rows={3}
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Vendor Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sending to</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-sm font-medium">{vendor.name}</p>
                  <p className="text-xs text-muted-foreground">{vendor.category}</p>
                </div>
                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rating:</span>
                    <span className="font-medium">{vendor.rating}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">AI Score:</span>
                    <span className="font-medium text-primary">{vendor.aiScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lead Time:</span>
                    <span className="font-medium">{vendor.leadTime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RFQ Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">RFQ Summary</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Items</p>
                  <p className="text-lg font-semibold">{lineItems.length}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-semibold tracking-tight">
                    ${totalAmount.toFixed(2)}
                  </p>
                </div>
                {deadline && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground">Response Deadline</p>
                      <p className="text-sm font-medium">{new Date(deadline).toLocaleDateString()}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  {vendor.name} typically responds within {vendor.leadTime}. Based on your request
                  amount, you can expect competitive pricing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Actions */}
        <div className="sticky bottom-0 left-0 right-0 mt-6 flex gap-3 border-t border-border bg-background/80 backdrop-blur-sm p-4">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            render={<Link href={`/vendors/${id}`} />}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !title || !description || !category || !deadline}
            className="cursor-pointer"
          >
            {isSubmitting ? "Sending RFQ..." : "Send RFQ"}
          </Button>
        </div>
      </form>
    </div>
  )
}
