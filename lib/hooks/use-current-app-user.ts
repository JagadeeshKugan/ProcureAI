"use client"

import { useEffect, useState } from "react"
import { syncCurrentUser } from "@/actions/sync-user.actions"
import type { SelectUser } from "@/db/schema"

interface UseCurrentAppUserReturn {
  user: SelectUser | null
  loading: boolean
  error: string | null
  role: string | null
  status: string | null
}

export function useCurrentAppUser(): UseCurrentAppUserReturn {
  const [user, setUser] = useState<SelectUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const syncUser = async () => {
      try {
        setLoading(true)
        const result = await syncCurrentUser()

        if (result.success && result.user) {
          setUser(result.user)
          setError(null)
        } else {
          setError(result.error || "Failed to sync user")
          setUser(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    syncUser()
  }, [])

  return {
    user,
    loading,
    error,
    role: user?.role || null,
    status: user?.status || null,
  }
}
