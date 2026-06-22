"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useUser } from "@clerk/nextjs"

export default function HomePage() {
  const router = useRouter()
  const { isLoaded, user } = useUser()

  useEffect(() => {
    if (isLoaded) {
      if (user) {
        // Get user role from metadata
        console.log({user})
        const userRole = user.publicMetadata?.role || "employee"

        // Route based on role
        if (userRole === "vendor") {
          router.push("/vendor/dashboard")
        } else {
          router.push("/dashboard")
        }
      } else {
        // User is not authenticated, redirect to sign-in
        router.push("/sign-in")
      }
    }
  }, [isLoaded, user, router])

  // Show loading state while checking authentication
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent mx-auto"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

