
"use server"

import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { cookies } from "next/headers"
import * as OTPAuth from "otpauth"
import { randomBytes } from "crypto"

// Type definition for 2FA setup result
export type TwoFactorSetupResult = {
    success: boolean
    secret?: string
    otpauthUrl?: string
    error?: string
}

/**
 * Generate a new 2FA secret for a user
 */
export async function generate2FASecret(userId: number): Promise<TwoFactorSetupResult> {
    try {
        // Check user existence
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        })

        if (!user) {
            return { success: false, error: "User not found" }
        }

        // Generate a new secret (base32 encoded)
        const secret = new OTPAuth.Secret({ size: 20 })
        const secretStr = secret.base32

        // Fetch store name from settings
        const { getWebsiteSettings } = await import("@/app/actions/settings")
        const settings = await getWebsiteSettings()
        const storeName = settings.storeName || process.env.NEXT_PUBLIC_STORE_NAME || "Ikuzen Studio"

        // Create OTPAuth URL
        // User requested format: "Store Name - User"
        // We set issuer to StoreName and label to User Email to achieve standard display
        const totp = new OTPAuth.TOTP({
            issuer: storeName,
            label: `${storeName} - ${user.name || user.email}`,
            algorithm: "SHA1",
            digits: 6,
            period: 30,
            secret: secret,
        })

        const otpauthUrl = totp.toString()

        return {
            success: true,
            secret: secretStr,
            otpauthUrl: otpauthUrl,
        }
    } catch (error) {
        console.error("Error generating 2FA secret:", error)
        return { success: false, error: "Failed to generate 2FA secret" }
    }
}

/**
 * Verify and Enable 2FA for the user
 */
export async function enable2FA(userId: number, token: string, secret: string) {
    try {
        // Verify the token with the provided secret before saving
        const totp = new OTPAuth.TOTP({
            algorithm: "SHA1",
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(secret),
        })

        // validate() returns null if invalid, or delta if valid
        const delta = totp.validate({ token, window: 1 })

        if (delta === null) {
            return { success: false, error: "Invalid verification code" }
        }

        // Save secret and enable 2FA
        await db.update(users)
            .set({
                twoFactorSecret: secret,
                twoFactorEnabled: true,
            })
            .where(eq(users.id, userId))

        return { success: true }
    } catch (error) {
        console.error("Error enabling 2FA:", error)
        return { success: false, error: "Failed to enable 2FA" }
    }
}

/**
 * Disable 2FA
 */
export async function disable2FA(userId: number) {
    try {
        await db.update(users)
            .set({
                twoFactorSecret: null,
                twoFactorEnabled: false,
            })
            .where(eq(users.id, userId))

        return { success: true }
    } catch (error) {
        console.error("Error disabling 2FA:", error)
        return { success: false, error: "Failed to disable 2FA" }
    }
}

/**
 * Verify 2FA token during login or sensitive action
 */
export async function verify2FA(userId: number, token: string) {
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { twoFactorSecret: true }
        })

        if (!user || !user.twoFactorSecret) {
            return { success: false, error: "2FA not configured for this user" }
        }

        const totp = new OTPAuth.TOTP({
            algorithm: "SHA1",
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
        })

        const delta = totp.validate({ token, window: 1 })

        if (delta === null) {
            return { success: false, error: "Invalid code" }
        }

        return { success: true }
    } catch (error) {
        console.error("Error verifying 2FA:", error)
        return { success: false, error: "Verification failed" }
    }
}
