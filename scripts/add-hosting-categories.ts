/**
 * Script to add hosting_categories table and category_id to hosting_packages
 */

import { db } from "../db"
import { sql } from "drizzle-orm"

async function addHostingCategories() {
    try {
        console.log("Creating hosting_categories table...")

        // Create hosting_categories table
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS hosting_categories (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                icon TEXT,
                display_order INTEGER NOT NULL DEFAULT 0,
                is_active BOOLEAN NOT NULL DEFAULT true,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
        `)

        console.log("Adding category_id to hosting_packages...")

        // Add category_id column to hosting_packages
        await db.execute(sql`
            ALTER TABLE hosting_packages
            ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES hosting_categories(id)
        `)

        console.log("✓ Migration completed!")
        console.log("\nNote: You need to create categories and assign them to packages manually.")
    } catch (error) {
        console.error("Error migrating:", error)
        throw error
    }
}

addHostingCategories()
    .then(() => {
        console.log("Done!")
        process.exit(0)
    })
    .catch((error) => {
        console.error("Failed:", error)
        process.exit(1)
    })

