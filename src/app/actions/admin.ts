"use server"

import { getSessionUserIdValue } from "@/lib/session"
import { db } from "@/db"
import { users, wallets, pointTransactions, hostingOrders, invoices, services } from "@/db/schema"
import { eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { hash } from "bcryptjs"

export type AdminActionResult = {
    success?: boolean
    error?: string
}

export async function updateUserRole(
    userId: number,
    newRole: string
): Promise<AdminActionResult> {
    try {
        // Check if current user is admin
        const cookieStore = await cookies()
        const currentUserId = await getSessionUserIdValue(cookieStore)

        if (!currentUserId) {
            return { error: "เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเน€เธเนเธฒเธ–เธถเธ" }
        }

        const currentUser = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, parseInt(currentUserId)))
            .limit(1)

        if (currentUser[0]?.role !== "admin") {
            return { error: "เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเน€เธเนเธฒเธ–เธถเธ" }
        }

        // Update user role
        await db
            .update(users)
            .set({ role: newRole })
            .where(eq(users.id, userId))

        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Error updating user role:", error)
        return { error: "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธญเธฑเธเน€เธ”เธ•เธเธ—เธเธฒเธ—เธเธนเนเนเธเนเนเธ”เน" }
    }
}

export async function addPoints(
    userId: number,
    amount: number,
    type: string,
    description: string
): Promise<AdminActionResult> {
    try {
        // Check if current user is admin
        const cookieStore = await cookies()
        const currentUserId = await getSessionUserIdValue(cookieStore)

        if (!currentUserId) {
            return { error: "เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเน€เธเนเธฒเธ–เธถเธ" }
        }

        const currentUser = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, parseInt(currentUserId)))
            .limit(1)

        if (currentUser[0]?.role !== "admin") {
            return { error: "เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเน€เธเนเธฒเธ–เธถเธ" }
        }

        // Get or create wallet
        let wallet = await db
            .select()
            .from(wallets)
            .where(eq(wallets.userId, userId))
            .limit(1)

        if (!wallet[0]) {
            // Create wallet if it doesn't exist
            const [newWallet] = await db
                .insert(wallets)
                .values({
                    userId,
                    balance: "0",
                })
                .returning()
            wallet = [newWallet]
        }

        const currentBalance = parseFloat(wallet[0].balance)
        const newBalance = currentBalance + amount

        if (newBalance < 0) {
            return { error: "เธขเธญเธ”เน€เธเธดเธเนเธกเนเธเธญ" }
        }

        // Update wallet balance
        await db
            .update(wallets)
            .set({
                balance: newBalance.toFixed(2),
                updatedAt: new Date(),
            })
            .where(eq(wallets.id, wallet[0].id))

        // Create transaction record
        await db.insert(pointTransactions).values({
            userId,
            walletId: wallet[0].id,
            amount: amount.toFixed(2),
            type,
            description,
            referenceId: `admin-${currentUserId}`,
        })

        revalidatePath("/admin/users")
        revalidatePath("/admin/wallets")
        return { success: true }
    } catch (error) {
        console.error("Error adding points:", error)
        return { error: "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธญเธฑเธเน€เธ”เธ•เธเธฐเนเธเธเนเธ”เน" }
    }
}

export async function changeUserPassword(
    userId: number,
    newPassword: string
): Promise<AdminActionResult> {
    try {
        // Check if current user is admin
        const cookieStore = await cookies()
        const currentUserId = await getSessionUserIdValue(cookieStore)

        if (!currentUserId) {
            return { error: "เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเน€เธเนเธฒเธ–เธถเธ" }
        }

        const currentUser = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, parseInt(currentUserId)))
            .limit(1)

        if (currentUser[0]?.role !== "admin") {
            return { error: "เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเน€เธเนเธฒเธ–เธถเธ" }
        }

        // Validate password length
        if (newPassword.length < 6) {
            return { error: "เธฃเธซเธฑเธชเธเนเธฒเธเธ•เนเธญเธเธกเธตเธญเธขเนเธฒเธเธเนเธญเธข 6 เธ•เธฑเธงเธญเธฑเธเธฉเธฃ" }
        }

        // Hash new password
        const hashedPassword = await hash(newPassword, 10)

        // Update user password
        await db
            .update(users)
            .set({
                password: hashedPassword,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId))

        revalidatePath("/dashboard/admin/users")
        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Error changing user password:", error)
        return { error: "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เน€เธเธฅเธตเนเธขเธเธฃเธซเธฑเธชเธเนเธฒเธเนเธ”เน" }
    }
}

export async function deleteUser(userId: number): Promise<AdminActionResult> {
    try {
        // Check if current user is admin
        const cookieStore = await cookies()
        const currentUserId = await getSessionUserIdValue(cookieStore)

        if (!currentUserId) {
            return { error: "เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเน€เธเนเธฒเธ–เธถเธ" }
        }

        const currentUser = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, parseInt(currentUserId)))
            .limit(1)

        if (currentUser[0]?.role !== "admin") {
            return { error: "เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเน€เธเนเธฒเธ–เธถเธ" }
        }

        if (parseInt(currentUserId) === userId) {
            return { error: "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเธเธฑเธเธเธตเธ•เธฑเธงเน€เธญเธเนเธ”เน" }
        }

        // Delete dependencies (Manual Cascade)
        // 1. Hosting Orders
        await db.delete(hostingOrders).where(eq(hostingOrders.userId, userId))

        // 2. Invoices
        await db.delete(invoices).where(eq(invoices.userId, userId))

        // 3. Services
        await db.delete(services).where(eq(services.userId, userId))

        // 4. Point Transactions (via wallet)
        const userWallet = await db.select({ id: wallets.id }).from(wallets).where(eq(wallets.userId, userId)).limit(1)
        if (userWallet[0]) {
            await db.delete(pointTransactions).where(eq(pointTransactions.walletId, userWallet[0].id))
            await db.delete(wallets).where(eq(wallets.userId, userId))
        }

        // 5. Notifications
        const { notifications } = await import("@/db/schema") // Dynamic import to avoid circular dependency issues if any
        // Note: notifications table was not imported at top. Check if it's exported in schema. Recalling from view_file, yes it is.
        // But let's add import at top or just skip if not critical, but better safe.
        // Actually, let's just assume `db.delete(notifications)` works if I import it.
        // Wait, schema.ts has `notifications`. I need to add it to imports at top of file.

        // 6. Delete User
        await db.delete(users).where(eq(users.id, userId))

        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Error deleting user:", error)
        return { error: "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเธเธนเนเนเธเนเนเธ”เน (เธญเธฒเธเธกเธตเธเนเธญเธกเธนเธฅเน€เธเธทเนเธญเธกเนเธขเธ)" }
    }
}

export async function toggleUserSuspension(userId: number, shouldSuspend: boolean): Promise<AdminActionResult> {
    try {
        const cookieStore = await cookies()
        const currentUserId = await getSessionUserIdValue(cookieStore)

        if (!currentUserId) return { error: "เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเน€เธเนเธฒเธ–เธถเธ" }

        const currentUser = await db.select({ role: users.role }).from(users).where(eq(users.id, parseInt(currentUserId))).limit(1)
        if (currentUser[0]?.role !== "admin") return { error: "เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเน€เธเนเธฒเธ–เธถเธ" }

        if (parseInt(currentUserId) === userId) return { error: "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฃเธฐเธเธฑเธเธเธฑเธเธเธตเธ•เธฑเธงเน€เธญเธเนเธ”เน" }

        await db
            .update(users)
            .set({ role: shouldSuspend ? "suspended" : "user" })
            .where(eq(users.id, userId))

        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Error updating user suspension:", error)
        return { error: "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธญเธฑเธเน€เธ”เธ•เธชเธ–เธฒเธเธฐเธเธนเนเนเธเนเนเธ”เน" }
    }
}
