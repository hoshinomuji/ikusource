import { createHash, createHmac } from "crypto"
import { safeEquals } from "@/lib/secret-crypto"

const replayCache = new Map<string, number>()
const REPLAY_TTL_MS = 5 * 60 * 1000 // 5 minutes
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000 // 5 minutes

function cleanupReplayCache(now: number) {
    for (const [key, expiresAt] of replayCache.entries()) {
        if (expiresAt <= now) replayCache.delete(key)
    }
}

function sha256Hex(data: string) {
    return createHash("sha256").update(data).digest("hex")
}

function canonicalRequest(method: string, path: string, timestamp: string, nonce: string, body: string) {
    return [method.toUpperCase(), path, timestamp, nonce, sha256Hex(body)].join("\n")
}

function signCanonical(secret: string, canonical: string) {
    return createHmac("sha256", secret).update(canonical).digest("hex")
}

export async function verifySignedRequest(
    request: Request,
    secret: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
    const signature = request.headers.get("x-signature")?.trim()
    const timestamp = request.headers.get("x-timestamp")?.trim()
    const nonce = request.headers.get("x-nonce")?.trim()

    if (!signature || !timestamp || !nonce) {
        return { ok: false, reason: "missing_signature_headers" }
    }

    const tsMs = Number.parseInt(timestamp, 10)
    if (!Number.isFinite(tsMs)) return { ok: false, reason: "invalid_timestamp" }

    const now = Date.now()
    if (Math.abs(now - tsMs) > MAX_CLOCK_SKEW_MS) {
        return { ok: false, reason: "timestamp_out_of_window" }
    }

    const replayKey = `${timestamp}:${nonce}`
    cleanupReplayCache(now)
    if (replayCache.has(replayKey)) {
        return { ok: false, reason: "replay_detected" }
    }

    const url = new URL(request.url)
    const body = request.method === "GET" || request.method === "HEAD" ? "" : await request.clone().text()
    const canonical = canonicalRequest(request.method, url.pathname, timestamp, nonce, body)
    const expected = signCanonical(secret, canonical)

    if (!safeEquals(signature, expected)) {
        return { ok: false, reason: "invalid_signature" }
    }

    replayCache.set(replayKey, now + REPLAY_TTL_MS)
    return { ok: true }
}

export function createSignedHeadersForCron(
    method: string,
    path: string,
    secret: string,
    body = ""
): Record<string, string> {
    const timestamp = Date.now().toString()
    const nonce = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
    const canonical = canonicalRequest(method, path, timestamp, nonce, body)
    const signature = signCanonical(secret, canonical)
    return {
        "x-timestamp": timestamp,
        "x-nonce": nonce,
        "x-signature": signature,
    }
}
