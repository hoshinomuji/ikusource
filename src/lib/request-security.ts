import type { NextRequest } from "next/server"
import { getAppBaseUrlFromEnv, getSafeAppBaseUrl } from "@/lib/app-url"

function parseOrigin(value: string | null): string | null {
    if (!value) return null
    try { return new URL(value).origin }
    catch { return null }
}

export function isTrustedSameOriginRequest(request: NextRequest): boolean {
    const trustedOrigin = getAppBaseUrlFromEnv() || getSafeAppBaseUrl(request.url)
    const origin = parseOrigin(request.headers.get("origin"))
    if (origin) return origin === trustedOrigin
    const referer = parseOrigin(request.headers.get("referer"))
    if (referer) return referer === trustedOrigin

    // No origin or referer header present — reject to prevent CSRF attacks
    // from headless clients, server-to-server calls, or browser-less contexts.
    // If you have legitimate internal clients that omit these headers, use a
    // signed request pattern (see src/lib/request-signature.ts) instead.
    return false
}
