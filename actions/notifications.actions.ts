"use server"

import { auth } from "@clerk/nextjs/server"
import { getDb, schema } from "@/db"
import { eq, and, desc } from "drizzle-orm"
import { UserRepository } from "@/repositories/user.repository"

export async function getNotifications(limit: number = 10) {
  const { userId } = await auth()

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized",
      notifications: [],
    }
  }

  try {
    const db = getDb()
    const userRepo = new UserRepository()
    const user = await userRepo.findByClerkId(userId)

    if (!user?.id) {
      return {
        success: false,
        error: "User not found",
        notifications: [],
      }
    }

    const notifications = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, user.id))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit)

    const unreadCount = notifications.filter((n) => n.read === "false").length

    return {
      success: true,
      notifications,
      unreadCount,
    }
  } catch (error) {
    console.error("[getNotifications] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch notifications",
      notifications: [],
    }
  }
}

export async function markNotificationAsRead(notificationId: string) {
  const { userId } = await auth()

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized",
    }
  }

  try {
    const db = getDb()
    const userRepo = new UserRepository()
    const user = await userRepo.findByClerkId(userId)

    if (!user?.id) {
      return {
        success: false,
        error: "User not found",
      }
    }

    await db
      .update(schema.notifications)
      .set({
        read: "true",
      })
      .where(
        and(
          eq(schema.notifications.id, notificationId),
          eq(schema.notifications.userId, user.id)
        )
      )

    return {
      success: true,
    }
  } catch (error) {
    console.error("[markNotificationAsRead] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark notification as read",
    }
  }
}

export async function markAllNotificationsAsRead() {
  const { userId } = await auth()

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized",
    }
  }

  try {
    const db = getDb()
    const userRepo = new UserRepository()
    const user = await userRepo.findByClerkId(userId)

    if (!user?.id) {
      return {
        success: false,
        error: "User not found",
      }
    }

    await db
      .update(schema.notifications)
      .set({
        read: "true",
      })
      .where(eq(schema.notifications.userId, user.id))

    return {
      success: true,
    }
  } catch (error) {
    console.error("[markAllNotificationsAsRead] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark notifications as read",
    }
  }
}
