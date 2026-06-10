"use client"

import { use, useState } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { rfqs, quoteComparison, formatCurrency, type QuoteLine } from "@/lib/data"
import {
  ArrowLeft,
  Award,
  Check,
  Clock,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  X,
} from "lucide-react"

function scoreQuote(q: QuoteLine, all: QuoteLine[]) {
  const minPrice = Math.min(...all.map((x) => x.totalCost))
  const minDelivery = Math.min(...all.map((x) => x.deliveryDays))
  const priceScore = (minPrice / q.totalCost) * 50
  const deliveryScore = (minDelivery / q.deliveryDays) * 30
  const riskScore = q.riskLevel === "Low" ? 20 : q.riskLevel === "Medium" ? 12 : 6
  return Math.round(priceScore + deliveryScore + riskScore)
}

const riskVariant: Record<QuoteLine["riskLevel"], "default" | "secondary" | "destructive"> = {
  Low: "secondary",
  Medium: "default",
  High: "destructive",
}

export default function QuoteComparisonPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const rfq = rfqs.find((r) => r.id === id) ?? rfqs[0]
  if (!rfq) notFound()

  const scored = quoteComparison
    .map((q) => ({ ...q, score: scoreQuote(q, quoteComparison) }))
    .sort((a, b) => b.score - a.score)

  const recommended = scored[0]
  const lowestPrice = [...quoteComparison].sort((a, b) => a.totalCost - b.totalCost)[0]
  const fastest = [...quoteComparison].sort((a, b) => a.deliveryDays - b.deliveryDays)[0]
  const [awarded, setAwarded] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link href="/rfq">
          <ArrowLeft data-icon="inline-start" />
          Back to RFQs
        </Link>
      </Button>

      <PageHeader title={rfq.title} description={`${rfq.number} · ${rfq.vendorsResponded} quotes received`} />

      <Card className="overflow-hidden border-primary/30">
        <div className="bg-primary/5 px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                <Sparkles className="size-5 text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  AI Recommendation
                  <Badge variant="secondary">{recommended.score}/100 match</Badge>
                </span>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">{recommended.vendor}</span>{" "}
                  offers the best overall value — {formatCurrency(recommended.totalCost)} total with{" "}
                  {recommended.deliveryDays}-day delivery and {recommended.riskLevel.toLowerCase()}{" "}
                  supplier risk. It balances the lowest effective cost against reliable lead time
                  and warranty coverage.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setAwarded(recommended.vendor)}
              disabled={awarded === recommended.vendor}
            >
              <Award data-icon="inline-start" />
              {awarded === recommended.vendor ? "Awarded" : "Award to " + recommended.vendor.split(" ")[0]}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingDown className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Lowest Price</span>
              <span className="text-sm font-semibold">{lowestPrice.vendor}</span>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(lowestPrice.totalCost)}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="size-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Fastest Delivery</span>
              <span className="text-sm font-semibold">{fastest.vendor}</span>
              <span className="text-xs text-muted-foreground">{fastest.deliveryDays} days</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
              <ShieldCheck className="size-5 text-accent-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Potential Savings</span>
              <span className="text-sm font-semibold">
                {formatCurrency(rfq.estimatedValue - recommended.totalCost)}
              </span>
              <span className="text-xs text-muted-foreground">vs. estimated budget</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {scored.map((quote, index) => {
          const isRecommended = quote.vendor === recommended.vendor
          const isAwarded = awarded === quote.vendor
          return (
            <Card
              key={quote.vendor}
              className={cn(
                "relative flex flex-col",
                isRecommended && "border-primary shadow-sm",
              )}
            >
              {isRecommended && (
                <Badge className="absolute -top-2.5 left-4 gap-1">
                  <Sparkles className="size-3" />
                  AI Pick
                </Badge>
              )}
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{quote.vendor}</CardTitle>
                  <span className="text-sm font-semibold text-primary">{quote.score}</span>
                </div>
                <CardDescription>Rank #{index + 1} by AI value score</CardDescription>
                <Progress value={quote.score} className="mt-1" />
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-2xl font-semibold tracking-tight">
                    {formatCurrency(quote.totalCost)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(quote.unitPrice)} per unit
                  </span>
                </div>

                <Separator />

                <dl className="flex flex-col gap-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Delivery</dt>
                    <dd className="font-medium">{quote.deliveryDays} days</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Warranty</dt>
                    <dd className="font-medium">{quote.warranty}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Payment Terms</dt>
                    <dd className="font-medium">{quote.paymentTerms}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Supplier Risk</dt>
                    <dd>
                      <Badge variant={riskVariant[quote.riskLevel]}>{quote.riskLevel}</Badge>
                    </dd>
                  </div>
                </dl>

                <div className="mt-auto flex flex-col gap-2 pt-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {quote.totalCost === lowestPrice.totalCost ? (
                      <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <X className="size-3.5 text-muted-foreground/50" />
                    )}
                    Lowest total cost
                  </div>
                  <Button
                    variant={isRecommended ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setAwarded(quote.vendor)}
                    disabled={isAwarded}
                  >
                    {isAwarded ? (
                      <>
                        <Check data-icon="inline-start" />
                        Awarded
                      </>
                    ) : (
                      "Award Contract"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
