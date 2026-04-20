import { db } from "@/db"
import { users, wallets } from "@/db/schema"
import { eq } from "drizzle-orm"
import { AdminUsersClient } from "@/components/admin/admin-users-client"

export default async function AdminUsersPage() {
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

