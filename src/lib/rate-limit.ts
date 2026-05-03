import { db } from "@/db"
import { rateLimitLogs } from "@/db/schema"
import { eq, gt } from "drizzle-orm"

interface RateLimitConfig {
    interval?: number // Interval in milliseconds
    limit?: number // Max number of requests per interval
}

export function rateLimit(options: RateLimitConfig = {}) {
    const interval = options.interval || 60000 // Default 1 minute
    const limit = options.limit || 5 // Default 5 requests

    return {
        check: async (token: string): Promise<void> => {
            const now = new Date()
            const windowStart = new Date(now.getTime() - interval)

            // Query database for recent requests
            const recentRequests = await db
                .select()
                .from(rateLimitLogs)
                .where(
                    eq(rateLimitLogs.token, token) &&
                    gt(rateLimitLogs.createdAt, windowStart)
                )

            if (recentRequests.length >= limit) {
                throw new Error("Rate limit exceeded")
            }

            // Log this request
            await db.insert(rateLimitLogs).values({
                token,
                createdAt: now,
            })

            // Clean up old entries (older than 24 hours)
            const cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
            await db
                .delete(rateLimitLogs)
                .where(rateLimitLogs.createdAt < cutoffTime)
        },
    }
}
