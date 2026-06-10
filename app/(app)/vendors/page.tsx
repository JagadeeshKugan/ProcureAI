"use client"

import { useState } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { vendors, formatCurrency } from "@/lib/data"
import { MapPin, Plus, Search, Sparkles, Star } from "lucide-react"

const categories = [
  "all",
  "IT Hardware",
  "Networking",
  "Office Furniture",
  "Software Licenses",
  "Manufacturing",
]

export default function VendorsPage() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [sort, setSort] = useState("ai")

  const filtered = vendors
    .filter((v) => {
      const matchesQuery = v.name.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = category === "all" || v.category === category
      return matchesQuery && matchesCategory
    })
    .sort((a, b) => {
      if (sort === "ai") return b.aiScore - a.aiScore
      if (sort === "spend") return b.spend - a.spend
      if (sort === "rating") return b.rating - a.rating
      return 0
    })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Vendor Management"
        description="Evaluate, compare, and manage your supplier network with AI scoring."
      >
        <Button>
          <Plus data-icon="inline-start" />
          Add Vendor
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <InputGroup className="lg:max-w-xs">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search vendors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "all" ? "All categories" : c}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <ToggleGroup
            type="single"
            value={sort}
            onValueChange={(v) => v && setSort(v)}
            variant="outline"
          >
            <ToggleGroupItem value="ai">AI Score</ToggleGroupItem>
            <ToggleGroupItem value="spend">Spend</ToggleGroupItem>
            <ToggleGroupItem value="rating">Rating</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((vendor) => (
          <Link key={vendor.id} href={`/vendors/${vendor.id}`}>
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-11 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                        {vendor.name
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold leading-tight">{vendor.name}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" />
                        {vendor.location}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={vendor.status} />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{vendor.category}</Badge>
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    {vendor.rating}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Sparkles className="size-3 text-primary" />
                      AI Match Score
                    </span>
                    <span className="font-semibold text-primary">{vendor.aiScore}</span>
                  </div>
                  <Progress value={vendor.aiScore} />
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">
                      {formatCurrency(vendor.spend, true)}
                    </span>
                    <span className="text-xs text-muted-foreground">Spend</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{vendor.onTimeDelivery}%</span>
                    <span className="text-xs text-muted-foreground">On-time</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{vendor.leadTime}</span>
                    <span className="text-xs text-muted-foreground">Lead time</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
