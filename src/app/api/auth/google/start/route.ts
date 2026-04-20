import { NextResponse } from "next/server"
import { getOAuthSettings } from "@/app/actions/settings"
import { generateOAuthState } from "@/lib/oauth-state"
import { getSafeAppBaseUrl } from "@/lib/app-url"

export async function GET(request: Request) {
  const settings = await getOAuthSettings()
  const clientId = settings.googleClientId || process.env.GOOGLE_CLIENT_ID
  const baseUrl = getSafeAppBaseUrl(request.url)

  if (!clientId) {
    return NextResponse.redirect(new URL("/login?error=oauth_error&details=google_config", baseUrl), 303)
  }

  const state = generateOAuthState()
  const redirectUri = `${baseUrl}/api/auth/google/callback`
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state,
  }).toString()}`

  const response = NextResponse.redirect(googleAuthUrl, 303)
  response.cookies.set("oauth_google_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  })
  return response
}
