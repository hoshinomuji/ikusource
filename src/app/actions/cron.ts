"use server"

import { db } from "@/db"
import { services, users } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { sendExpirationWarningEmail } from "@/lib/email-service"

export async function verifyAndSendExpirationWarnings() {
    console.log("Starting expiration warning check...")

    // Check for services expiring in 7, 3, and 1 days
    const warningDays = [7, 3, 1]
    let sentCount = 0
    let errorCount = 0

    for (const days of warningDays) {
        try {
            // Calculate target date (ignoring time)
            const targetDate = new Date()
            targetDate.setDate(targetDate.getDate() + days)
            const targetDateStr = targetDate.toISOString().split('T')[0]

            // Find services
            // Note: This matches services expiring on the EXACT day. 
            // In production, might want to check for ranges to avoid missing if cron fails one day.
            const expiringServices = await db
                .select({
                    id: services.id,
                    name: services.name,
                    userId: services.userId,
                    nextDueDate: services.nextDueDate
                })
                .from(services)
                .where(and(
                    eq(services.status, "active"),
                    sql`DATE(${services.nextDueDate}) = DATE(${targetDateStr})`
                ))

            console.log(`Found ${expiringServices.length} services expiring in ${days} days`)

            for (const service of expiringServices) {
                if (!service.nextDueDate) continue

                try {
                    const result = await sendExpirationWarningEmail(
                        service.userId,
                        service.name,
                        days,
                        service.nextDueDate
                    )

                    if (result.success) {
                        sentCount++
                        console.log(`Sent quote warning for service ${service.id}`)
                    } else if ('reason' in result && result.reason === "opted-out") {
                        console.log(`User opted out for service ${service.id}`)
                    } else {
                        errorCount++
                        const errorMessage = 'error' in result ? result.error : "Unknown error"
                        console.error(`Failed to send warning for service ${service.id}:`, errorMessage)
                    }
                } catch (innerError) {
                    errorCount++
                    console.error(`Error processing service ${service.id}:`, innerError)
                }
            }

        } catch (error) {
            console.error(`Error checking ${days} days expiration:`, error)
        }
    }

    return {
        success: true,
        sentCount,
        errorCount,
        message: `Processed expiration warnings. Sent: ${sentCount}, Errors: ${errorCount}`
    }
}
