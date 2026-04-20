import type { Config } from "drizzle-kit";

// Parse DATABASE_URL if provided, otherwise use individual env vars
function getDbConfig() {
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl) {
        // Parse postgres://user:password@host:port/database
        const url = new URL(databaseUrl);
        return {
            host: url.hostname,
            user: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            database: decodeURIComponent(url.pathname.slice(1)), // Remove leading /
            port: parseInt(url.port || "5432"),
            ssl: url.searchParams.get("sslmode") === "require",
        };
    }

    return {
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        database: process.env.DB_NAME || "postgres",
        port: parseInt(process.env.DB_PORT || "5432"),
        ssl: process.env.DB_SSL === "true",
    };
}

export default {
    schema: "./src/db/schema.ts",
    out: "./src/drizzle",
    dialect: "postgresql",
    dbCredentials: getDbConfig(),
} satisfies Config;

