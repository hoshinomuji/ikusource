import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { users, hostingPackages } from "@/db/schema"
import { eq } from "drizzle-orm"
import { AdminSettingsClient } from "@/components/admin/admin-settings-client"
import { getCronSettings, getPaymentSettings, getWebsiteSettings, getLandingPageSettings, getDiscordSettings, getOAuthSettings, getEmailSettings } from "@/app/actions/settings"
import { getHostingCategories } from "@/app/actions/admin-hosting-categories"

export default async function AdminSettingsPage() {
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

    // Get cron settings, payment settings, website settings, landing page settings, and mail settings
    const cronSettings = await getCronSettings()
    const paymentSettings = await getPaymentSettings()
    const websiteSettings = await getWebsiteSettings()
    const landingPageSettings = await getLandingPageSettings()
    const discordSettings = await getDiscordSettings()
    const oauthSettings = await getOAuthSettings()
    const emailSettings = await getEmailSettings()
    // Get all hosting packages and categories
    const packagesResult = await db
        .select()
        .from(hostingPackages)
        .where(eq(hostingPackages.isActive, true))
        .orderBy(hostingPackages.price)
    const categoriesResult = await getHostingCategories()
    const packages = packagesResult || []
    const categories = categoriesResult.success ? (categoriesResult.data || []) : []

    return (
        <AdminSettingsClient
            cronSettings={cronSettings}
            paymentSettings={paymentSettings}
            websiteSettings={websiteSettings}
            landingPageSettings={landingPageSettings}
            discordSettings={discordSettings}
            oauthSettings={oauthSettings}
            emailSettings={emailSettings}
            packages={packages}
            categories={categories}
        />
    )
}

