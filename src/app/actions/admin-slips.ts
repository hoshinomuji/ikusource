"use server"

import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { users, slipVerifications } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"

/**
 * Check if user is admin
 */
async function checkAdmin() {
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

    return userIdNum
}

/**
 * Get all slip verifications
 */
export async function getAllSlipVerifications() {
    try {
        await checkAdmin()

        // Check if table exists, if not return empty array
        try {
            const slips = await db
                .select({
                    id: slipVerifications.id,
                    userId: slipVerifications.userId,
                    userName: users.name,
                    userEmail: users.email,
                    fileHash: slipVerifications.fileHash,
                    fileName: slipVerifications.fileName,
                    fileSize: slipVerifications.fileSize,
                    amount: slipVerifications.amount,
                    rdcwResponse: slipVerifications.rdcwResponse,
                    referenceId: slipVerifications.referenceId,
                    createdAt: slipVerifications.createdAt,
                })
                .from(slipVerifications)
                .leftJoin(users, eq(slipVerifications.userId, users.id))
                .orderBy(desc(slipVerifications.createdAt))

            return {
                success: true,
                data: slips,
            }
        } catch (tableError: any) {
            // If table doesn't exist, return empty array
            if (tableError?.message?.includes("does not exist") || 
                tableError?.message?.includes("slip_verifications")) {
                console.warn("Table slip_verifications does not exist yet. Please run migration.")
                return {
                    success: true,
                    data: [],
                }
            }
            throw tableError
        }
    } catch (error: any) {
        console.error("Error fetching slip verifications:", error)
        return {
            success: false,
            error: error?.message || "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธถเธเธเนเธญเธกเธนเธฅเธชเธฅเธดเธเนเธ”เน",
            data: [],
        }
    }
}

/**
 * Delete slip verification by ID
 */
export async function deleteSlipVerification(slipId: number) {
    try {
        await checkAdmin()

        try {
            await db
                .delete(slipVerifications)
                .where(eq(slipVerifications.id, slipId))

            revalidatePath("/dashboard/admin/slips")
            revalidatePath("/dashboard/admin")

            return {
                success: true,
                message: "เธฅเธเธชเธฅเธดเธเธชเธณเน€เธฃเนเธ",
            }
        } catch (tableError: any) {
            // If table doesn't exist
            if (tableError?.message?.includes("does not exist") || 
                tableError?.message?.includes("slip_verifications")) {
                return {
                    success: false,
                    error: "เธ•เธฒเธฃเธฒเธเธชเธฅเธดเธเธขเธฑเธเนเธกเนเนเธ”เนเธ–เธนเธเธชเธฃเนเธฒเธ เธเธฃเธธเธ“เธฒเธฃเธฑเธ migration เธเนเธญเธ",
                }
            }
            throw tableError
        }
    } catch (error: any) {
        console.error("Error deleting slip verification:", error)
        return {
            success: false,
            error: error?.message || "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเธชเธฅเธดเธเนเธ”เน",
        }
    }
}

