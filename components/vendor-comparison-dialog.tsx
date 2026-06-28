import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Sparkles, AlertCircle } from "lucide-react"

interface VendorScore {
  vendor: string
  score: number
}

interface ComparisonResult {
  recommendedVendor: string
  summary: string
  reason: string
  vendorScores: VendorScore[]
}

interface VendorComparisonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  result: ComparisonResult | null
  isLoading: boolean
}

export function VendorComparisonDialog({
  open,
  onOpenChange,
  title,
  result,
  isLoading,
}: VendorComparisonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Vendor Comparison Analysis
          </DialogTitle>
          <DialogDescription>AI-powered recommendation for {title}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-8">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
            <div className="h-4 bg-muted rounded animate-pulse w-4/6" />
          </div>
        ) : result ? (
          <div className="space-y-6">
            {/* Recommended Vendor Card */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg text-green-900">
                  Recommended Vendor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold text-green-700">
                  {result.recommendedVendor}
                </div>
                <p className="text-sm text-green-700">
                  {result.summary}
                </p>
              </CardContent>
            </Card>

            {/* Why This Vendor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Why This Vendor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {result.reason}
                </p>
              </CardContent>
            </Card>

            {/* Vendor Scores */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vendor Scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.vendorScores.map((score) => (
                  <div key={score.vendor} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {score.vendor}
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        {score.score}/100
                      </span>
                    </div>
                    <Progress value={score.score} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <div className="flex gap-2 rounded-md bg-amber-50 p-3 border border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                AI recommendations assist decision making. Final approval remains
                with procurement.
              </p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
