/**
 * Script to migrate package fields from integer to text to support "unlimited"
 * Run this after updating the schema
 */

import { db } from "../db"
import { sql } from "drizzle-orm"

async function migratePackageFieldsToText() {
    try {
        console.log("Migrating package fields to text...")
        
        // Check if columns are already text type
        const checkColumn = await db.execute(sql`
            SELECT data_type
            FROM information_schema.columns
            WHERE table_name = 'hosting_packages'
            AND column_name = 'disk_space'
        `)

        if (checkColumn.rows && checkColumn.rows.length > 0) {
            const dataType = (checkColumn.rows[0] as any).data_type
            if (dataType === 'text') {
                console.log("Columns are already text type. Skipping migration.")
                return
            }
        }

        // Migrate each field from integer to text
        const fields = [
            'disk_space',
            'bandwidth',
            'domains',
            'subdomains',
            'email_accounts',
            'databases',
            'ftp_accounts'
        ]

        for (const field of fields) {
            console.log(`Migrating ${field}...`)
            await db.execute(sql.raw(`
                ALTER TABLE hosting_packages
                ALTER COLUMN ${field} TYPE TEXT
                USING ${field}::TEXT
            `))
            console.log(`✓ Migrated ${field}`)
        }

        console.log("\n✅ All package fields migrated successfully!")
    } catch (error) {
        console.error("Error migrating package fields:", error)
        throw error
    }
}

migratePackageFieldsToText()
    .then(() => {
        console.log("Done!")
        process.exit(0)
    })
    .catch((error) => {
        console.error("Failed:", error)
        process.exit(1)
    })

