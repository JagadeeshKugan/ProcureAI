"use client"

import { useEffect, useState } from "react"
import { Bell, X } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/actions/notifications.actions"

interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message?: string
  read: string
  actionUrl?: string
  createdAt: Date
}

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  // Load notifications when popover opens
  useEffect(() => {
    if (!isOpen) return

    const loadNotifications = async () => {
      setIsLoading(true)
      try {
        const result = await getNotifications(10)
        if (result.success) {
          setNotifications(result.notifications as Notification[])
          setUnreadCount(result.unreadCount || 0)
        }
      } catch (error) {
        console.error("Failed to load notifications:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadNotifications()
  }, [isOpen])

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId)
    setNotifications(
      notifications.map((n) =>
        n.id === notificationId ? { ...n, read: "true" } : n
      )
    )
    setUnreadCount(Math.max(0, unreadCount - 1))
  }

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead()
    setNotifications(
      notifications.map((n) => ({ ...n, read: "true" }))
    )
    setUnreadCount(0)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "approval_request":
        return "🔔"
      case "approval_approved":
        return "✅"
      case "approval_rejected":
        return "❌"
      case "request_submitted":
        return "📤"
      default:
        return "📢"
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger render={
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute top-0 right-0 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>}/>
      <PopoverContent className="w-80 p-0">
        <div className="flex items-center justify-between p-4">
          <h2 className="font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Mark all as read
            </button>
          )}
        </div>

        <Separator />

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-accent transition-colors cursor-pointer flex gap-2 ${
                    notification.read === "false" ? "bg-blue-50 dark:bg-blue-950/20" : ""
                  }`}
                >
                  <span className="text-lg shrink-0">
                    {getNotificationIcon(notification.type)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={notification.actionUrl || "/"}
                      onClick={() => {
                        if (notification.read === "false") {
                          handleMarkAsRead(notification.id)
                        }
                        setIsOpen(false)
                      }}
                      className="block"
                    >
                      <p className="text-sm font-medium truncate hover:underline">
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </Link>
                  </div>

                  {notification.read === "false" && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="shrink-0 h-2 w-2 rounded-full bg-blue-500 hover:bg-blue-600 mt-1"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Link href="/notifications">
                <Button variant="ghost" className="w-full text-xs">
                  View all notifications
                </Button>
              </Link>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
