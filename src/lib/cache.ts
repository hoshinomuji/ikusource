/**
 * Simple in-memory cache with TTL support.
 * Use for frequently accessed, rarely changing data (e.g., system settings, packages).
 * NOT suitable for multi-instance deployments — use Redis for that.
 */

interface CacheEntry<T> {
    value: T
    expiresAt: number
}

type CacheStore = Map<string, CacheEntry<unknown>>

const DEFAULT_TTL_MS = 60_000 // 1 minute default

const stores: Map<string, CacheStore> = new Map()

function getStore(namespace: string): CacheStore {
    if (!stores.has(namespace)) {
        stores.set(namespace, new Map())
    }
    return stores.get(namespace)!
}

/**
 * Get a cached value. Returns undefined if not found or expired.
 */
export function cacheGet<T>(namespace: string, key: string): T | undefined {
    const store = getStore(namespace)
    const entry = store.get(key) as CacheEntry<T> | undefined

    if (!entry) return undefined

    if (Date.now() > entry.expiresAt) {
        store.delete(key)
        return undefined
    }

    return entry.value
}

/**
 * Set a cached value with optional TTL (default: 60 seconds).
 */
export function cacheSet<T>(namespace: string, key: string, value: T, ttlMs?: number): void {
    const store = getStore(namespace)
    const expiresAt = Date.now() + (ttlMs ?? DEFAULT_TTL_MS)
    store.set(key, { value, expiresAt })
}

/**
 * Delete a cached value.
 */
export function cacheDel(namespace: string, key: string): void {
    const store = getStore(namespace)
    store.delete(key)
}

/**
 * Clear all cached values in a namespace.
 */
export function cacheClear(namespace: string): void {
    const store = getStore(namespace)
    store.clear()
}

/**
 * Get a value from cache, or fetch it if not cached / expired.
 * Handles cache stampede by using a lock per key.
 */
const locks: Map<string, boolean> = new Map()

export async function cacheOrFetch<T>(
    namespace: string,
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 30_000
): Promise<T> {
    const cached = cacheGet<T>(namespace, key)
    if (cached !== undefined) return cached

    // Prevent stampede: wait if another request is already fetching this key
    while (locks.get(`${namespace}:${key}`)) {
        await new Promise(resolve => setTimeout(resolve, 50))
    }

    // Double-check after waiting
    const cached2 = cacheGet<T>(namespace, key)
    if (cached2 !== undefined) return cached2

    // Mark as locked
    locks.set(`${namespace}:${key}`, true)

    try {
        const value = await fetcher()
        cacheSet(namespace, key, value, ttlMs)
        return value
    } finally {
        locks.delete(`${namespace}:${key}`)
    }
}
