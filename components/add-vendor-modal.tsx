"use client"

import { useState } from "react"
import { toast } from "sonner"
import { createVendor } from "@/actions/vendor-management.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface AddVendorModalProps {
  onVendorCreated?: () => void
}

export function AddVendorModal({ onVendorCreated }: AddVendorModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    organizationName: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.organizationName) {
      toast.error("Please fill in all fields")
      return
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    try {
      const result = await createVendor(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.organizationName
      )

      if (result.success) {
        toast.success("Vendor created successfully")
        setFormData({
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          organizationName: "",
        })
        setOpen(false)
        onVendorCreated?.()
      } else {
        toast.error(result.error || "Failed to create vendor")
      }
    } catch (error) {
      console.error("[AddVendorModal] Error:", error)
      toast.error("Failed to create vendor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>
            Create a new vendor account. They will be set up in Clerk and added to the database.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="organizationName">Organization / Company Name</Label>
              <Input
                id="organizationName"
                name="organizationName"
                placeholder="Acme Corp"
                value={formData.organizationName}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Vendor"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
