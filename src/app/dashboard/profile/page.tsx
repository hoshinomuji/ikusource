import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { redirect } from "next/navigation"
import { ProfileClient } from "@/components/dashboard/profile-client"
import { getUserNotificationSettings } from "@/app/actions/user-settings"

export default async function ProfilePage() {
    const cookieStore = await cookies()
    const userId = await getSessionUserIdValue(cookieStore)

    if (!userId) {
        redirect("/login")
    }

    const userIdNum = parseInt(userId)

    // Get user data - select only required fields that definitely exist
    const userResult = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            createdAt: users.createdAt
        })
        .from(users)
        .where(eq(users.id, userIdNum))
        .limit(1)

    const user = userResult[0]

    if (!user) {
        redirect("/login")
    }

    // Initialize optional fields with empty values
    // These will be populated if the columns exist in the database
    let phone = ""
    let address = ""
    let bio = ""
    let avatarUrl: string | null = null
    const isMissingColumnError = (error: any) => {
        const errorMessage = error?.message || ""
        const errorCode = error?.code || ""
        return errorMessage.includes("column") || errorCode === "42703" || errorMessage.includes("does not exist")
    }

    // Try to get optional fields if they exist in the database.
    // Fetch in isolated queries so one missing column doesn't break all optional data.
    try {
        const optionalResult = await db
            .select({
                phone: users.phone,
                address: users.address,
                bio: users.bio,
            })
            .from(users)
            .where(eq(users.id, userIdNum))
            .limit(1)

        if (optionalResult[0]) {
            phone = optionalResult[0].phone || ""
            address = optionalResult[0].address || ""
            bio = optionalResult[0].bio || ""
        }
    } catch (error: any) {
        if (!isMissingColumnError(error)) {
            console.error("Error fetching optional profile fields:", error)
        }
    }

    try {
        const avatarResult = await db
            .select({
                avatarUrl: users.avatarUrl
            })
            .from(users)
            .where(eq(users.id, userIdNum))
            .limit(1)

        if (avatarResult[0]) {
            avatarUrl = avatarResult[0].avatarUrl || null
        }

        // If avatar_url exists but is empty, fallback to legacy image column
        if (!avatarUrl) {
            try {
                const legacyAvatarResult = await db.execute(sql`SELECT image FROM users WHERE id = ${userIdNum} LIMIT 1`)
                const legacyAvatar = (legacyAvatarResult as any)?.rows?.[0]?.image as string | null | undefined
                avatarUrl = legacyAvatar || null
            } catch (legacyError) {
                if (!isMissingColumnError(legacyError)) {
                    console.error("Error fetching legacy avatar field (image):", legacyError)
                }
            }
        }
    } catch (error: any) {
        if (!isMissingColumnError(error)) {
            console.error("Error fetching avatar field:", error)
        } else {
            // Fallback for legacy databases using users.image
            try {
                const legacyAvatarResult = await db.execute(sql`SELECT image FROM users WHERE id = ${userIdNum} LIMIT 1`)
                const legacyAvatar = (legacyAvatarResult as any)?.rows?.[0]?.image as string | null | undefined
                avatarUrl = legacyAvatar || null
            } catch (legacyError) {
                console.error("Error fetching legacy avatar field (image):", legacyError)
            }
        }
    }

    // Split name into first and last name
    const nameParts = user.name.split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    // Get notification settings
    const notificationResult = await getUserNotificationSettings()
    const notificationSettings = notificationResult.success && notificationResult.data ? notificationResult.data : {
        emailNews: true,
        emailServiceInfo: true,
        emailExpiration: true
    }

    return (
        <ProfileClient
            user={{
                id: user.id,
                firstName,
                lastName,
                email: user.email,
                phone,
                address,
                bio,
                avatarUrl,
                createdAt: user.createdAt
            }}
            notificationSettings={notificationSettings}
        />
    )
}
