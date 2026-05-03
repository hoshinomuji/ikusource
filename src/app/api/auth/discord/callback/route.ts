import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getOAuthSettings } from "@/app/actions/settings"
import { setSessionCookie } from "@/lib/session"
import { getSafeAppBaseUrl } from "@/lib/app-url"

// Constant-time string comparison to prevent timing attacks
async function constantTimeCompare(a: string, b: string): Promise<boolean> {
    const aBuffer = new TextEncoder().encode(a)
    const bBuffer = new TextEncoder().encode(b)
    
    if (aBuffer.length !== bBuffer.length) {
        return false
    }
    
    let result = 0
    for (let i = 0; i < aBuffer.length; i++) {
        result |= aBuffer[i] ^ bBuffer[i]
    }
    
    return result === 0
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const error = searchParams.get("error")
    const returnedState = searchParams.get("state")
    const cookieStore = await cookies()
    const expectedState = cookieStore.get("oauth_discord_state")?.value
    const stateExpiry = cookieStore.get("oauth_discord_state_expiry")?.value

    if (error) {
        return redirect("/login?error=oauth_cancelled")
    }

    // Validate state parameter (CSRF protection)
    if (!returnedState || !expectedState) {
        return redirect("/login?error=oauth_error&details=missing_state")
    }

    // Validate state expiry (5 minutes)
    if (!stateExpiry || Date.now() > parseInt(stateExpiry)) {
        return redirect("/login?error=oauth_error&details=state_expired")
    }

    // Use constant-time comparison to prevent timing attacks
    const stateMatch = await constantTimeCompare(returnedState, expectedState)
    if (!stateMatch) {
        return redirect("/login?error=oauth_error&details=invalid_state")
    }

    cookieStore.delete("oauth_discord_state")
    cookieStore.delete("oauth_discord_state_expiry")

    if (!code) {
        return redirect("/login?error=oauth_failed")
    }

    // Validate dynamic settings first, fall back to env
    const settings = await getOAuthSettings()

    // Use settings if configured, otherwise fallback to env (for backward compatibility)
    const clientId = settings.discordClientId || process.env.DISCORD_CLIENT_ID
    const clientSecret = settings.discordClientSecret || process.env.DISCORD_CLIENT_SECRET
    const baseUrl = getSafeAppBaseUrl(request.url)

    if (!clientId || !clientSecret) {
        console.error("Discord OAuth configuration missing:", {
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret,
        })
        return redirect("/login?error=oauth_error&details=discord_config")
    }

    try {
        // Exchange code for access token
        const redirectUri = `${baseUrl}/api/auth/discord/callback`
        const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        })

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text()
            console.error("Discord token exchange failed:", {
                status: tokenResponse.status,
                statusText: tokenResponse.statusText,
                error: errorText,
                redirectUri,
                hasClientId: !!clientId,
                hasClientSecret: !!clientSecret,
            })
            return redirect("/login?error=token_exchange_failed&details=discord_token")
        }

        const tokenData = await tokenResponse.json()
        const accessToken = tokenData.access_token

        // Get user info from Discord
        const userInfoResponse = await fetch("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })

        if (!userInfoResponse.ok) {
            const errorText = await userInfoResponse.text()
            console.error("Discord user info fetch failed:", {
                status: userInfoResponse.status,
                statusText: userInfoResponse.statusText,
                error: errorText,
            })
            return redirect("/login?error=user_info_failed&details=discord_user")
        }

        const userInfo = await userInfoResponse.json()
        const { email, username, global_name, avatar, id } = userInfo

        if (!email) {
            return redirect("/login?error=no_email")
        }

        // Discord avatar URL format
        const avatarUrl = avatar
            ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`
            : null

        // Check if user exists with this email
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1)

        let userId: number

        if (existingUser.length > 0) {
            // User exists, use existing account
            userId = existingUser[0].id

            // Update avatar if available and not set
            if (avatarUrl && !existingUser[0].avatarUrl) {
                await db
                    .update(users)
                    .set({ avatarUrl, updatedAt: new Date() })
                    .where(eq(users.id, userId))
            }
        } else {
            // Create new user
            try {
                const displayName = global_name || username || email.split("@")[0]
                const [newUser] = await db
                    .insert(users)
                    .values({
                        name: displayName,
                        email,
                        password: null, // OAuth users don't need password (use null instead of empty string)
                        avatarUrl,
                    })
                    .returning()

                userId = newUser.id
            } catch (dbError: any) {
                console.error("Database error creating user:", dbError)
                // If user creation fails due to password constraint, try without password
                if (dbError?.code === "23502" || dbError?.message?.includes("password")) {
                    const displayName = global_name || username || email.split("@")[0]
                    const [newUser] = await db
                        .insert(users)
                        .values({
                            name: displayName,
                            email,
                            password: null,
                            avatarUrl,
                        })
                        .returning()
                    userId = newUser.id
                } else {
                    throw dbError
                }
            }
        }

        // Create session
        await setSessionCookie(await cookies(), userId)

        return redirect("/dashboard")
    } catch (error: any) {
        // NEXT_REDIRECT is not a real error - it's how Next.js redirects
        // We should re-throw it to allow the redirect to work
        if (error?.message === "NEXT_REDIRECT" || error?.digest?.startsWith("NEXT_REDIRECT")) {
            throw error
        }

        console.error("Discord OAuth error:", {
            error: error?.message || error,
            stack: error?.stack,
            code: error?.code,
            name: error?.name,
        })

        // Provide more specific error messages
        let errorType = "oauth_error"
        if (error?.message?.includes("fetch")) {
            errorType = "network_error"
        } else if (error?.code === "ECONNREFUSED" || error?.code === "ETIMEDOUT") {
            errorType = "network_error"
        } else if (error?.message?.includes("database") || error?.code?.startsWith("23")) {
            errorType = "database_error"
        }

        return redirect(`/login?error=${errorType}&details=discord`)
    }
}
