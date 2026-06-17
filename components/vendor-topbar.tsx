"use client"

import { useUser } from "@clerk/nextjs"
import { Separator } from "@/components/ui/separator"

export function VendorTopbar() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) return null

  const companyName = user?.organizationMemberships?.[0]?.organization?.name || "Vendor Company"

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex flex-1 items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{companyName}</h1>
        </div>
      </div>
    </header>
  )
}
