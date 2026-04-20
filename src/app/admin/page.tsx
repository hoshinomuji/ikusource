import { db } from "@/db"
import { users, services, hostingOrders, pointTransactions } from "@/db/schema"
import { count, eq, sql, and, gte } from "drizzle-orm"
import { AdminOverviewClient } from "@/components/admin/admin-overview-client"

export default async function AdminPage() {
    // Get total counts
    const [totalUsers] = await db
        .select({ count: count() })
        .from(users)

    // Get recent users (last 5) - order by DESC to get newest first
    const recentUsers = await db
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

    // Get count of services - use hostingOrders as services
    const [totalServicesResult] = await db.select({ count: count() }).from(hostingOrders)
    const [activeServicesResult] = await db.select({ count: count() }).from(hostingOrders).where(eq(hostingOrders.status, "active"))

    // Get total domains (from hosting orders)
    const [totalDomainsResult] = await db.select({ count: count() }).from(hostingOrders).where(eq(hostingOrders.status, "active"))

    // Get monthly topup amount (this month) - sum of pointTransactions where type is 'payment' or 'bonus'
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const monthlyTopupResult = await db
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

