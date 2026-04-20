function sanitizeHttpUrl(value?: string | null): string | null {
    if (!value) return null
    const trimmed = value.trim()
    if (!trimmed) return null
    try {
        const parsed = new URL(trimmed)
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null
        return parsed.origin
    } catch {
        return null
    }
}

export function getAppBaseUrlFromEnv(): string | null {
    return sanitizeHttpUrl(process.env.NEXT_PUBLIC_APP_URL) || sanitizeHttpUrl(process.env.NEXT_PUBLIC_BASE_URL)
}

export function getSafeAppBaseUrl(requestUrl?: string): string {
    const fromEnv = getAppBaseUrlFromEnv()
    if (fromEnv) return fromEnv

    // Only allow implicit runtime origin fallback outside production.
    if (process.env.NODE_ENV !== "production" && requestUrl) {
        const fromRequest = sanitizeHttpUrl(requestUrl)
        if (fromRequest) return fromRequest
    }

    return "http://localhost:3000"
}

export function getSafeAppBaseUrlFromHeaders(headers: Headers): string {
    const fromEnv = getAppBaseUrlFromEnv()
    if (fromEnv) return fromEnv

    if (process.env.NODE_ENV !== "production") {
        const host = headers.get("host")?.trim()
        const proto = headers.get("x-forwarded-proto")?.trim() || "http"
        if (host && /^[a-zA-Z0-9._:-]+$/.test(host) && (proto === "http" || proto === "https")) {
            const fromHeader = sanitizeHttpUrl(`${proto}://${host}`)
            if (fromHeader) return fromHeader
        }
    }

    return "http://localhost:3000"
}
