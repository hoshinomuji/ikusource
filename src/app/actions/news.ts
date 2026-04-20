"use server"

import { getSessionUserIdValue } from "@/lib/session"
import { db } from "@/db"
import { news, users } from "@/db/schema"
import { desc, eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { broadcastNews } from "@/lib/email-service"
import { hasDatabaseConnectionConfig } from "@/db/config"
function isDatabaseUnavailableError(error: unknown) {
    const errorCode = (error as any)?.code || (error as any)?.cause?.code
    const errorMessage = String((error as any)?.message || (error as any)?.cause?.message || "")
    return (
        errorCode === "ECONNREFUSED" ||
        errorCode === "42P01" ||
        errorMessage.includes("relation") && errorMessage.includes("does not exist") ||
        !hasDatabaseConnectionConfig() ||
        process.env.NETLIFY
    )
}

// Check if user is admin
async function checkAdmin() {
    const cookieStore = await cookies()
    const userId = await getSessionUserIdValue(cookieStore)

    if (!userId) {
        return { isAdmin: false, error: "Not authenticated" }
    }

    const user = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, parseInt(userId)))
        .limit(1)

    if (!user || user.length === 0 || user[0].role !== "admin") {
        return { isAdmin: false, error: "Not authorized" }
    }

    return { isAdmin: true }
}

export async function getNewsList(limit = 10) {
    try {
        return await db.select().from(news).orderBy(desc(news.publishedAt)).limit(limit)
    } catch (error) {
        if (isDatabaseUnavailableError(error)) {
            console.warn("Database connection unavailable - returning empty news list")
            return []
        }
        throw error
    }
}

export async function getAllNews() {
    try {
        return await db.select().from(news).orderBy(desc(news.publishedAt))
    } catch (error) {
        if (isDatabaseUnavailableError(error)) {
            console.warn("Database connection unavailable - returning empty news array")
            return []
        }
        throw error
    }
}

export async function createNews(data: { title: string, content: string, type: string, sendEmail: boolean }) {
    const adminCheck = await checkAdmin()
    if (!adminCheck.isAdmin) {
        return { success: false, error: adminCheck.error }
    }

    try {
        const [newNews] = await db.insert(news).values({
            title: data.title,
            content: data.content,
            type: data.type as any,
            sendEmail: data.sendEmail,
        }).returning();

        revalidatePath("/")
        revalidatePath("/dashboard")

        // Trigger email broadcast if requested
        if (data.sendEmail) {
            // Run in background (sort of - Next.js actions might wait, but for now we wait to ensure it works)
            // Ideally we should use a queue, but for small scale await is fine.
            // Or use setImmediate?
            // "fire and forget" is risky in serverless, but we can await it.
            try {
                await broadcastNews({
                    id: newNews.id,
                    title: newNews.title,
                    content: newNews.content,
                    type: newNews.type
                });
            } catch (e) {
                console.error("Failed to broadcast news:", e);
                // Don't fail the request, just log it.
            }
        }

        return { success: true }
    } catch (error) {
        console.error("Error creating news:", error)
        return { success: false, error: "Failed to create news" }
    }
}

export async function updateNews(id: number, data: { title: string, content: string, type: string }) {
    const adminCheck = await checkAdmin()
    if (!adminCheck.isAdmin) {
        return { success: false, error: adminCheck.error }
    }

    try {
        await db.update(news)
            .set({
                title: data.title,
                content: data.content,
                type: data.type as any,
                updatedAt: new Date()
            })
            .where(eq(news.id, id));

        revalidatePath("/")
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        console.error("Error updating news:", error)
        return { success: false, error: "Failed to update news" }
    }
}

export async function deleteNews(id: number) {
    const adminCheck = await checkAdmin()
    if (!adminCheck.isAdmin) {
        return { success: false, error: adminCheck.error }
    }

    try {
        await db.delete(news).where(eq(news.id, id));
        revalidatePath("/")
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        console.error("Error deleting news:", error)
        return { success: false, error: "Failed to delete news" }
    }
}
