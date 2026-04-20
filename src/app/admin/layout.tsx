import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { AdminShell } from "@/components/admin/admin-shell"
import { getWebsiteSettings } from "@/app/actions/settings"

export const dynamic = "force-dynamic"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const userId = await getSessionUserIdValue(cookieStore)

    if (!userId) {
        redirect("/login")
    }

    const userIdNum = parseInt(userId)

    const userResult = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
        })
        .from(users)
        .where(eq(users.id, userIdNum))
        .limit(1)

    const user = userResult[0]

    if (!user) {
        redirect("/login")
    }

    // Check if user is admin
    if (user.role !== "admin") {
        redirect("/dashboard")
    }

    const websiteSettings = await getWebsiteSettings()

    return <AdminShell user={user} logoUrl={websiteSettings.logoUrl} storeName={websiteSettings.storeName}>{children}</AdminShell>
}

