"use server"

import { db } from "@/db"
import { passwordResets, users } from "@/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { sendEmail } from "@/lib/email-service"
import { createHash, randomBytes } from "crypto"
import { headers } from "next/headers"
import { getSafeAppBaseUrlFromHeaders } from "@/lib/app-url"
import { hash } from "bcryptjs"

// Enforce same password policy as registration
const MIN_PASSWORD_LENGTH = 8

function hashResetToken(token: string) {
    return createHash("sha256").update(token).digest("hex")
}

export async function requestPasswordReset(email: string) {
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.email, email)
        })

        // Always return success to prevent user enumeration
        const accountExists = Boolean(user && user.password)

        if (!user || !user.password) {
            return { success: true, message: "หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปให้แล้ว" }
        }

        // Cleanup expired tokens BEFORE creating a new one
        await db.delete(passwordResets).where(eq(passwordResets.email, email))

        const token = randomBytes(32).toString("hex")
        const tokenHash = hashResetToken(token)
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60)

        await db.insert(passwordResets).values({
            email,
            token: tokenHash,
            expiresAt
        })

        if (accountExists) {
            const headersList = await headers()
            const appUrl = getSafeAppBaseUrlFromHeaders(headersList)
            const resetLink = `${appUrl}/auth/reset-password?token=${token}`

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
        }

        return { success: true, message: "ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลเรียบร้อยแล้ว" }

    } catch (error) {
        console.error("Password reset request error:", error)
        return { success: false, error: "เกิดข้อผิดพลาด กรุณาลองใหม่ภายหลัง" }
    }
}

/**
 * Confirm password reset — validates token and sets new password.
 * Token is single-use and expires after 1 hour.
 */
export async function resetPasswordConfirm(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
        if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
            return { success: false, error: `รหัสผ่านต้องมีอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร` }
        }

        const tokenHash = hashResetToken(token)

        const resetRecords = await db
            .select()
            .from(passwordResets)
            .where(
                and(
                    eq(passwordResets.token, tokenHash),
                    gt(passwordResets.expiresAt, new Date())
                )
            )
            .limit(1)

        if (!resetRecords || resetRecords.length === 0) {
            return { success: true, message: "รีเซ็ตรหัสผ่านเรียบร้อยแล้ว" }
        }

        const resetRecord = resetRecords[0]

        const userRecords = await db
            .select()
            .from(users)
            .where(eq(users.email, resetRecord.email))
            .limit(1)

        if (!userRecords || userRecords.length === 0) {
            return { success: false, error: "ไม่พบผู้ใช้งาน" }
        }

        const user = userRecords[0]

        const hashedPassword = await hash(newPassword, 10)
        await db
            .update(users)
            .set({
                password: hashedPassword,
                updatedAt: new Date(),
            })
            .where(eq(users.id, user.id))

        // Delete token immediately (one-time use)
        await db.delete(passwordResets).where(eq(passwordResets.id, resetRecord.id))

        return { success: true, message: "รีเซ็ตรหัสผ่านเรียบร้อยแล้ว" }

    } catch (error) {
        console.error("Password reset confirm error:", error)
        return { success: false, error: "เกิดข้อผิดพลาด กรุณาลองใหม่ภายหลัง" }
    }
}
