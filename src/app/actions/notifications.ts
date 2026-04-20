"use server"

import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { db } from "@/db"
import { notifications } from "@/db/schema"
import { eq, and, desc, count } from "drizzle-orm"
import { revalidatePath } from "next/cache"

/**
 * Get all notifications for the current user
 */
export async function getUserNotifications() {
    try {
        const cookieStore = await cookies()
        const userId = await getSessionUserIdValue(cookieStore)

        if (!userId) {
            return {
                success: false,
                error: "Not authenticated",
                data: [],
            }
        }

        const userIdNum = parseInt(userId)

        const userNotifications = await db
            .select()
            .from(notifications)
            .where(eq(notifications.userId, userIdNum))
            .orderBy(desc(notifications.createdAt))
            .limit(50)

        return {
            success: true,
            data: userNotifications,
        }
    } catch (error) {
        console.error("Error fetching notifications:", error)
        return {
            success: false,
            error: "Failed to fetch notifications",
            data: [],
        }
    }
}

/**
 * Get unread notifications count
 */
export async function getUnreadNotificationsCount() {
    try {
        const cookieStore = await cookies()
        const userId = await getSessionUserIdValue(cookieStore)

        if (!userId) {
            return {
                success: false,
                error: "Not authenticated",
                count: 0,
            }
        }

        const userIdNum = parseInt(userId)

        const result = await db
            .select({ count: count() })
            .from(notifications)
            .where(and(
                eq(notifications.userId, userIdNum),
                eq(notifications.isRead, false)
            ))

        return {
            success: true,
            count: result[0]?.count || 0,
        }
    } catch (error) {
        console.error("Error fetching unread count:", error)
        return {
            success: false,
            error: "Failed to fetch unread count",
            count: 0,
        }
    }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: number) {
    try {
        const cookieStore = await cookies()
        const userId = await getSessionUserIdValue(cookieStore)

        if (!userId) {
            return {
                success: false,
                error: "Not authenticated",
            }
        }

        const userIdNum = parseInt(userId)

        // Verify ownership
        const notification = await db
            .select()
            .from(notifications)
            .where(and(
                eq(notifications.id, notificationId),
                eq(notifications.userId, userIdNum)
            ))
            .limit(1)

        if (!notification || notification.length === 0) {
            return {
                success: false,
                error: "Notification not found",
            }
        }

        await db
            .update(notifications)
            .set({ isRead: true })
            .where(eq(notifications.id, notificationId))

        revalidatePath("/dashboard")
        return {
            success: true,
        }
    } catch (error) {
        console.error("Error marking notification as read:", error)
        return {
            success: false,
            error: "Failed to mark notification as read",
        }
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
    try {
        const cookieStore = await cookies()
        const userId = await getSessionUserIdValue(cookieStore)

        if (!userId) {
            return {
                success: false,
                error: "Not authenticated",
            }
        }

        const userIdNum = parseInt(userId)

        await db
            .update(notifications)
            .set({ isRead: true })
            .where(and(
                eq(notifications.userId, userIdNum),
                eq(notifications.isRead, false)
            ))

        revalidatePath("/dashboard")
        return {
            success: true,
        }
    } catch (error) {
        console.error("Error marking all notifications as read:", error)
        return {
            success: false,
            error: "Failed to mark all notifications as read",
        }
    }
}

/**
 * Create a notification
 */
export async function createNotification(data: {
    userId: number
    type: "invoice" | "service" | "ticket" | "system"
    title: string
    message: string
    link?: string
}) {
    try {
        await db.insert(notifications).values({
            userId: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            link: data.link,
            isRead: false,
        })

        revalidatePath("/dashboard")
        return {
            success: true,
        }
    } catch (error) {
        console.error("Error creating notification:", error)
        return {
            success: false,
            error: "Failed to create notification",
        }
    }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: number) {
    try {
        const cookieStore = await cookies()
        const userId = await getSessionUserIdValue(cookieStore)

        if (!userId) {
            return {
                success: false,
                error: "Not authenticated",
            }
        }

        const userIdNum = parseInt(userId)

        // Verify ownership
        const notification = await db
            .select()
            .from(notifications)
            .where(and(
                eq(notifications.id, notificationId),
                eq(notifications.userId, userIdNum)
            ))
            .limit(1)

        if (!notification || notification.length === 0) {
            return {
                success: false,
                error: "Notification not found",
            }
        }

        await db
            .delete(notifications)
            .where(eq(notifications.id, notificationId))

        revalidatePath("/dashboard")
        return {
            success: true,
        }
    } catch (error) {
        console.error("Error deleting notification:", error)
        return {
            success: false,
            error: "Failed to delete notification",
        }
    }
}

