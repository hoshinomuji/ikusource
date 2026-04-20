import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { users, services, hostingOrders, hostingPackages } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { ServicesClient } from "@/components/dashboard/services-client"

export default async function ServicesPage() {
    const cookieStore = await cookies()
    const userId = await getSessionUserIdValue(cookieStore)

    if (!userId) {
        redirect("/login")
    }

    const userIdNum = parseInt(userId)

    // Get user
    const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userIdNum))
        .limit(1)

    if (!user || user.length === 0) {
        redirect("/login")
    }

    // Get all user services
    const userServices = await db
        .select({
            id: services.id,
            name: services.name,
            type: services.type,
            status: services.status,
            ip: services.ip,
            price: services.price,
            billingCycle: services.billingCycle,
            nextDueDate: services.nextDueDate,
            disk: services.disk,
            createdAt: services.createdAt,
            packageName: hostingPackages.name,
        })
        .from(services)
        .leftJoin(hostingOrders, eq(services.id, hostingOrders.serviceId))
        .leftJoin(hostingPackages, eq(hostingOrders.packageId, hostingPackages.id))
        .where(eq(services.userId, userIdNum))
        .orderBy(desc(services.createdAt))

    return <ServicesClient services={userServices} />
}
