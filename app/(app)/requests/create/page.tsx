"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import {
  ArrowLeft,
  Save,
  Send,
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
} from "lucide-react"
import { toast } from "sonner"

import { createPRDraft, submitPRForApproval } from "@/actions/purchase-request-submit.actions"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { departments, categories } from "@/lib/data"

const priorities = [
  { value: "low", label: "Low", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  { value: "medium", label: "Medium", color: "bg-amber-500/10 text-amber-700 border-amber-200" },
  { value: "high", label: "High", color: "bg-orange-500/10 text-orange-700 border-orange-200" },
  { value: "critical", label: "Critical", color: "bg-red-500/10 text-red-700 border-red-200" },
]

const vendorPreferences = ["Existing Vendor", "New Vendor", "No Preference"]

interface FormData {
  title: string
  category: string
  department: string
  justification: string
  priority: string
  requiredDate: string
  budget: string
  vendorPreference: string
  vendorName: string
  attachments: Array<{ name: string; size: string }>
}

export default function CreateRequestPage() {
  const router = useRouter()
  const { orgRole } = useAuth()

  // Check authorization - only org:admin and org:requester
  if (orgRole && !["org:admin", "org:requester"].includes(orgRole)) {
    redirect("/access-denied")
  }

  const [isSaving, setIsSaving] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formData, setFormData] = React.useState<FormData>({
    title: "",
    category: "",
    department: "Engineering",
    justification: "",
    priority: "medium",
    requiredDate: "",
    budget: "",
    vendorPreference: "No Preference",
    vendorName: "",
    attachments: [],
  })

  const completionPercentage = React.useMemo(() => {
    const requiredFields = [
      formData.title,
      formData.category,
      formData.department,
      formData.priority,
      formData.requiredDate,
      formData.budget,
    ]
    const completed = requiredFields.filter((field) => field?.toString().trim() !== "").length
    return Math.round((completed / requiredFields.length) * 100)
  }, [formData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string | null) => {
    if (value) {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files) {
      Array.from(files).forEach((file) => {
        const sizeInMB = (file.size / 1024 / 1024).toFixed(2)
        setFormData((prev) => ({
          ...prev,
          attachments: [
            ...prev.attachments,
            { name: file.name, size: `${sizeInMB} MB` },
          ],
        }))
      })
    }
  }

  const removeAttachment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }))
  }

  const handleSaveDraft = async () => {
    if (!formData.title || !formData.budget) {
      toast.error("Missing required fields", {
        description: "Title and budget are required.",
      })
      return
    }

    setIsSaving(true)
    try {
      const result = await createPRDraft({
        title: formData.title,
        description: formData.justification,
        priority: formData.priority as any,
        estimatedTotal: formData.budget,
        department: formData.department,
        items: [
          {
            itemName: formData.title,
            quantity: "1",
            unitPrice: formData.budget,
          },
        ],
      })

      if (result.success) {
        toast.success("Draft saved", {
          description: `Request ${result.requestNumber} saved as draft.`,
        })
      } else {
        toast.error("Failed to save", {
          description: result.error,
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.category || !formData.budget || !formData.requiredDate) {
      toast.error("Missing required fields", {
        description: "Please fill in all required fields before submitting.",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // First create draft
      const draftResult = await createPRDraft({
        title: formData.title,
        description: formData.justification,
        priority: formData.priority as any,
        estimatedTotal: formData.budget,
        department: formData.department,
        items: [
          {
            itemName: formData.title,
            quantity: "1",
            unitPrice: formData.budget,
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
      setIsSubmitting(false)
    }
  }

  const priorityBadge = priorities.find((p) => p.value === formData.priority)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Purchase Request"
        description="Submit a procurement request for approval and sourcing."
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="cursor-pointer"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="cursor-pointer"
          >
            <Save className="size-4" />
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || completionPercentage < 100}
            className="cursor-pointer"
          >
            <Send className="size-4" />
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
              <CardDescription>
                Provide information about your procurement need.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="title">
                    Request Title <span className="text-red-500">*</span>
                  </FieldLabel>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., MacBook Pro for New Developer"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </Field>
              </FieldGroup>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="category">
                    Purchase Category <span className="text-red-500">*</span>
                  </FieldLabel>
                  <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
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
                  <FieldLabel htmlFor="department">
                    Department <span className="text-red-500">*</span>
                  </FieldLabel>
                  <Select value={formData.department} onValueChange={(value) => handleSelectChange("department", value)}>
                    <SelectTrigger id="department">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {departments.slice(1).map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="justification">
                  Business Justification <span className="text-red-500">*</span>
                </FieldLabel>
                <Textarea
                  id="justification"
                  name="justification"
                  placeholder="Explain the business need and how this will benefit the organization..."
                  rows={4}
                  value={formData.justification}
                  onChange={handleInputChange}
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {formData.justification.length} / 500 characters
                </p>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="priority">
                    Priority Level <span className="text-red-500">*</span>
                  </FieldLabel>
                  <Select value={formData.priority} onValueChange={(value) => handleSelectChange("priority", value)}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {priorities.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="requiredDate">
                    Required By Date <span className="text-red-500">*</span>
                  </FieldLabel>
                  <Input
                    id="requiredDate"
                    name="requiredDate"
                    type="date"
                    value={formData.requiredDate}
                    onChange={handleInputChange}
                    required
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="budget">
                  Estimated Budget (USD) <span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  placeholder="50000"
                  value={formData.budget}
                  onChange={handleInputChange}
                  required
                />
              </Field>
            </CardContent>
          </Card>

          {/* Vendor Preference */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Preference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel htmlFor="vendorPreference">Vendor Type</FieldLabel>
                <Select value={formData.vendorPreference} onValueChange={(value) => handleSelectChange("vendorPreference", value)}>
                  <SelectTrigger id="vendorPreference">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {vendorPreferences.map((pref) => (
                        <SelectItem key={pref} value={pref}>
                          {pref}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              {formData.vendorPreference !== "No Preference" && (
                <Field>
                  <FieldLabel htmlFor="vendorName">Vendor Name</FieldLabel>
                  <Input
                    id="vendorName"
                    name="vendorName"
                    placeholder="Enter vendor name..."
                    value={formData.vendorName}
                    onChange={handleInputChange}
                  />
                </Field>
              )}
            </CardContent>
          </Card>

          {/* File Attachments */}
         { /* <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
              <CardDescription>
                Upload supporting documents (PDF, DOCX, XLSX, PNG, JPG)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 p-8 cursor-pointer hover:border-primary/40 hover:bg-accent/20 transition-colors">
                <Upload className="size-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium">Drag and drop files here</p>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {formData.attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Attached files ({formData.attachments.length})</p>
                  {formData.attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border p-3 bg-muted/20"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="size-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{file.size}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
                      >
                        <X className="size-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>*/}
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          {/* Request Status */}
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-base">Request Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge variant="outline" className="w-full justify-center py-1">
                <Clock className="size-3 mr-1.5" />
                Draft
              </Badge>
            </CardContent>
          </Card>

          {/* Budget Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formData.budget ? `$${Number(formData.budget).toLocaleString()}` : "$0"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Estimated amount</p>
            </CardContent>
          </Card>

          {/* Approval Route */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Approval Route</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Department Manager", icon: "👤" },
                { label: "Finance", icon: "💼" },
                { label: "Procurement Team", icon: "✓" },
              ].map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                    {step.icon}
                  </div>
                  <p className="text-sm text-muted-foreground">{step.label}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Procurement Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                <div className="flex gap-2">
                  <AlertCircle className="size-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800">
                    Existing contracts available for {formData.category || "this category"}.
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                <div className="flex gap-2">
                  <AlertCircle className="size-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Budget policy requires approval for amounts over $50,000.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completion Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Completion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground">
                {completionPercentage === 100
                  ? "Ready to submit!"
                  : "Fill in required fields to submit."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
