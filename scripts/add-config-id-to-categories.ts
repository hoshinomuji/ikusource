import { db } from "@/db"
import { sql } from "drizzle-orm"

/**
 * Migration: Add config_id column to hosting_categories table
 * This links hosting categories to DirectAdmin configurations
 */
async function addConfigIdToCategories() {
    try {
        console.log("Adding config_id column to hosting_categories table...")

        // Check if column already exists
        try {
            const checkColumn = await db.execute(sql`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'hosting_categories' 
                AND column_name = 'config_id'
            `)

            // Check if result has rows (format may vary)
            const hasColumn = Array.isArray(checkColumn) && checkColumn.length > 0
                || (checkColumn as any)?.rows?.length > 0
                || (checkColumn as any)?.length > 0

            if (hasColumn) {
                console.log("Column config_id already exists. Skipping migration.")
                return
            }
        } catch (checkError) {
            // If check fails, try to add the column anyway
            console.log("Could not check if column exists, attempting to add...")
        }

        // Add config_id column
        await db.execute(sql`
            ALTER TABLE hosting_categories 
            ADD COLUMN config_id INTEGER 
            REFERENCES directadmin_config(id)
        `)

        console.log("✅ Successfully added config_id column to hosting_categories table")
    } catch (error: any) {
        // Check if error is because column already exists
        if (error?.message?.includes("already exists") || error?.code === "42701") {
            console.log("Column config_id already exists. Skipping migration.")
            return
        }
        console.error("❌ Error adding config_id column:", error)
        throw error
    }
}

// Run migration
addConfigIdToCategories()
    .then(() => {
        console.log("Migration completed successfully")
        process.exit(0)
    })
    .catch((error) => {
        console.error("Migration failed:", error)
        process.exit(1)
    })

