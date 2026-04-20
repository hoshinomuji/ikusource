import { NextResponse } from "next/server"
import { getSafeAppBaseUrl } from "@/lib/app-url"

function createSignoutResponse(request: Request) {
    const appUrl = getSafeAppBaseUrl(request.url)

    const response = NextResponse.redirect(new URL("/login", appUrl), 303)

    // Clear all auth-related cookies used by this app.
    response.cookies.set("userId", "", {
        expires: new Date(0),
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    })
    response.cookies.set("session", "", {
        expires: new Date(0),
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    })
    response.cookies.set("2fa_pending_user", "", {
        expires: new Date(0),
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    })

    return response
}

export async function POST(request: Request) {
    return createSignoutResponse(request)
}

export async function GET() {
    return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}
