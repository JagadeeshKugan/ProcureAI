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
  // const { setTheme, resolvedTheme } = useTheme()

  const go = React.useCallback(
    (href: string) => {
      onOpenChange(false)
      router.push(href)
    },
    [onOpenChange, router],
  )
   console.log("opened")
   if(open){
    return <div>USer search</div>
   }
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
       
          <CommandItem value="ask copilot" onSelect={() => go("/copilot")}>
            <Sparkles />
            Ask Procurement Copilot
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        
      </CommandList>
    </CommandDialog>
  )
}
