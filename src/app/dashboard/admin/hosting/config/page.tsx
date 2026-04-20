import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { users, directAdminConfig, hostingCategories } from "@/db/schema"
import { eq } from "drizzle-orm"
import { AdminHostingConfigClient } from "@/components/admin/admin-hosting-config-client"
import { isRecoverableDbError } from "@/lib/db-error"

export default async function AdminHostingConfigPage() {
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
        console.warn("[Admin Hosting Config] users query failed, redirecting to login")
        redirect("/login")
    }

    const user = userResult[0]

    if (!user || user.role !== "admin") {
        redirect("/dashboard")
    }

    // Get all DirectAdmin configurations
    let configs: any[] = []
    try {
        configs = await db
            .select()
            .from(directAdminConfig)
            .orderBy(directAdminConfig.createdAt)
        configs = configs.map((config) => ({
            ...config,
            resellerPassword: "",
        }))
    } catch (error) {
        if (!isRecoverableDbError(error)) throw error
        console.warn("[Admin Hosting Config] directadmin_config unavailable, rendering empty state")
        configs = []
    }

    // Get all hosting categories
    let categories: any[] = []
    try {
        categories = await db
            .select()
            .from(hostingCategories)
            .orderBy(hostingCategories.displayOrder, hostingCategories.name)
    } catch (error) {
        if (!isRecoverableDbError(error)) throw error
        console.warn("[Admin Hosting Config] hosting_categories unavailable, rendering empty state")
        categories = []
    }

    return <AdminHostingConfigClient configs={configs} categories={categories} />
}

