import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getHostingPackages } from "@/app/actions/hosting"
import { HostingOrderClient } from "@/components/dashboard/hosting-order-client"

export default async function HostingOrderPage({
    searchParams,
}: {
    searchParams: Promise<{ packageId?: string }>
}) {
    const cookieStore = await cookies()
    const userId = await getSessionUserIdValue(cookieStore)

    if (!userId) {
        redirect("/login")
    }

    const params = await searchParams

    if (!params.packageId) {
        redirect("/dashboard/hosting")
    }

    const packageId = parseInt(params.packageId)
    if (isNaN(packageId)) {
        redirect("/dashboard/hosting")
    }

    // Get packages
    const packagesResult = await getHostingPackages()
    const packages = packagesResult.data || []
    const selectedPackage = packages.find(pkg => pkg.id === packageId)

    if (!selectedPackage) {
        redirect("/dashboard/hosting")
    }

    return (
        <HostingOrderClient package={selectedPackage} />
    )
}

