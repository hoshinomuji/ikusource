/**
 * Script to migrate directAdminPackageId (integer) to directAdminPackageName (text)
 * and add configId column
 */

import { db } from "../db"
import { sql } from "drizzle-orm"

async function migratePackageFields() {
    try {
        console.log("Migrating hosting packages table...")

        // Add new columns if they don't exist
        await db.execute(sql`
            ALTER TABLE hosting_packages
            ADD COLUMN IF NOT EXISTS directadmin_package_name TEXT,
            ADD COLUMN IF NOT EXISTS config_id INTEGER REFERENCES directadmin_config(id)
        `)

        // Drop old column if exists (be careful with this in production)
        // await db.execute(sql`
        //     ALTER TABLE hosting_packages
        //     DROP COLUMN IF EXISTS directadmin_package_id
        // `)

        console.log("✓ Migration completed!")
        console.log("\nNote: You need to update existing packages with their DirectAdmin Package Names manually.")
    } catch (error) {
        console.error("Error migrating:", error)
        throw error
    }
}

migratePackageFields()
    .then(() => {
        console.log("Done!")
        process.exit(0)
    })
    .catch((error) => {
        console.error("Failed:", error)
        process.exit(1)
    })

