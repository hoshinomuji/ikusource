import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { users, wallets } from "@/db/schema"
import { eq } from "drizzle-orm"
import { AdminUsersClient } from "@/components/admin/admin-users-client"

export default async function AdminUsersPage() {
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

    const allUsers = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(users.createdAt)

    // Get wallet balances for each user
    const usersWithWallets = await Promise.all(
        allUsers.map(async (user) => {
            let balance = "0.00"
            try {
                const wallet = await db
                    .select({
                        balance: wallets.balance,
                    })
                    .from(wallets)
                    .where(eq(wallets.userId, user.id))
                    .limit(1)

                if (wallet[0]) {
                    balance = wallet[0].balance
                }
            } catch {
                // Wallet might not exist
            }

            return {
                ...user,
                walletBalance: parseFloat(balance),
            }
        })
    )

    return <AdminUsersClient users={usersWithWallets} />
}

