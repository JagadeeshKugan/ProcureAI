"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, X, Check } from "lucide-react"
import { createRFQFromRequest, getAvailableVendors } from "@/actions/procurement.actions"
import { toast } from "sonner"

interface RFQCreationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestId?: string
  organizationId: string
  requestNumber?: string
  requestTitle: string
  requestAmount?: string
  showRequestSummary?: boolean
  onRFQCreated?: (rfqId: string) => void | Promise<void>
}

interface Vendor {
  id: string
  name: string | null
  email: string | null
  role: string | null
}

export function RFQCreationModal({
  open,
  onOpenChange,
  requestId = "",
  organizationId,
  requestNumber = "",
  requestTitle = "New RFQ",
  requestAmount,
  showRequestSummary = true,
  onRFQCreated,
}: RFQCreationModalProps) {
  const { orgRole } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingVendors, setLoadingVendors] = useState(true)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])
  const [dueDate, setDueDate] = useState("")
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("")
  const [notes, setNotes] = useState("")
  const [termsAndConditions, setTermsAndConditions] = useState("")
  const [rfqTitle, setRFQTitle] = useState(requestTitle || "")
  const [rfqDescription, setRFQDescription] = useState("")

  // Check authorization
  const isAuthorized =
    orgRole && ["org:admin", "org:procurement_manager"].includes(orgRole)

  useEffect(() => {
    if (open) {
      loadVendors()
    }
  }, [open])

  const loadVendors = async () => {
    try {
      setLoadingVendors(true)
      const result = await getAvailableVendors(organizationId)
      if (result.success && result.data) {
        setVendors(result.data)
      } else {
        toast.error("Failed to load vendors")
      }
    } catch (error) {
      console.error("[RFQModal] Error loading vendors:", error)
      toast.error("Error loading vendors")
    } finally {
      setLoadingVendors(false)
    }
  }

  const toggleVendor = (vendorId: string) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorId)
        ? prev.filter((id) => id !== vendorId)
        : [...prev, vendorId]
    )
  }

  const handleCreateRFQ = async () => {
    if (selectedVendors.length === 0) {
      toast.error("Please select at least one vendor")
      return
    }

    if (!dueDate) {
      toast.error("Please specify a due date")
      return
    }

    // Validate title for standalone RFQ
    if (!requestId && !rfqTitle) {
      toast.error("Please specify an RFQ title")
      return
    }

    try {
      setLoading(true)

      // Use provided description/title or default to request title
      const finalTitle = rfqTitle || requestTitle || "New RFQ"
      const finalDescription = rfqDescription || notes

      const result = await createRFQFromRequest(
        requestId,
        organizationId,
        selectedVendors,
        dueDate,
        finalDescription,
        termsAndConditions,
        expectedDeliveryDate,
        !requestId ? finalTitle : 'UnTitled' // Pass title for standalone RFQs
      )

      if (result.success) {
        toast.success(`RFQ created successfully: ${result.data?.rfqNumber}`)
        
        // Call the callback if provided
        if (onRFQCreated && result.rfqId) {
          await onRFQCreated(result.rfqId)
        }
        
        onOpenChange(false)
        // Reset form
        setSelectedVendors([])
        setDueDate("")
        setExpectedDeliveryDate("")
        setNotes("")
        setTermsAndConditions("")
        setRFQTitle("")
        setRFQDescription("")
      } else {
        toast.error(result.error || "Failed to create RFQ")
      }
    } catch (error) {
      console.error("[RFQModal] Error creating RFQ:", error)
      toast.error("Error creating RFQ")
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create RFQ</DialogTitle>
          <DialogDescription>
            {requestId
              ? `Create a Request for Quotation for ${requestNumber} - ${requestTitle}`
              : "Create a new Request for Quotation"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Request Summary - Only show when creating from approved request */}
          {showRequestSummary && requestId && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-blue-900 font-semibold">Request Number</Label>
                  <p className="text-blue-800">{requestNumber}</p>
                </div>
                <div>
                  <Label className="text-blue-900 font-semibold">Amount</Label>
                  <p className="text-blue-800">{requestAmount || "N/A"}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Manual RFQ Title - Only show when creating standalone RFQ */}
          {!requestId && (
            <>
              <div className="space-y-2">
                <Label htmlFor="rfqTitle">RFQ Title *</Label>
                <Input
                  id="rfqTitle"
                  placeholder="e.g., Office Furniture Supplies"
                  value={rfqTitle}
                  onChange={(e) => setRFQTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rfqDescription">Description</Label>
                <Textarea
                  id="rfqDescription"
                  placeholder="Describe what you're looking to procure..."
                  value={rfqDescription}
                  onChange={(e) => setRFQDescription(e.target.value)}
                  className="min-h-20"
                />
              </div>
            </>
          )}

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          {/* Expected Delivery Date */}
          <div className="space-y-2">
            <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
            <Input
              id="expectedDeliveryDate"
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes for vendors..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-20"
            />
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-2">
            <Label htmlFor="terms">Terms and Conditions</Label>
            <Textarea
              id="terms"
              placeholder="Specify any terms and conditions..."
              value={termsAndConditions}
              onChange={(e) => setTermsAndConditions(e.target.value)}
              className="min-h-20"
            />
          </div>

          {/* Vendor Selection */}
          <div className="space-y-3">
            <Label>Select Vendors * ({selectedVendors.length} selected)</Label>
            {loadingVendors ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : vendors.length === 0 ? (
              <p className="text-sm text-gray-500">No vendors available</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto border rounded-lg p-3">
                {vendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    onClick={() => toggleVendor(vendor.id)}
                    className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition"
                  >
                    <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${selectedVendors.includes(vendor.id)
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-300"
                      }`}>
                      {selectedVendors.includes(vendor.id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{vendor.name || "Unknown"}</div>
                      <div className="text-sm text-gray-500">{vendor.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Vendors Summary */}
          {selectedVendors.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Vendors</Label>
              <div className="flex flex-wrap gap-2">
                {selectedVendors.map((vendorId) => {
                  const vendor = vendors.find((v) => v.id === vendorId)
                  return (
                    <Badge
                      key={vendorId}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {vendor?.name}
                      <button
                        onClick={() => toggleVendor(vendorId)}
                        className="ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateRFQ}
            disabled={loading || selectedVendors.length === 0 || !dueDate}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating RFQ...
              </>
            ) : (
              "Create RFQ"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
