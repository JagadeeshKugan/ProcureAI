"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Bell, Moon, Sun, LogOut, User, Settings } from "lucide-react"
import { useTheme } from "next-themes"
import { useUser, useClerk } from "@clerk/nextjs"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CommandPalette } from "@/components/command-palette"
import { syncUserToDatabase } from "@/src/lib/auth/server"

const labels: Record<string, string> = {
  dashboard: "Dashboard",
  requests: "Purchase Requests",
  vendors: "Vendors",
  rfq: "RFQ Management",
  compare: "Quote Comparison",
  orders: "Purchase Orders",
  copilot: "Procurement Copilot",
}

const notifications = [
  {
    title: "AI recommendation ready",
    desc: "Lenovo recommended for RFQ-2026-0142",
    time: "12m",
  },
  {
    title: "RFQ closing soon",
    desc: "RFQ-2026-0142 closes in 2 days",
    time: "1h",
  },
  {
    title: "Approval requested",
    desc: "Marcus Webb · Adobe Creative Cloud",
    time: "3h",
  },
]

export function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { setTheme, resolvedTheme } = useTheme()
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const [cmdOpen, setCmdOpen] = React.useState(false)
  const [logoutOpen, setLogoutOpen] = React.useState(false)

  // Sync user to database on mount
  useEffect(() => {
    if (isLoaded && user) {
      syncUserToDatabase().catch((error) => {
        console.error("[Topbar] Failed to sync user:", error)
      })
    }
  }, [isLoaded, user])

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCmdOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleLogout = async () => {
    setLogoutOpen(false)
    await signOut()
    router.push("/sign-in")
  }

  const segments = pathname.split("/").filter(Boolean)

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-5" />
      <Breadcrumb className="hidden md:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/dashboard" />}>
              ProcureAI
            </BreadcrumbLink>
          </BreadcrumbItem>
          {segments.map((seg, i) => (
            <React.Fragment key={seg}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {i === segments.length - 1 ? (
                  <BreadcrumbPage>{labels[seg] ?? seg}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={`/${seg}`} />}>
                    {labels[seg] ?? seg}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          className="hidden h-9 w-56 justify-start gap-2 px-3 text-muted-foreground sm:flex"
          onClick={() => setCmdOpen(true)}
        >
          <Search className="size-4" />
          <span className="text-sm">Search...</span>
          <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            ⌘K
          </kbd>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="sm:hidden"
          onClick={() => setCmdOpen(true)}
          aria-label="Search"
        >
          <Search className="size-4" />
        </Button>

        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" size="icon" className="relative" aria-label="Notifications">
                <Bell className="size-4" />
                <span className="absolute -right-0.5 -top-0.5 flex size-2.5 items-center justify-center">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
              </Button>
            }
          />
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-sm font-semibold">Notifications</span>
              <Badge variant="secondary">3 new</Badge>
            </div>
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div
                  key={n.title}
                  className="flex items-start gap-3 border-b px-4 py-3 last:border-0 hover:bg-muted/50"
                >
                  <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-tight">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.desc}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{n.time}</span>
                </div>
              ))}
            </div>
            <div className="p-2">
              <Button variant="ghost" className="w-full text-sm">
                View all notifications
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="size-4 dark:hidden" />
          <Moon className="hidden size-4 dark:block" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="h-9 gap-2 px-1.5">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                    {user?.firstName?.charAt(0) || "U"}
                    {user?.lastName?.charAt(0) || ""}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium lg:inline">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.emailAddresses[0]?.emailAddress || "User"}
                </span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.emailAddresses[0]?.emailAddress || "User"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {(user?.unsafeMetadata?.role as string) || "buyer"}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLogoutOpen(true)}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Sign Out</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to sign out? You&apos;ll need to sign in again to access ProcureAI.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sign Out
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  )
}
