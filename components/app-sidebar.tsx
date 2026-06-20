"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import {
  LayoutDashboard,
  FileText,
  Building2,
  FileSpreadsheet,
  GitCompareArrows,
  Sparkles,
  ScrollText,
  Boxes,
  BarChart3,
  PlusCircle,
  CheckCircle2,
  DollarSign,
  ClipboardList,
  ShoppingCart,
  History,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const roleBasedNav: Record<string, Array<{ title: string; href: string; icon: any }>> = {
  "org:approver": [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Approvals", href: "/approvals", icon: CheckCircle2 },
    { title: "All Requests", href: "/requests", icon: FileText },
    { title: "RFQ Management", href: "/rfq", icon: FileSpreadsheet },
    { title: "Vendors", href: "/vendors", icon: Building2 },
  ],
  'org:admin': [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Approvals", href: "/approvals", icon: CheckCircle2 },
    { title: "All Requests", href: "/requests", icon: FileText },
    { title: "Finance", href: "/finance", icon: DollarSign },
    { title: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart },
    { title: "RFQ Management", href: "/rfq", icon: FileSpreadsheet },
    { title: "Vendors", href: "/vendors", icon: Building2 },
    { title: "Audit Logs", href: "/audit", icon: History },
  ],
  'org:buyer': [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "My Requests", href: "/department", icon: PlusCircle },
    { title: "Request History", href: "/requests", icon: FileText },
  ],
  'org:requester': [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "My Requests", href: "/department", icon: PlusCircle },
    { title: "Request History", href: "/requests", icon: FileText },
  ],
  'org:procurement_manager': [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Approvals", href: "/approvals", icon: CheckCircle2 },
    { title: "All Requests", href: "/requests", icon: FileText },
    { title: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart },
    { title: "RFQ Management", href: "/rfq", icon: FileSpreadsheet },
    { title: "Vendors", href: "/vendors", icon: Building2 },
  ],
}

const aiNav = [{ title: "Procurement Copilot", href: "/copilot", icon: Sparkles }]

export function AppSidebar() {
  const pathname = usePathname()
  const {
  userId,
  sessionId,
  orgId,
  orgRole,
  isSignedIn,
} = useAuth()

  
  const navItems = orgRole && roleBasedNav[orgRole] ? roleBasedNav[orgRole] : []

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-1.5 py-1.5">
          <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Boxes className="size-5" />
          </div>
          <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold">ProcureAI</span>
            <span className="truncate text-xs text-muted-foreground">
              Enterprise Suite
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={active}
                      tooltip={item.title}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Intelligence</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {aiNav.map((item) => {
                const active = pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={active}
                      tooltip={item.title}
                      className={cn(
                        !active &&
                          "bg-gradient-to-r from-primary/10 to-accent/40",
                      )}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="rounded-lg border bg-card p-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Sparkles className="size-3.5 text-primary" />
            AI Credits
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            8,420 of 10,000 used this month
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[84%] rounded-full bg-primary" />
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/profile" />}
              isActive={pathname === "/profile"}
              tooltip="Profile"
            >
              <BarChart3 />
              <span>Profile</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
