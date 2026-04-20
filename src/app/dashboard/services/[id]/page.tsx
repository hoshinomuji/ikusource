import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { services } from "@/db/schema"
import { eq } from "drizzle-orm"
import { ServiceDetailsClient } from "@/components/dashboard/service-details-client"
import { getHostingOrderByServiceId } from "@/app/actions/hosting"

export default async function ServiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const cookieStore = await cookies()
    const userId = await getSessionUserIdValue(cookieStore)

    if (!userId) {
        redirect("/login")
    }

    const serviceId = parseInt(id)
    if (isNaN(serviceId)) {
        redirect("/dashboard/services")
    }

    const service = await db
        .select()
        .from(services)
        .where(eq(services.id, serviceId))
        .limit(1)

    if (!service || service.length === 0) {
        redirect("/dashboard/services")
    }

    if (service[0].userId !== parseInt(userId)) {
        redirect("/dashboard/services")
    }

    let hostingDetails = null
    if (service[0].type === "hosting") {
        const res = await getHostingOrderByServiceId(serviceId)
        if (res.success) {
            hostingDetails = res.data
        }
    }

    return <ServiceDetailsClient service={service[0]} hostingDetails={hostingDetails} />
}
