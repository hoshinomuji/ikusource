import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getHostingCategories, getHostingPackages } from "@/app/actions/hosting"
import { HostingClient } from "@/components/dashboard/hosting-client"

export default async function HostingPage() {
    const cookieStore = await cookies()
    const userId = await getSessionUserIdValue(cookieStore)

    if (!userId) {
        redirect("/login")
    }

    const userIdNum = parseInt(userId)

    // Get categories and packages
    const categoriesResult = await getHostingCategories()
    const packagesResult = await getHostingPackages()

    // Always show the component, even if there are errors (will show empty state)
    // Hosting page is only for ordering new hosting, not managing existing services
    return (
        <HostingClient
            categories={categoriesResult.data || []}
            packages={packagesResult.data || []}
            hasServices={false}
            userServices={[]}
        />
    )
}

