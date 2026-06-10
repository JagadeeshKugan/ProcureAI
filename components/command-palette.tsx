"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Building2,
  FileSpreadsheet,
  GitCompareArrows,
  Sparkles,
  ScrollText,
  Plus,
  Moon,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

const pages = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Purchase Requests", href: "/requests", icon: FileText },
  { title: "Vendors", href: "/vendors", icon: Building2 },
  { title: "RFQ Management", href: "/rfq", icon: FileSpreadsheet },
  { title: "Quote Comparison", href: "/compare", icon: GitCompareArrows },
  { title: "Purchase Orders", href: "/orders", icon: ScrollText },
  { title: "Procurement Copilot", href: "/copilot", icon: Sparkles },
]

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const { setTheme, resolvedTheme } = useTheme()

  const go = React.useCallback(
    (href: string) => {
      onOpenChange(false)
      router.push(href)
    },
    [onOpenChange, router],
  )

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, actions, vendors..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {pages.map((page) => (
            <CommandItem
              key={page.href}
              value={page.title}
              onSelect={() => go(page.href)}
            >
              <page.icon />
              {page.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          <CommandItem value="create request" onSelect={() => go("/requests")}>
            <Plus />
            Create Purchase Request
          </CommandItem>
          <CommandItem value="generate rfq" onSelect={() => go("/rfq")}>
            <FileSpreadsheet />
            Generate RFQ
          </CommandItem>
          <CommandItem value="compare quotes" onSelect={() => go("/compare")}>
            <GitCompareArrows />
            Compare Quotes
          </CommandItem>
          <CommandItem value="ask copilot" onSelect={() => go("/copilot")}>
            <Sparkles />
            Ask Procurement Copilot
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Preferences">
          <CommandItem
            value="toggle theme"
            onSelect={() => {
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
              onOpenChange(false)
            }}
          >
            {resolvedTheme === "dark" ? <Sun /> : <Moon />}
            Toggle theme
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
