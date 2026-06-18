"use client"

import { useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { syncClerkUserToDatabase } from "@/actions/clerk-sync.actions"

/**
 * Component that synchronizes Clerk user and organization on mount
 * Runs once per session when user is authenticated
 */
export function ClerkSyncInit() {
  const { userId, isLoaded } = useAuth()

  useEffect(() => {
    if (!isLoaded || !userId) {
      return
    }

    // Sync user to database on first load
    const syncUser = async () => {
      try {
        const result = await syncClerkUserToDatabase()
        if (!result.success) {
          console.warn("[ClerkSyncInit] Sync warning:", result.error)
        }
      } catch (error) {
        console.error("[ClerkSyncInit] Sync error:", error)
      }
    }

    syncUser()
  }, [userId, isLoaded])

  return null // This component doesn't render anything
}
