"use server"

import { db } from "@/db"
import { users, passwordResets } from "@/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { createHash, randomBytes } from "crypto"
import { hash } from "bcryptjs"
import { sendEmail } from "@/lib/email-service"
import { headers } from "next/headers"
import { rateLimit } from "@/lib/rate-limit"
import { getSafeAppBaseUrlFromHeaders } from "@/lib/app-url"

const limiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    limit: 3, // 3 attempts
})

function hashResetToken(token: string) {
    return createHash("sha256").update(token).digest("hex")
}

/**
 * Request a password reset
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
        const forwarded = (await headers()).get("x-forwarded-for") || ""
        const ip = forwarded.split(",")[0]?.trim() || "unknown"
        await limiter.check(ip)
    } catch {
        return { success: false, error: "กรุณารอสักครู่ก่อนลองใหม่อีกครั้ง" }
    }

    if (!email) {
        return { success: false, error: "กรุณาระบุอีเมล" }
    }

    try {
        // Check if user exists
        const user = await db.query.users.findFirst({
            where: eq(users.email, email)
        })

        if (!user) {
            // Return success even if user doesn't exist to prevent enumeration
            // But for non-critical app, maybe just tell them.
            // Let's stick to best practice: pretend we sent it.
            return { success: true }
        }

        if (!user.password) {
            return { success: false, error: "บัญชีนี้เข้าสู่ระบบด้วย Google/Discord กรุณาเข้าสู่ระบบผ่านช่องทางนั้น" }
        }

        // Generate token
        const token = randomBytes(32).toString("hex")
        const tokenHash = hashResetToken(token)
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

        // Save token
        await db.insert(passwordResets).values({
            email,
            token: tokenHash,
            expiresAt
        })

        // Get app URL from trusted env or safe local fallback
        const headersList = await headers()
        const appUrl = getSafeAppBaseUrlFromHeaders(headersList)
        const resetLink = `${appUrl}/auth/reset-password?token=${token}`

        // Email content (will be wrapped in template with logo by sendEmail)
        const content = `
            <div style="line-height: 1.8; color: #374151;">
                <h1 style="color: #f97316; margin-top: 0; font-size: 28px; font-weight: 600;">รีเซ็ตรหัสผ่าน</h1>
                <p style="font-size: 16px;">สวัสดี <strong>${user.name || 'คุณ'}</strong>,</p>
                <p style="font-size: 16px;">คุณได้ทำการร้องขอเพื่อรีเซ็ตรหัสผ่านของบัญชี กรุณาคลิกปุ่มด้านล่างเพื่อดำเนินการต่อ:</p>
                
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);">
                        🔑 เปลี่ยนรหัสผ่าน
                    </a>
                </div>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;"><strong>หรือคลิกที่ลิงก์นี้:</strong></p>
                    <p style="margin: 0; word-break: break-all;"><a href="${resetLink}" style="color: #3b82f6; text-decoration: none; font-size: 13px;">${resetLink}</a></p>
                </div>
                
                <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <p style="margin: 0; color: #991b1b; font-size: 14px;">
                        <strong>⚠️ ข้อควรระวัง:</strong><br>
                        • ลิงก์นี้จะหมดอายุใน <strong>1 ชั่วโมง</strong><br>
                        • หากคุณไม่ได้เป็นผู้ร้องขอ กรุณาเพิกเฉยต่ออีเมลฉบับนี้<br>
                        • เพื่อความปลอดภัย กรุณาอย่าแชร์ลิงก์นี้กับผู้อื่น
                    </p>
                </div>
            </div>
        `

        await sendEmail(email, "รีเซ็ตรหัสผ่าน - รีเซ็ตรหัสผ่านของคุณ", content)

        return { success: true }
    } catch (error) {
        console.error("Request reset password error:", error)
        return { success: false, error: "เกิดข้อผิดพลาด กรุณาลองใหม่ในภายหลัง" }
    }
}

/**
 * Verify token success/validity
 */
export async function verifyResetToken(token: string): Promise<{ success: boolean; error?: string }> {
    const tokenHash = hashResetToken(token)
    const record = await db.query.passwordResets.findFirst({
        where: and(
            eq(passwordResets.token, tokenHash),
            gt(passwordResets.expiresAt, new Date())
        )
    })

    if (!record) {
        return { success: false, error: "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว" }
    }

    return { success: true }
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!newPassword || newPassword.length < 6) {
        return { success: false, error: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" }
    }

    try {
        const tokenHash = hashResetToken(token)
        // Validate token
        const record = await db.query.passwordResets.findFirst({
            where: and(
                eq(passwordResets.token, tokenHash),
                gt(passwordResets.expiresAt, new Date())
            )
        })

        if (!record) {
            return { success: false, error: "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว" }
        }

        // Hash new password
        const hashedPassword = await hash(newPassword, 10)

        // Update user
        await db.update(users)
            .set({ password: hashedPassword, updatedAt: new Date() })
            .where(eq(users.email, record.email))

        // Consume token (delete it)
        await db.delete(passwordResets).where(eq(passwordResets.token, tokenHash))

        // Also delete old tokens for this email
        await db.delete(passwordResets).where(eq(passwordResets.email, record.email))

        return { success: true }
    } catch (error) {
        console.error("Reset password error:", error)
        return { success: false, error: "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน" }
    }
}
