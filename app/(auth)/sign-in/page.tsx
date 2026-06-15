"use client"

import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Sign In</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome back to ProcureAI
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border-none bg-transparent p-0",
              formFieldInput: "rounded-lg border border-border bg-background",
              formButtonPrimary:
                "rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground",
              footerActionLink: "text-primary hover:underline",
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
  )
}

