"use client"

import { useUser } from "@clerk/nextjs"
import { Separator } from "@/components/ui/separator"
import { useEffect, useState } from "react"
import { getVendorCompany, syncUserToDatabase } from "@/lib/auth/server"

export function VendorTopbar() {
  const { user, isLoaded } = useUser()
  const [companyName, setCompanyName] = useState("Vendor Company")

    useEffect(() => {
      getVendorCompany().then((name) => {
        if (name) setCompanyName(name)
      })
    }, [])
    
    useEffect(() => {
    if (isLoaded && user) {
      syncUserToDatabase().catch((error) => {
        console.error("[Topbar] Failed to sync user:", error)
      })
    }
  }, [isLoaded, user])

  if (!isLoaded) return null

 

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
