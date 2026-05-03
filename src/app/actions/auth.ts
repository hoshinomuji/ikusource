"use server"

import { db } from "@/db"
import { users } from "@/db/schema"
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/auth-schema"
import { eq } from "drizzle-orm"
import { hash, compare } from "bcryptjs"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { rateLimit } from "@/lib/rate-limit"
import { headers } from "next/headers"
import { getSessionUserIdValue, setSessionCookie } from "@/lib/session"

const limiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    limit: 5, // 5 attempts per IP
})

export type AuthState = {
    success?: boolean
    error?: string
    requires2FA?: boolean
    userId?: string
    fieldErrors?: {
        [key: string]: string[]
    }
}
function isDatabaseUnavailableError(error: unknown) {
    const errorCode = (error as any)?.code || (error as any)?.cause?.code
    return errorCode === "ECONNREFUSED" || errorCode === "42P01"
}

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const rawData = Object.fromEntries(formData.entries())
    const validatedFields = loginSchema.safeParse(rawData)

    if (!validatedFields.success) {
        return {
            error: "Invalid input",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        }
    }

    try {
        const ip = (await headers()).get("x-forwarded-for") || "unknown"
        await limiter.check(ip)
    } catch (e) {
        return { error: "Too many login attempts. Please try again after 1 minute." }
    }

    const { email, password } = validatedFields.data

    try {
        const userResult = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1)

        const user = userResult[0]
        if (!user) {
            return { error: "Invalid email or password" }
        }

        // Check if user has a password (not OAuth user)
        if (!user.password) {
            return { error: "This account uses OAuth login. Please sign in with Google or Discord." }
        }

        const passwordsMatch = await compare(password, user.password)

        if (!passwordsMatch) {
            return { error: "Invalid email or password" }
        }

        // Check if 2FA is enabled
        if (user.twoFactorEnabled) {
            const expires = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes validity for 2FA step
                ; (await cookies()).set("2fa_pending_user", user.id.toString(), {
                    httpOnly: true,
                    secure: true,
                    expires,
                    sameSite: "strict",
                    path: "/",
                })

            return {
                success: false,
                requires2FA: true,
                userId: user.id.toString()
            }
        }

        // Create session
        await setSessionCookie(await cookies(), user.id)

    } catch (error) {
        if (isDatabaseUnavailableError(error)) {
            return { error: "Database is currently unavailable. Please try again later." }
        }
        console.error("Login Error:", error)
        return { error: "Something went wrong. Please try again." }
    }

    redirect("/dashboard")
}

export async function verifyLogin2FAAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const token = formData.get("code") as string

    if (!token || token.length !== 6) {
        return { error: "Please enter a valid 6-digit code" }
    }

    const result = await verifyLogin2FA(token)

    if (result.success) {
        redirect("/dashboard")
    }

    return result
}

export async function verifyLogin2FA(token: string): Promise<AuthState> {
    try {
        const cookieStore = await cookies()
        const pendingUserId = cookieStore.get("2fa_pending_user")?.value

        if (!pendingUserId) {
            return { error: "Session expired. Please login again." }
        }

        const userId = parseInt(pendingUserId)

        // Verify 2FA token
        const { verify2FA } = await import("@/app/actions/auth-2fa")
        const result = await verify2FA(userId, token)

        if (!result.success) {
            return { error: result.error || "Invalid verification code" }
        }

        // 2FA Verified - Create Session
        await setSessionCookie(cookieStore, userId)

        // Clear pending cookie
        cookieStore.delete("2fa_pending_user")

        return { success: true }

    } catch (error) {
        console.error("2FA Login Error:", error)
        return { error: "Verification failed. Please try again." }
    }
}

export async function register(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const rawData = Object.fromEntries(formData.entries())
    const validatedFields = registerSchema.safeParse(rawData)

    if (!validatedFields.success) {
        return {
            error: "Invalid input",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { name, email, password, phone } = validatedFields.data

    try {
        const existingUserResult = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1)

        if (existingUserResult[0]) {
            return { error: "User already exists with this email" }
        }

        const hashedPassword = await hash(password, 10)

        const [newUser] = await db.insert(users).values({
            name,
            email,
            password: hashedPassword,
            phone,
        }).returning()

        // Create session immediately after registration
        await setSessionCookie(await cookies(), newUser.id)

        // Send Discord notification
        try {
            const { sendDiscordNotification } = await import("@/lib/discord-notify")
            await sendDiscordNotification("register", {
                name: newUser.name,
                email: newUser.email,
                id: newUser.id
            })
        } catch (error) {
            console.error("Failed to send Discord notification:", error)
        }

    } catch (error) {
        return { error: "Failed to create account. Please try again." }
    }

    redirect("/dashboard")
}


export async function generateTwoFactorSecret(email: string) {
    try {
        const cookieStore = await cookies()
        const userId = await getSessionUserIdValue(cookieStore)

        if (!userId) {
            return { success: false, error: "เธเธฃเธธเธ“เธฒเน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธเธเนเธญเธ" }
        }

        const { generate2FASecret } = await import("@/app/actions/auth-2fa")
        const result = await generate2FASecret(parseInt(userId))

        if (result.success) {
            return {
                success: true,
                secret: result.secret,
                otpauth: result.otpauthUrl
            }
        }
        return { success: false, error: result.error }
    } catch (error) {
        return { success: false, error: "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเธชเธฃเนเธฒเธเธฃเธซเธฑเธชเธฅเธฑเธ" }
    }
}

export async function enableTwoFactor(token: string, secret: string) {
    try {
        const cookieStore = await cookies()
        const userId = await getSessionUserIdValue(cookieStore)

        if (!userId) {
            return { success: false, error: "เธเธฃเธธเธ“เธฒเน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธเธเนเธญเธ" }
        }

        const { enable2FA } = await import("@/app/actions/auth-2fa")
        return await enable2FA(parseInt(userId), token, secret)
    } catch (error) {
        return { success: false, error: "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเน€เธเธดเธ”เนเธเนเธเธฒเธ 2FA" }
    }
}

export async function disableTwoFactor() {
    try {
        const cookieStore = await cookies()
        const userId = await getSessionUserIdValue(cookieStore)

        if (!userId) {
            return { success: false, error: "เธเธฃเธธเธ“เธฒเน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธเธเนเธญเธ" }
        }

        const { disable2FA } = await import("@/app/actions/auth-2fa")
        return await disable2FA(parseInt(userId))
    } catch (error) {
        return { success: false, error: "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเธเธดเธ”เนเธเนเธเธฒเธ 2FA" }
    }
}
