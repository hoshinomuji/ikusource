"use server"

import { getSessionUserIdValue } from "@/lib/session"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { hash, compare } from "bcryptjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { z } from "zod"
const updateProfileSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    address: z.string().optional(),
    bio: z.string().optional(),
    avatarUrl: z.string().optional(),
})

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

export type ProfileState = {
    success?: boolean
    error?: string
    fieldErrors?: {
        [key: string]: string[]
    }
}

function isMissingColumnError(error: unknown): boolean {
    const err = error as { code?: string; message?: string } | undefined
    const message = err?.message || ""
    return err?.code === "42703" || message.includes("column") || message.includes("does not exist")
}

export async function updateProfile(prevState: ProfileState, formData: FormData): Promise<ProfileState> {
    const cookieStore = await cookies()
    const userId = await getSessionUserIdValue(cookieStore)

    if (!userId) {
        return { error: "Unauthorized" }
    }

    const userIdNum = parseInt(userId)

    const rawData = {
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string || "",
        address: formData.get("address") as string || "",
        bio: formData.get("bio") as string || "",
        avatarUrl: formData.get("avatarUrl") as string || "",
    }

    const validatedFields = updateProfileSchema.safeParse(rawData)

    if (!validatedFields.success) {
        return {
            error: "Invalid input",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { firstName, lastName, email, phone, address, bio, avatarUrl } = validatedFields.data
    const fullName = `${firstName} ${lastName}`.trim()

    try {
        // Check if email is already taken by another user
        const existingUserResult = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1)

        const existingUser = existingUserResult[0]
        if (existingUser && existingUser.id !== userIdNum) {
            return { error: "Email is already taken by another user" }
        }

        let normalizedAvatarUrl: string | null = null
        const trimmedAvatarUrl = (avatarUrl || "").trim()
        if (trimmedAvatarUrl.length > 0) {
            try {
                const parsed = new URL(trimmedAvatarUrl)
                if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                    return { error: "Avatar URL must start with http:// or https://" }
                }
                normalizedAvatarUrl = parsed.toString()
            } catch {
                return { error: "Invalid avatar URL" }
            }
        }

        // Always update core fields first
        const baseUpdateData = {
            name: fullName,
            email,
            updatedAt: new Date(),
        }

        try {
            await db
                .update(users)
                .set(baseUpdateData)
                .where(eq(users.id, userIdNum))
        } catch (baseError) {
            if (!isMissingColumnError(baseError)) {
                throw baseError
            }

            await db
                .update(users)
                .set({
                    name: fullName,
                    email,
                })
                .where(eq(users.id, userIdNum))
        }

        // Update optional fields in isolated queries so one missing column does not fail all updates
        const optionalFieldUpdates: Array<{ key: "phone" | "address" | "bio"; value: string | null }> = [
            { key: "phone", value: phone || null },
            { key: "address", value: address || null },
            { key: "bio", value: bio || null },
        ]

        for (const item of optionalFieldUpdates) {
            try {
                await db
                    .update(users)
                    .set({ [item.key]: item.value, updatedAt: new Date() } as any)
                    .where(eq(users.id, userIdNum))
            } catch (optionalError) {
                console.warn(`Skipped optional users.${item.key} update:`, optionalError)
            }
        }

        try {
            await db
                .update(users)
                .set({ avatarUrl: normalizedAvatarUrl, updatedAt: new Date() })
                .where(eq(users.id, userIdNum))
        } catch (avatarError) {
            if (!isMissingColumnError(avatarError)) {
                console.error("Avatar database update error:", avatarError)
                return { error: "Failed to save profile image in database." }
            }
        }

        // Keep legacy column in sync when it exists (ignore if missing)
        try {
            await db.execute(sql`UPDATE users SET image = ${normalizedAvatarUrl} WHERE id = ${userIdNum}`)
        } catch (legacyAvatarError) {
            let savedToAvatarUrl = false
            try {
                const verifyAvatar = await db
                    .select({ avatarUrl: users.avatarUrl })
                    .from(users)
                    .where(eq(users.id, userIdNum))
                    .limit(1)
                if (verifyAvatar[0] && verifyAvatar[0].avatarUrl === normalizedAvatarUrl) {
                    savedToAvatarUrl = true
                }
            } catch {
                savedToAvatarUrl = false
            }
            if (!isMissingColumnError(legacyAvatarError) && !savedToAvatarUrl) {
                console.error("Legacy avatar(image) update error:", legacyAvatarError)
                return { error: "Failed to save profile image in database." }
            }
        }

        revalidatePath("/dashboard/profile")
        return { success: true }
    } catch (error) {
        console.error("Update profile error:", error)
        return { error: "Failed to update profile. Please try again." }
    }
}

export async function changePassword(prevState: ProfileState, formData: FormData): Promise<ProfileState> {
    const cookieStore = await cookies()
    const userId = await getSessionUserIdValue(cookieStore)

    if (!userId) {
        return { error: "Unauthorized" }
    }

    const userIdNum = parseInt(userId)

    const rawData = {
        currentPassword: formData.get("currentPassword") as string,
        newPassword: formData.get("newPassword") as string,
        confirmPassword: formData.get("confirmPassword") as string,
    }

    const validatedFields = changePasswordSchema.safeParse(rawData)

    if (!validatedFields.success) {
        return {
            error: "Invalid input",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { currentPassword, newPassword } = validatedFields.data

    try {
        // Get current user
        const userResult = await db
            .select({ password: users.password })
            .from(users)
            .where(eq(users.id, userIdNum))
            .limit(1)

        const user = userResult[0]
        if (!user) {
            return { error: "User not found" }
        }

        // Verify current password
        const passwordsMatch = await compare(currentPassword, user.password)

        if (!passwordsMatch) {
            return { error: "Current password is incorrect" }
        }

        // Hash new password
        const hashedPassword = await hash(newPassword, 10)

        // Update password
        await db
            .update(users)
            .set({
                password: hashedPassword,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userIdNum))

        revalidatePath("/dashboard/profile")
        return { success: true }
    } catch (error) {
        console.error("Change password error:", error)
        return { error: "Failed to change password. Please try again." }
    }
}

