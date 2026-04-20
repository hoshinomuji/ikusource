import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { resolveDatabaseUrl } from "./config";

const globalForDb = globalThis as unknown as {
    conn: postgres.Sql | undefined;
};

const resolvedDatabase = resolveDatabaseUrl()
const connectionString = resolvedDatabase.url
const hasDbConfig = resolvedDatabase.configured

// Disable prefetch as it is not supported for "Transaction" pool mode
// Note: Connection is created even without DATABASE_URL, but queries will fail gracefully
// This is handled in the action functions with try-catch and fallback values
const client = globalForDb.conn ?? postgres(connectionString, { 
    prepare: false,
    // Fail fast when DB env is not configured (common during local/CI builds without DB)
    connect_timeout: hasDbConfig ? 10 : 1,
    // Keep pool tiny when DB is not configured to avoid hanging retries
    max: hasDbConfig ? undefined : 1,
});

if (process.env.NODE_ENV !== "production") {
    globalForDb.conn = client;
}

export const db = drizzle(client, { schema });
