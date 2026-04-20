import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { db } from "@/db"
import { users, services, invoices, hostingOrders, wallets } from "@/db/schema"
import { eq, and, count, gte, lte, isNotNull, desc } from "drizzle-orm"
import { OverviewClient } from "@/components/dashboard/overview-client"
import { getWebsiteSettings } from "@/app/actions/settings"
import { getAllNews } from "@/app/actions/news"

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return `${Math.floor(diffInSeconds / 604800)}w ago`
}

function isDatabaseUnavailableError(error: unknown) {
  const errorCode = (error as any)?.code || (error as any)?.cause?.code
  return errorCode === "ECONNREFUSED"
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const userId = await getSessionUserIdValue(cookieStore)

  let userName = "Guest"
  let stats = {
    activeServices: 0,
    totalDomains: 0,
    expiringDomains: 0,
    walletBalance: 0,
  }
  let activeServicesList: any[] = []
  let notifications: any[] = []

  if (userId) {
    const userIdNum = parseInt(userId)

    try {
      const userResult = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, userIdNum))
        .limit(1)

      if (userResult[0]) {
        userName = userResult[0].name
      }

      activeServicesList = await db
        .select()
        .from(services)
        .where(and(eq(services.userId, userIdNum), eq(services.status, "active")))
        .limit(5)

      const activeServicesResult = await db
        .select({ count: count() })
        .from(services)
        .where(and(eq(services.userId, userIdNum), eq(services.status, "active")))
      stats.activeServices = activeServicesResult[0]?.count || 0

      const domainsResult = await db
        .select({ count: count() })
        .from(hostingOrders)
        .where(and(eq(hostingOrders.userId, userIdNum), eq(hostingOrders.status, "active")))
      stats.totalDomains = domainsResult[0]?.count || 0

      const now = new Date()
      const warningDate = new Date()
      warningDate.setDate(warningDate.getDate() + 7)

      const expiringDomainsResult = await db
        .select({ count: count() })
        .from(services)
        .innerJoin(hostingOrders, eq(services.id, hostingOrders.serviceId))
        .where(
          and(
            eq(services.userId, userIdNum),
            eq(services.status, "active"),
            eq(hostingOrders.userId, userIdNum),
            eq(hostingOrders.status, "active"),
            isNotNull(services.nextDueDate),
            lte(services.nextDueDate, warningDate),
            gte(services.nextDueDate, now),
          ),
        )
      stats.expiringDomains = expiringDomainsResult[0]?.count || 0

      const walletResult = await db.select().from(wallets).where(eq(wallets.userId, userIdNum)).limit(1)
      stats.walletBalance = walletResult[0] ? parseFloat(walletResult[0].balance) : 0

      const unpaidInvoicesList = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.userId, userIdNum), eq(invoices.status, "unpaid")))
        .orderBy(desc(invoices.dueDate))
        .limit(3)

      const expiringDomainsList = await db
        .select({
          id: services.id,
          name: services.name,
          nextDueDate: services.nextDueDate,
        })
        .from(services)
        .innerJoin(hostingOrders, eq(services.id, hostingOrders.serviceId))
        .where(
          and(
            eq(services.userId, userIdNum),
            eq(services.status, "active"),
            eq(hostingOrders.userId, userIdNum),
            eq(hostingOrders.status, "active"),
            isNotNull(services.nextDueDate),
            lte(services.nextDueDate, warningDate),
            gte(services.nextDueDate, now),
          ),
        )
        .orderBy(services.nextDueDate)
        .limit(3)

      notifications = [
        ...unpaidInvoicesList.map((inv) => ({
          id: `invoice-${inv.id}`,
          title: "Unpaid Invoice",
          message: `Invoice #${inv.id} amount ${parseFloat(inv.amount).toFixed(2)} THB`,
          time: formatTimeAgo(inv.dueDate),
        })),
        ...expiringDomainsList.map((domain) => ({
          id: `domain-${domain.id}`,
          title: "Domain Expiring Soon",
          message: `Domain ${domain.name} expires in ${Math.ceil((domain.nextDueDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days`,
          time: formatTimeAgo(domain.nextDueDate!),
        })),
      ]
        .sort((a, b) => {
          const timeA = a.time.includes("s") ? 0 : a.time.includes("m") ? 1 : a.time.includes("h") ? 2 : 3
          const timeB = b.time.includes("s") ? 0 : b.time.includes("m") ? 1 : b.time.includes("h") ? 2 : 3
          return timeA - timeB
        })
        .slice(0, 5)
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        userName = "Demo User"
        stats = {
          activeServices: 0,
          totalDomains: 0,
          expiringDomains: 0,
          walletBalance: 0,
        }
        activeServicesList = []
        notifications = []
      } else {
        throw error
      }
    }
  }

  const news = await getAllNews()
  const latestNews = news.slice(0, 5)

  const websiteSettings = await getWebsiteSettings()

  return (
    <OverviewClient
      userName={userName}
      storeName={websiteSettings.storeName}
      stats={stats}
      services={activeServicesList}
      news={latestNews}
    />
  )
}
