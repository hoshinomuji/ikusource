import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { users, notifications } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { getUserNotifications } from "@/app/actions/notifications"
import { getWebsiteSettings } from "@/app/actions/settings"

export const dynamic = "force-dynamic"

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds} เธงเธดเธเธฒเธ—เธตเธ—เธตเนเนเธฅเนเธง`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} เธเธฒเธ—เธตเธ—เธตเนเนเธฅเนเธง`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} เธเธฑเนเธงเนเธกเธเธ—เธตเนเนเธฅเนเธง`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} เธงเธฑเธเธ—เธตเนเนเธฅเนเธง`
    return `${Math.floor(diffInSeconds / 604800)} เธชเธฑเธเธ”เธฒเธซเนเธ—เธตเนเนเธฅเนเธง`
}

function isDatabaseUnavailableError(error: unknown) {
    const errorCode = (error as any)?.code || (error as any)?.cause?.code
    return errorCode === "ECONNREFUSED"
}

export default async function DashboardLayout({
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

    let user: { name: string; email: string; role: string } | null = null
    try {
        const userResult = await db
            .select({
                name: users.name,
                email: users.email,
                role: users.role,
            })
            .from(users)
            .where(eq(users.id, userIdNum))
            .limit(1)

        user = userResult[0] || null

        // If user deleted but cookie exists
        if (!user) {
            redirect("/login")
        }
    } catch (error) {
        if (isDatabaseUnavailableError(error)) {
            // Dev fallback when DB is offline
            user = {
                name: "Demo User",
                email: "test@test.com",
                role: "user",
            }
        } else {
            throw error
        }
    }

    // Get Notifications from database
    let notifications: any[] = []
    try {
        const notificationsResult = await getUserNotifications()
        if (notificationsResult.success && notificationsResult.data) {
            notifications = notificationsResult.data.map(notif => ({
                id: notif.id.toString(),
                title: notif.title,
                message: notif.message,
                time: formatTimeAgo(notif.createdAt),
                link: notif.link,
                isRead: notif.isRead,
                type: notif.type,
            }))
        }
    } catch (error) {
        if (!isDatabaseUnavailableError(error)) {
            console.error("Error fetching notifications:", error)
        }
        notifications = []
    }

    // Get website settings
    const websiteSettings = await getWebsiteSettings()

    if (!user) {
        redirect("/login")
    }

    return (
        <div className="min-h-screen bg-background selection:bg-primary/20">
            <DashboardShell user={user} notifications={notifications} logoUrl={websiteSettings.logoUrl} storeName={websiteSettings.storeName}>
                {children}
            </DashboardShell>
        </div>
    )
}
