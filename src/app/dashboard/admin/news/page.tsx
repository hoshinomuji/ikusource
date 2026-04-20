import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getAllNews } from "@/app/actions/news"
import { AdminNewsClient } from "@/components/admin/admin-news-client"

export default async function AdminNewsPage() {
    const cookieStore = await cookies()
    const userId = await getSessionUserIdValue(cookieStore)

    if (!userId) {
        redirect("/login")
    }

    const userIdNum = parseInt(userId)

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

    const news = await getAllNews()

    return (
        <AdminNewsClient news={news} />
    )
}
