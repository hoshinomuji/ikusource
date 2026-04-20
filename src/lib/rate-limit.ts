
type RateLimitStore = Map<string, { count: number; expiresAt: number }>;

const limiters: Map<string, RateLimitStore> = new Map();

interface RateLimitConfig {
    uniqueTokenPerInterval?: number; // Max number of unique tokens per interval (to prevent memory leaks)
    interval?: number; // Interval in milliseconds
    limit?: number; // Max number of requests per interval
}

export function rateLimit(options: RateLimitConfig = {}) {
    const interval = options.interval || 60000; // Default 1 minute
    const limit = options.limit || 5; // Default 5 requests
    const uniqueTokenPerInterval = options.uniqueTokenPerInterval || 500;

    const storage: RateLimitStore = new Map();

    return {
        check: async (token: string): Promise<void> => {
            const now = Date.now();
            const record = storage.get(token);

            // Clean up expired tokens
            if (storage.size > uniqueTokenPerInterval) {
                for (const [key, value] of storage.entries()) {
                    if (value.expiresAt < now) {
                        storage.delete(key);
                    }
                }
            }

            if (record && record.expiresAt > now) {
                if (record.count >= limit) {
                    throw new Error("Rate limit exceeded");
                }
                record.count++;
            } else {
                storage.set(token, {
                    count: 1,
                    expiresAt: now + interval,
                });
            }
        },
    };
}
