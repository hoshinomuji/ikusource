import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getAllSlipVerifications } from "@/app/actions/admin-slips"
import { AdminSlipsClient } from "@/components/admin/admin-slips-client"

export default async function AdminSlipsPage() {
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

    // Get all slip verifications
    const result = await getAllSlipVerifications()

    // If there's an error, show empty array (will show empty state)
    if (!result.success) {
        console.error("Error fetching slips:", result.error)
    }

    return <AdminSlipsClient slips={result.data || []} />
}

