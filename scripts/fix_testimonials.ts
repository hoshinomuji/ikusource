
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ DATABASE_URL environment variable is required")
    process.exit(1)
}
const client = postgres(connectionString);
const db = drizzle(client);

async function main() {
    console.log("Creating testimonials table...");

    await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "testimonials" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer REFERENCES "users"("id"),
        "name" text NOT NULL,
        "role" text,
        "company" text,
        "content" text NOT NULL,
        "rating" integer DEFAULT 5 NOT NULL,
        "avatar_url" text,
        "image" text,
        "is_approved" boolean DEFAULT false NOT NULL,
        "is_featured" boolean DEFAULT false NOT NULL,
        "display_order" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
    );
  `);

    console.log("Table created successfully!");
    process.exit(0);
}

main().catch((err) => {
    console.error("Error creating table:", err);
    process.exit(1);
});
