"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { getRFQWithQuotations } from "@/actions/rfq-fetch.actions"
import { awardVendor } from "@/actions/award-vendor.actions"
import {
  ArrowLeft,
  Award,
  Check,
  Clock,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  X,
  Loader2,
} from "lucide-react"

function formatCurrency(value: string | number) {
  const num = typeof value === "string" ? parseFloat(value) : value
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num)
}

interface Quotation {
  id: string
  vendorId: string
  vendorName: string | null
  vendorEmail: string | null
  price: string
  deliveryDays: number
  warranty: string | null
  notes: string | null
  status: string | null
  submittedAt: Date
}

interface RFQDetail {
  id: string
  rfqNumber: string
  title: string
  description: string | null
  status: string | null
  createdAt: Date
}

function scoreQuote(q: Quotation, all: Quotation[]) {
  const priceNum = parseFloat(q.price)
  const minPrice = Math.min(...all.map((x) => parseFloat(x.price)))
  const minDelivery = Math.min(...all.map((x) => x.deliveryDays))
  const priceScore = (minPrice / priceNum) * 50
  const deliveryScore = (minDelivery / q.deliveryDays) * 30
  const warrantyScore = q.warranty ? 20 : 10
  return Math.round(priceScore + deliveryScore + warrantyScore)
}

export default function QuoteComparisonPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { orgRole } = useAuth()
  const [rfq, setRfq] = useState<RFQDetail | null>(null)
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [awardingVendorId, setAwardingVendorId] = useState<string | null>(null)
  const [isAwarding, setIsAwarding] = useState(false)

  const isAuthorized = orgRole && ["org:admin", "org:procurement_manager"].includes(orgRole)
  const canAward = isAuthorized && rfq && rfq.status !== "awarded" && rfq.status !== "closed"

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getRFQWithQuotations(id)
        if (result.success && result.data) {
          setRfq(result.data.rfq as RFQDetail)
          setQuotations((result.data.quotations || []) as Quotation[])
        } else {
          toast.error(result.error || "Failed to load RFQ")
        }
      } catch (error) {
        console.error("[QuoteComparisonPage] Error:", error)
        toast.error("Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleAwardVendor = async (vendorId: string) => {
    if (!isAuthorized) {
      toast.error("Unauthorized: Only admins and procurement managers can award vendors")
      return
    }

    if (!canAward) {
      toast.error(`Cannot award vendor: RFQ status is ${rfq?.status || "unknown"}`)
      return
    }

    setIsAwarding(true)
    setAwardingVendorId(vendorId)

    try {
      const result = await awardVendor(id, vendorId)
      if (result.success) {
        toast.success(result.message || "Vendor awarded successfully!")
        // Reload data
        const reloadResult = await getRFQWithQuotations(id)
        if (reloadResult.success && reloadResult.data) {
          setRfq(reloadResult.data.rfq as RFQDetail)
          setQuotations((reloadResult.data.quotations || []) as Quotation[])
        }
      } else {
        toast.error(result.error || "Failed to award vendor")
      }
    } catch (error) {
      console.error("[handleAwardVendor] Error:", error)
      toast.error("An error occurred while awarding the vendor")
    } finally {
      setIsAwarding(false)
      setAwardingVendorId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!rfq || quotations.length === 0) {
    return notFound()
  }

  const scored = quotations
    .map((q) => ({ ...q, score: scoreQuote(q, quotations) }))
    .sort((a, b) => b.score - a.score)

  const recommended = scored[0]
  const lowestPrice = [...quotations].sort((a, b) => parseFloat(a.price) - parseFloat(b.price))[0]
  const fastest = [...quotations].sort((a, b) => a.deliveryDays - b.deliveryDays)[0]

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        render={<Link href="/rfq" />}
        nativeButton={false}
      >
        <ArrowLeft data-icon="inline-start" />
        Back to RFQs
      </Button>

      <PageHeader title={rfq.title} description={`${rfq.rfqNumber} · ${quotations.length} quotes received`} />

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
                    <span className="font-medium text-foreground">{recommended.vendorName || "Vendor"}</span>{" "}
                    offers the best overall value — {formatCurrency(recommended.price)} with{" "}
                    {recommended.deliveryDays}-day delivery{recommended.warranty ? ` and ${recommended.warranty} warranty` : ""}.
                    It balances the lowest effective cost against reliable lead time
                    and quality assurance.
                  </p>
                </div>
              </div>
            <Button
              onClick={() => handleAwardVendor(recommended.vendorId)}
              disabled={!canAward || isAwarding || awardingVendorId === recommended.vendorId}
              className="gap-2"
            >
              {isAwarding && awardingVendorId === recommended.vendorId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Awarding...
                </>
              ) : rfq?.status === "awarded" ? (
                <>
                  <Check className="h-4 w-4" />
                  Awarded
                </>
              ) : (
                <>
                  <Award className="h-4 w-4" />
                  Award Vendor
                </>
              )}
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
              <span className="text-sm font-semibold">{lowestPrice.vendorName || "Vendor"}</span>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(lowestPrice.price)}
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
              <span className="text-sm font-semibold">{fastest.vendorName || "Vendor"}</span>
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
              <span className="text-xs text-muted-foreground">Total Quotes Received</span>
              <span className="text-sm font-semibold">{quotations.length}</span>
              <span className="text-xs text-muted-foreground">responses from vendors</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {scored.map((quote, index) => {
          const isRecommended = quote.vendorName === recommended.vendorName
          return (
            <Card
              key={quote.id}
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
                  <CardTitle className="text-base">{quote.vendorName || "Vendor"}</CardTitle>
                  <span className="text-sm font-semibold text-primary">{quote.score}</span>
                </div>
                <CardDescription>Rank #{index + 1} by AI value score</CardDescription>
                <Progress value={Math.min(quote.score, 100)} className="mt-1" />
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-2xl font-semibold tracking-tight">
                    {formatCurrency(quote.price)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    total quote price
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
                    <dd className="font-medium">{quote.warranty || "Not specified"}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="font-medium capitalize">{quote.status || "submitted"}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Submitted</dt>
                    <dd className="text-xs">
                      {new Date(quote.submittedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </dd>
                  </div>
                </dl>

                <div className="mt-auto flex flex-col gap-2 pt-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {parseFloat(quote.price) === parseFloat(lowestPrice.price) ? (
                      <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <X className="size-3.5 text-muted-foreground/50" />
                    )}
                    Lowest price
                  </div>
                  <Button
                    variant={isRecommended ? "default" : "outline"}
                    className="w-full gap-2"
                    onClick={() => handleAwardVendor(quote.vendorId)}
                    disabled={!canAward || isAwarding || awardingVendorId === quote.vendorId}
                  >
                    {isAwarding && awardingVendorId === quote.vendorId ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Awarding...
                      </>
                    ) : rfq?.status === "awarded" ? (
                      <>
                        <Check className="h-4 w-4" />
                        Awarded
                      </>
                    ) : (
                      <>
                        <Award className="h-4 w-4" />
                        Award Vendor
                      </>
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
