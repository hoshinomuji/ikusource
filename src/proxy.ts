import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifySessionToken } from "@/lib/session"

export async function proxy(request: NextRequest) {
    const response = NextResponse.next()

    // Security Headers
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=()"
    )
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")

    const { pathname } = request.nextUrl
    const sessionToken = request.cookies.get("session")?.value
    const sessionUserId = sessionToken ? await verifySessionToken(sessionToken) : null

    // Use NEXT_PUBLIC_APP_URL if defined, otherwise fall back to request origin
    // This fixes issues where the app is behind a proxy and sees internal IP
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

    // Protected Routes (Dashboard)
    if (pathname.startsWith("/dashboard")) {
        if (!sessionUserId) {
            const loginUrl = new URL("/login", appUrl)
            // loginUrl.searchParams.set("from", pathname) // Optional: preserve redirect
            return NextResponse.redirect(loginUrl)
        }
    }

    // Auth Routes (Login/Register)
    if ((pathname.startsWith("/login") || pathname.startsWith("/register")) && sessionUserId) {
        return NextResponse.redirect(new URL("/dashboard", appUrl))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
}
