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

    throw new Error(
        "NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_BASE_URL environment variable is required. " +
        "Do not rely on implicit localhost fallback in any environment. " +
        "Set to your application's full URL (e.g., https://example.com)"
    )
}

export function getSafeAppBaseUrlFromHeaders(headers: Headers): string {
    const fromEnv = getAppBaseUrlFromEnv()
    if (fromEnv) return fromEnv

    throw new Error(
        "NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_BASE_URL environment variable is required. " +
        "Do not rely on Host header fallback in any environment. " +
        "Set to your application's full URL (e.g., https://example.com)"
    )
}
