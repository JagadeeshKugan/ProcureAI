"use client"

import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground">ProcureAI</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your procurement account
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card shadow-lg">
          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-none bg-transparent",
              },
            }}
          />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/sign-in" className="font-semibold text-primary hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
