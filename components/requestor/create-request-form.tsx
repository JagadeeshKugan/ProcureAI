"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"

interface CreateRequestFormProps {
  onSubmit: (data: {
    title: string
    description: string
    quantity: number
    unitPrice: number
    priority: string
  }) => Promise<void>
  isLoading?: boolean
}

export function CreateRequestForm({ onSubmit, isLoading = false }: CreateRequestFormProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    quantity: 1,
    unitPrice: 0,
    priority: "medium",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
    setFormData({ title: "", description: "", quantity: 1, unitPrice: 0, priority: "medium" })
    setOpen(false)
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="w-full md:w-auto">
        <Plus className="size-4 mr-2" />
        Create Purchase Request
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Create Purchase Request</CardTitle>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          ×
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Item Name *</Label>
            <Input
              id="title"
              placeholder="e.g., Office Supplies"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="description">Description / Justification</Label>
            <Textarea
              id="description"
              placeholder="Why is this needed? Any specific requirements?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="unitPrice">Unit Price ($) *</Label>
              <Input
                id="unitPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="priority">Priority *</Label>
            <Select value={formData.priority} onValueChange={(value: string | null) => {
              if (value) setFormData({ ...formData, priority: value })
            }}>
              <SelectTrigger id="priority" disabled={isLoading}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Creating..." : "Submit Request"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
