import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { users, hostingPackages, directAdminConfig, hostingCategories, hostingPackageTemplates } from "@/db/schema"
import { eq } from "drizzle-orm"
import { AdminHostingPackagesClient } from "@/components/admin/admin-hosting-packages-client"
import { isRecoverableDbError } from "@/lib/db-error"
const RESELLER_MARKER = "[[RESELLER]]"

export default async function AdminHostingPackagesPage() {
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
        console.warn("[Admin Hosting Packages] users query failed, redirecting to login")
        redirect("/login")
    }

    const user = userResult[0]

    if (!user || user.role !== "admin") {
        redirect("/dashboard")
    }

    // Get all hosting packages with config info
    let packages: any[] = []
    try {
        packages = await db
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
    } catch (error) {
        if (!isRecoverableDbError(error)) throw error
        console.warn("[Admin Hosting Packages] hosting_packages unavailable, rendering empty state")
        packages = []
    }

    // Get all configs for dropdown
    let configs: any[] = []
    try {
        configs = await db
            .select()
            .from(directAdminConfig)
            .orderBy(directAdminConfig.serverIp)
    } catch (error) {
        if (!isRecoverableDbError(error)) throw error
        configs = []
    }

    // Get all categories for dropdown
    let categories: any[] = []
    try {
        categories = await db
            .select()
            .from(hostingCategories)
            .orderBy(hostingCategories.displayOrder, hostingCategories.name)
    } catch (error) {
        if (!isRecoverableDbError(error)) throw error
        categories = []
    }

    let templates: any[] = []
    try {
        templates = await db
            .select()
            .from(hostingPackageTemplates)
            .orderBy(hostingPackageTemplates.createdAt)
    } catch (error) {
        if (!isRecoverableDbError(error)) throw error
        templates = []
    }

    const normalHostingPackages = packages.filter((pkg) => !String(pkg.description || "").includes(RESELLER_MARKER))
    return <AdminHostingPackagesClient packages={normalHostingPackages} configs={configs} categories={categories} templates={templates} />
}

