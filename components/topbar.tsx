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
import { NotificationsPopover } from "@/components/notifications-popover"
import { useCurrentAppUser } from "@/lib/hooks/use-current-app-user"
import { syncUserToDatabase } from "@/lib/auth/server"

const labels: Record<string, string> = {
  dashboard: "Dashboard",
  requests: "Purchase Requests",
  vendors: "Vendors",
  rfq: "RFQ Management",
  compare: "Quote Comparison",
  orders: "Purchase Orders",
  copilot: "Procurement Copilot",
}

export function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { setTheme, resolvedTheme } = useTheme()
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const { user: appUser, status: userStatus, role: userRole } = useCurrentAppUser()
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

        <NotificationsPopover />

        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="size-4 dark:hidden" />
          <Moon className="hidden size-4 dark:block" />
        </Button>
              <Popover>
  <PopoverTrigger
    render={(props) => (
      <Button
        {...props}
        variant="ghost"
        className="h-9 gap-2 px-1.5"
      >
        <Avatar className="size-7">
          <AvatarFallback className="bg-primary text-xs text-primary-foreground">
            {user?.firstName?.charAt(0) || "U"}
            {user?.lastName?.charAt(0) || ""}
          </AvatarFallback>
        </Avatar>

        <span className="hidden text-sm font-medium lg:inline">
          {user?.firstName && user?.lastName
            ? `${user.firstName} ${user.lastName}`
            : user?.emailAddresses?.[0]?.emailAddress || "User"}
        </span>
      </Button>
    )}
  />

  <PopoverContent
    side="bottom"
    align="end"
    className="w-56 p-0"
  >
    <div className="border-b p-3 space-y-2">
      <div className="text-sm font-medium">
        {user?.firstName && user?.lastName
          ? `${user.firstName} ${user.lastName}`
          : user?.emailAddresses?.[0]?.emailAddress || "User"}
      </div>

      <div className="text-xs text-muted-foreground">
        {user?.emailAddresses?.[0]?.emailAddress}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {userRole ? userRole.replace(/_/g, " ") : "Role"}
        </span>
        <Badge
          variant="secondary"
          className={`text-xs h-5 ${
            userStatus === "active"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
              : userStatus === "pending"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                : userStatus === "disabled"
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"
          }`}
        >
          {userStatus || "pending"}
        </Badge>
      </div>
    </div>

    <div className="p-1">
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={() => router.push("/profile")}
      >
        <User className="mr-2 h-4 w-4" />
        Profile
      </Button>

      <Button
        variant="ghost"
        className="w-full justify-start"
      >
        <Settings className="mr-2 h-4 w-4" />
        Settings
      </Button>

      <Button
        variant="ghost"
        className="w-full justify-start text-destructive"
        onClick={() => setLogoutOpen(true)}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign out
      </Button>
    </div>
  </PopoverContent>
</Popover>
       
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
