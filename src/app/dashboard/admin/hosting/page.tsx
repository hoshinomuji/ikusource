import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { users, hostingOrders, services, hostingPackages, directAdminConfig } from "@/db/schema"
import { eq } from "drizzle-orm"
import { AdminHostingClient } from "@/components/admin/admin-hosting-client"
import { desc } from "drizzle-orm"

export default async function AdminHostingPage() {
    const cookieStore = await cookies()
    const userId = await getSessionUserIdValue(cookieStore)

    if (!userId) {
        redirect("/login")
    }

    const userIdNum = parseInt(userId)

    // Check if user is admin
    const userResult = await db
        .select({
            role: users.role,
        })
        .from(users)
        .where(eq(users.id, userIdNum))
        .limit(1)

    const user = userResult[0]

    if (!user || user.role !== "admin") {
        redirect("/dashboard")
    }

    // Get all hosting orders with related data
    const orders = await db
        .select({
            id: hostingOrders.id,
            userId: hostingOrders.userId,
            serviceId: hostingOrders.serviceId,
            domain: hostingOrders.domain,
            directAdminUsername: hostingOrders.directAdminUsername,
            directAdminPassword: hostingOrders.directAdminPassword,
            directAdminEmail: hostingOrders.directAdminEmail,
            status: hostingOrders.status,
            createdAt: hostingOrders.createdAt,
            updatedAt: hostingOrders.updatedAt,
            userName: users.name,
            userEmail: users.email,
            packageName: hostingPackages.name,
            packageId: hostingPackages.id,
            directAdminPackageName: hostingPackages.directAdminPackageName,
            serviceName: services.name,
            nextDueDate: services.nextDueDate,
        })
        .from(hostingOrders)
        .leftJoin(users, eq(hostingOrders.userId, users.id))
        .leftJoin(hostingPackages, eq(hostingOrders.packageId, hostingPackages.id))
        .leftJoin(services, eq(hostingOrders.serviceId, services.id))
        .orderBy(desc(hostingOrders.createdAt))

    const usersForImport = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
        })
        .from(users)
        .orderBy(users.name)

    const packagesForImport = await db
        .select({
            id: hostingPackages.id,
            name: hostingPackages.name,
        })
        .from(hostingPackages)
        .orderBy(hostingPackages.name)

    const configsForImport = await db
        .select({
            id: directAdminConfig.id,
            label: directAdminConfig.serverIp,
            panelUrl: directAdminConfig.panelUrl,
        })
        .from(directAdminConfig)
        .orderBy(directAdminConfig.id)

    return (
        <AdminHostingClient
            orders={orders}
            usersForImport={usersForImport}
            packagesForImport={packagesForImport}
            configsForImport={configsForImport}
        />
    )
}

