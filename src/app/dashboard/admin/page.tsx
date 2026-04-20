import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { users, hostingOrders, pointTransactions } from "@/db/schema"
import { eq, count, sql, and, gte } from "drizzle-orm"
import { AdminOverviewClient } from "@/components/admin/admin-overview-client"
import { isRecoverableDbError } from "@/lib/db-error"

export default async function AdminPage() {
    const cookieStore = await cookies()
    const userId = await getSessionUserIdValue(cookieStore)

    if (!userId) {
        redirect("/login")
    }

    const userIdNum = parseInt(userId)

    // Check if user is admin
    let userResult: Array<{ role: string | null }> = []
    try {
        userResult = await db
            .select({
                role: users.role,
            })
            .from(users)
            .where(eq(users.id, userIdNum))
            .limit(1)
    } catch (error) {
        if (!isRecoverableDbError(error)) throw error
        console.warn("[Admin Overview] users query failed, redirecting to login")
        redirect("/login")
    }

    const user = userResult[0]

    if (!user || user.role !== "admin") {
        redirect("/dashboard")
    }

    // Get total counts
    let totalUsers = { count: 0 }
    try {
        ;[totalUsers] = await db
            .select({ count: count() })
            .from(users)
    } catch (error) {
        if (!isRecoverableDbError(error)) throw error
    }

    // Get recent users (last 5) - order by DESC to get newest first
    let recentUsers: any[] = []
    try {
        recentUsers = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
                createdAt: users.createdAt,
            })
            .from(users)
            .orderBy(sql`${users.createdAt} DESC`)
            .limit(5)
    } catch (error) {
        if (!isRecoverableDbError(error)) throw error
    }

    // Get count of services - use hostingOrders as services
    let totalServicesResult = { count: 0 }
    let activeServicesResult = { count: 0 }
    try {
        ;[totalServicesResult] = await db.select({ count: count() }).from(hostingOrders)
        ;[activeServicesResult] = await db.select({ count: count() }).from(hostingOrders).where(eq(hostingOrders.status, "active"))
    } catch (error) {
        if (!isRecoverableDbError(error)) throw error
    }

    // Get total domains (from hosting orders)
    let totalDomainsResult = { count: 0 }
    try {
        ;[totalDomainsResult] = await db.select({ count: count() }).from(hostingOrders).where(eq(hostingOrders.status, "active"))
    } catch (error) {
        if (!isRecoverableDbError(error)) throw error
    }

    // Get monthly topup amount (this month) - sum of pointTransactions where type is 'payment' or 'bonus'
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    let monthlyTopupResult: Array<{ total: number | string | null }> = [{ total: 0 }]
    try {
        monthlyTopupResult = await db
            .select({
                total: sql<number>`COALESCE(SUM(CAST(${pointTransactions.amount} AS DECIMAL)), 0)`,
            })
            .from(pointTransactions)
            .where(
                and(
                    gte(pointTransactions.createdAt, startOfMonth),
                    sql`${pointTransactions.type} IN ('payment', 'bonus')`
                )
            )
    } catch (error) {
        if (!isRecoverableDbError(error)) throw error
    }

    const monthlyTopupAmount = parseFloat(monthlyTopupResult[0]?.total?.toString() || "0")

    const stats = {
        totalUsers: totalUsers.count,
        totalServices: totalServicesResult.count,
        activeServices: activeServicesResult.count,
        totalInvoices: 0, // Removed - not used anymore
        unpaidInvoices: 0, // Removed - not used anymore
        totalUnpaidAmount: 0, // Removed - not used anymore
        totalWalletBalance: monthlyTopupAmount, // Monthly topup amount
        totalDomains: totalDomainsResult.count,
    }

    return (
        <AdminOverviewClient
            stats={stats}
            recentUsers={recentUsers}
            recentServices={[]}
        />
    )
}

