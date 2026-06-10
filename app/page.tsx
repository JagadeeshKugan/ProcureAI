"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Boxes,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Loader2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

const highlights = [
  {
    icon: Sparkles,
    title: "AI-powered sourcing",
    desc: "Generate RFQs and compare supplier quotes in seconds.",
  },
  {
    icon: TrendingUp,
    title: "Smarter decisions",
    desc: "Surface the best vendor by price, risk, and lead time.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-grade",
    desc: "SOC 2 Type II, SSO, and granular approval controls.",
  },
]

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => router.push("/dashboard"), 900)
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Branding panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute -right-24 top-1/3 size-96 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-primary-foreground/15 backdrop-blur">
            <Boxes className="size-6" />
          </div>
          <span className="text-lg font-semibold">ProcureAI</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-balance text-4xl font-semibold leading-tight tracking-tight">
            Procurement, reimagined with AI.
          </h2>
          <p className="mt-4 text-pretty text-primary-foreground/80">
            Automate sourcing, compare supplier quotations, and generate
            confident procurement decisions — all in one intelligent platform.
          </p>

          <div className="mt-10 flex flex-col gap-5">
            {highlights.map((h) => (
              <div key={h.title} className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15">
                  <h.icon className="size-4" />
                </div>
                <div>
                  <p className="font-medium">{h.title}</p>
                  <p className="text-sm text-primary-foreground/70">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-6 text-sm text-primary-foreground/70">
          <span>Trusted by 1,200+ procurement teams</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Boxes className="size-5" />
            </div>
            <span className="text-lg font-semibold">ProcureAI</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your procurement workspace to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Work email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="alex.carter@acme.com"
                  defaultValue="alex.carter@acme.com"
                  required
                  autoComplete="email"
                />
              </Field>
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    href="#"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••"
                  defaultValue="demo-password"
                  required
                  autoComplete="current-password"
                />
              </Field>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : null}
                {loading ? "Signing in..." : "Sign in"}
                {!loading ? <ArrowRight data-icon="inline-end" /> : null}
              </Button>
            </FieldGroup>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="mt-6 w-full">
            <ShieldCheck data-icon="inline-start" />
            Continue with SSO
          </Button>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="#" className="font-medium text-primary hover:underline">
              Request access
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
