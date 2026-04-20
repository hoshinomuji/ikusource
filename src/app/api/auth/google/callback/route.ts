import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getOAuthSettings } from "@/app/actions/settings"
import { setSessionCookie } from "@/lib/session"
import { getSafeAppBaseUrl } from "@/lib/app-url"

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const error = searchParams.get("error")
    const returnedState = searchParams.get("state")
    const cookieStore = await cookies()
    const expectedState = cookieStore.get("oauth_google_state")?.value

    if (error) {
        return redirect("/login?error=oauth_cancelled")
    }

    if (!returnedState || !expectedState || returnedState !== expectedState) {
        return redirect("/login?error=oauth_error&details=google_state")
    }

    cookieStore.delete("oauth_google_state")

    if (!code) {
        return redirect("/login?error=oauth_failed")
    }

    // Validate dynamic settings first, fall back to env
    const settings = await getOAuthSettings()

    // Use settings if configured, otherwise fallback to env
    const clientId = settings.googleClientId || process.env.GOOGLE_CLIENT_ID
    const clientSecret = settings.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET
    const baseUrl = getSafeAppBaseUrl(request.url)

    if (!clientId || !clientSecret) {
        console.error("Google OAuth configuration missing:", {
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret,
        })
        return redirect("/login?error=oauth_error&details=google_config")
    }

    try {
        // Exchange code for access token
        const redirectUri = `${baseUrl}/api/auth/google/callback`
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
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
            let errorJson: any = {}
            try {
                errorJson = JSON.parse(errorText)
            } catch {
                // Not JSON, use text as is
            }

            console.error("Google token exchange failed:", {
                status: tokenResponse.status,
                statusText: tokenResponse.statusText,
                error: errorText,
                errorJson,
                redirectUri,
                hasClientId: !!clientId,
                hasClientSecret: !!clientSecret,
                code: code?.substring(0, 20) + "...", // Log first 20 chars only
            })

            // Check for specific error types
            if (errorJson?.error === "redirect_uri_mismatch") {
                return redirect("/login?error=oauth_error&details=google_redirect&message=" + encodeURIComponent("Redirect URI ไม่ตรงกัน กรุณาตรวจสอบการตั้งค่าใน Google Cloud Console"))
            } else if (errorJson?.error === "invalid_client") {
                return redirect("/login?error=oauth_error&details=google_client&message=" + encodeURIComponent("Client ID หรือ Client Secret ไม่ถูกต้อง"))
            }

            return redirect("/login?error=token_exchange_failed&details=google_token")
        }

        const tokenData = await tokenResponse.json()
        const accessToken = tokenData.access_token

        // Get user info from Google
        const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })

        if (!userInfoResponse.ok) {
            const errorText = await userInfoResponse.text()
            console.error("Google user info fetch failed:", {
                status: userInfoResponse.status,
                statusText: userInfoResponse.statusText,
                error: errorText,
            })
            return redirect("/login?error=user_info_failed&details=google_user")
        }

        const userInfo = await userInfoResponse.json()
        const { email, name, picture } = userInfo

        if (!email) {
            return redirect("/login?error=no_email")
        }

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
            if (picture && !existingUser[0].avatarUrl) {
                await db
                    .update(users)
                    .set({ avatarUrl: picture, updatedAt: new Date() })
                    .where(eq(users.id, userId))
            }
        } else {
            // Create new user
            try {
                const [newUser] = await db
                    .insert(users)
                    .values({
                        name: name || email.split("@")[0],
                        email,
                        password: null, // OAuth users don't need password (use null instead of empty string)
                        avatarUrl: picture || null,
                    })
                    .returning()

                userId = newUser.id
            } catch (dbError: any) {
                console.error("Database error creating user:", dbError)
                // If user creation fails due to password constraint, try without password
                if (dbError?.code === "23502" || dbError?.message?.includes("password")) {
                    const [newUser] = await db
                        .insert(users)
                        .values({
                            name: name || email.split("@")[0],
                            email,
                            password: null,
                            avatarUrl: picture || null,
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

        // Log detailed error information
        const errorDetails = {
            message: error?.message || String(error),
            stack: error?.stack,
            code: error?.code,
            name: error?.name,
            cause: error?.cause,
            redirectUri: `${getSafeAppBaseUrl(request.url)}/api/auth/google/callback`,
            hasClientId: !!process.env.GOOGLE_CLIENT_ID,
            hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
            baseUrl: getSafeAppBaseUrl(request.url),
        }

        console.error("Google OAuth error:", errorDetails)

        // Provide more specific error messages
        let errorType = "oauth_error"
        let errorMessage = "เกิดข้อผิดพลาดในการเข้าสู่ระบบ"

        if (error?.message?.includes("fetch") || error?.message?.includes("network")) {
            errorType = "network_error"
            errorMessage = "ไม่สามารถเชื่อมต่อกับ Google ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต"
        } else if (error?.code === "ECONNREFUSED" || error?.code === "ETIMEDOUT") {
            errorType = "network_error"
            errorMessage = "การเชื่อมต่อหมดเวลา กรุณาลองอีกครั้ง"
        } else if (error?.message?.includes("database") || error?.code?.startsWith("23")) {
            errorType = "database_error"
            errorMessage = "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาติดต่อผู้ดูแลระบบ"
        } else if (error?.message?.includes("redirect_uri_mismatch") || error?.message?.includes("redirect")) {
            errorType = "oauth_error"
            errorMessage = "Redirect URI ไม่ตรงกัน กรุณาตรวจสอบการตั้งค่า Google OAuth"
        } else if (error?.message?.includes("invalid_client") || error?.message?.includes("client")) {
            errorType = "oauth_error"
            errorMessage = "Client ID หรือ Client Secret ไม่ถูกต้อง กรุณาตรวจสอบการตั้งค่า"
        }

        // Log the specific error for debugging
        console.error("Google OAuth specific error:", {
            errorType,
            errorMessage,
            originalError: errorDetails,
        })

        return redirect(`/login?error=${errorType}&details=google&message=${encodeURIComponent(errorMessage)}`)
    }
}

