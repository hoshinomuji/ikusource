/**
 * Script to add directAdminPackageId column to hosting_packages table
 */

import { db } from "../db"
import { sql } from "drizzle-orm"

async function addDirectAdminPackageIdColumn() {
    try {
        console.log("Adding directAdminPackageId column to hosting_packages table...")

        await db.execute(sql`
            ALTER TABLE hosting_packages
            ADD COLUMN IF NOT EXISTS directadmin_package_id INTEGER
        `)

        console.log("✓ Column added successfully!")
        console.log("\nNote: You need to update existing packages with their DirectAdmin Package IDs.")
    } catch (error) {
        console.error("Error adding column:", error)
        throw error
    }
}

addDirectAdminPackageIdColumn()
    .then(() => {
        console.log("Done!")
        process.exit(0)
    })
    .catch((error) => {
        console.error("Failed:", error)
        process.exit(1)
    })

