import type { NextRequest } from "next/server"
import { getAppBaseUrlFromEnv, getSafeAppBaseUrl } from "@/lib/app-url"

function parseOrigin(value: string | null): string | null {
    if (!value) return null
    try {
        return new URL(value).origin
    } catch {
        return null
    }
}

export function isTrustedSameOriginRequest(request: NextRequest): boolean {
    const trustedOrigin = getAppBaseUrlFromEnv() || getSafeAppBaseUrl(request.url)

    const origin = parseOrigin(request.headers.get("origin"))
    if (origin) return origin === trustedOrigin

    const referer = parseOrigin(request.headers.get("referer"))
    if (referer) return referer === trustedOrigin

    // Some clients (mobile/native/server-to-server) may not send origin/referer.
    return true
}
