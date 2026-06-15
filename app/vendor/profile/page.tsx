"use client"

import { useUser } from "@clerk/nextjs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"

export default function VendorProfilePage() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your vendor account and company information.
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Account Info */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold">Account Information</h2>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <Card className="p-6">
          <h2 className="font-semibold">Account Settings</h2>
          <div className="mt-4 flex gap-3">
            <Button variant="outline">Edit Profile</Button>
            <Button variant="outline">Change Password</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
