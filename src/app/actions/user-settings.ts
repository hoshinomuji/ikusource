"use server"

import { getSessionUserIdValue } from "@/lib/session"
import { db } from "@/db"
import { userNotificationSettings } from "@/db/schema"
import { eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function getUserNotificationSettings() {
    try {
        const cookieStore = await cookies()
        const userId = await getSessionUserIdValue(cookieStore)

        if (!userId) {
            return { success: false, error: "Unauthorized" }
        }

        const userIdNum = parseInt(userId)

        const settings = await db
            .select()
            .from(userNotificationSettings)
            .where(eq(userNotificationSettings.userId, userIdNum))
            .limit(1)

        if (settings.length === 0) {
            // Return defaults if no settings found
            return {
                success: true,
                data: {
                    emailNews: true,
                    emailServiceInfo: true,
                    emailExpiration: true
                }
            }
        }

        return { success: true, data: settings[0] }
    } catch (error) {
        console.error("Error fetching notification settings:", error)
        return { success: false, error: "Failed to fetch settings" }
    }
}

export async function updateUserNotificationSettings(data: {
    emailNews: boolean
    emailServiceInfo: boolean
    emailExpiration: boolean
}) {
    try {
        const cookieStore = await cookies()
        const userId = await getSessionUserIdValue(cookieStore)

        if (!userId) {
            return { success: false, error: "Unauthorized" }
        }

        const userIdNum = parseInt(userId)

        // Check if settings exist
        const existing = await db
            .select()
            .from(userNotificationSettings)
            .where(eq(userNotificationSettings.userId, userIdNum))
            .limit(1)

        if (existing.length === 0) {
            // Create new
            await db.insert(userNotificationSettings).values({
                userId: userIdNum,
                emailNews: data.emailNews,
                emailServiceInfo: data.emailServiceInfo,
                emailExpiration: data.emailExpiration,
            })
        } else {
            // Update existing
            await db.update(userNotificationSettings)
                .set({
                    emailNews: data.emailNews,
                    emailServiceInfo: data.emailServiceInfo,
                    emailExpiration: data.emailExpiration,
                    updatedAt: new Date(),
                })
                .where(eq(userNotificationSettings.userId, userIdNum))
        }

        revalidatePath("/dashboard/profile")
        return { success: true }
    } catch (error) {
        console.error("Error updating notification settings:", error)
        return { success: false, error: "Failed to update settings" }
    }
}
