import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { users, hostingPackages, directAdminConfig, hostingCategories } from "@/db/schema"
import { eq } from "drizzle-orm"
import { AdminHostingPackagesClient } from "@/components/admin/admin-hosting-packages-client"
const RESELLER_MARKER = "[[RESELLER]]"

export default async function AdminPackagesPage() {
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

    // Get all hosting packages with config info
    const packages = await db
        .select({
            id: hostingPackages.id,
            name: hostingPackages.name,
            description: hostingPackages.description,
            directAdminPackageName: hostingPackages.directAdminPackageName,
            configId: hostingPackages.configId,
            categoryId: hostingPackages.categoryId,
            diskSpace: hostingPackages.diskSpace,
            bandwidth: hostingPackages.bandwidth,
            domains: hostingPackages.domains,
            subdomains: hostingPackages.subdomains,
            emailAccounts: hostingPackages.emailAccounts,
            databases: hostingPackages.databases,
            ftpAccounts: hostingPackages.ftpAccounts,
            price: hostingPackages.price,
            billingCycle: hostingPackages.billingCycle,
            isActive: hostingPackages.isActive,
            createdAt: hostingPackages.createdAt,
            updatedAt: hostingPackages.updatedAt,
            configName: directAdminConfig.serverIp,
        })
        .from(hostingPackages)
        .leftJoin(directAdminConfig, eq(hostingPackages.configId, directAdminConfig.id))
        .orderBy(hostingPackages.price)

    // Get all configs for dropdown
    const configs = await db
        .select()
        .from(directAdminConfig)
        .orderBy(directAdminConfig.serverIp)

    // Get all categories for dropdown
    const categories = await db
        .select()
        .from(hostingCategories)
        .orderBy(hostingCategories.displayOrder, hostingCategories.name)

    return <AdminHostingPackagesClient packages={packages.filter((p) => !String(p.description || "").includes(RESELLER_MARKER))} configs={configs} categories={categories} />
}
