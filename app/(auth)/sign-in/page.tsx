"use client"

import { SignIn } from "@clerk/nextjs"
import { useEffect } from "react"
import { syncUserToDatabase } from "@/lib/auth/server"

export default function SignInPage() {
  useEffect(() => {
    // Sync user after successful authentication
    const syncUser = async () => {
      try {
        await syncUserToDatabase()
      } catch (error) {
        console.error("Failed to sync user:", error)
      }
    }

    // Sync user on mount if already authenticated
    syncUser()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground">ProcureAI</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            AI-Powered Procurement Platform
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card shadow-lg">
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-none bg-transparent",
              },
            }}
          />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <a href="/sign-up" className="font-semibold text-primary hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}
