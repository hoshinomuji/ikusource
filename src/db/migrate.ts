
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./index";
import path from "path";

export async function runMigrations() {
    try {
        console.log("[Migration] Starting database migration...");

        // Use absolute path from project root
        const migrationsPath = path.join(process.cwd(), "drizzle");

        // This will automatically run needed migrations from the "drizzle" folder
        await migrate(db, { migrationsFolder: migrationsPath });

        console.log("[Migration] Database migration completed successfully");
    } catch (error) {
        console.error("[Migration] Database migration failed:", error);
        // Don't exit process here, just log error, so the app can still try to start
        // or let the error bubble up if critical
    }
}

