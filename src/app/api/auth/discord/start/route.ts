import { NextResponse } from "next/server"
import { getOAuthSettings } from "@/app/actions/settings"
import { generateOAuthState } from "@/lib/oauth-state"
import { getSafeAppBaseUrl } from "@/lib/app-url"

export async function GET(request: Request) {
  const settings = await getOAuthSettings()
  const clientId = settings.discordClientId || process.env.DISCORD_CLIENT_ID
  const baseUrl = getSafeAppBaseUrl(request.url)

  if (!clientId) {
    return NextResponse.redirect(new URL("/login?error=oauth_error&details=discord_config", baseUrl), 303)
  }

  const state = generateOAuthState()
  const redirectUri = `${baseUrl}/api/auth/discord/callback`
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?${new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify email",
    state,
  }).toString()}`

  const response = NextResponse.redirect(discordAuthUrl, 303)
  response.cookies.set("oauth_discord_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  })
  return response
}
