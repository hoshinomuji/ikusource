/**
 * Migration script to make password optional for OAuth users
 * Run this with: bun run scripts/make-password-optional.ts
 */

import { db } from "../db"
import { sql } from "drizzle-orm"

async function makePasswordOptional() {
    try {
        console.log("Making password column optional...")
        
        // Alter the password column to allow NULL
        await db.execute(sql`
            ALTER TABLE users 
            ALTER COLUMN password DROP NOT NULL;
        `)
        
        console.log("✅ Password column is now optional")
        console.log("✅ OAuth users can now have NULL password")
    } catch (error) {
        console.error("❌ Error making password optional:", error)
        throw error
    }
}

makePasswordOptional()
    .then(() => {
        console.log("Migration completed successfully")
        process.exit(0)
    })
    .catch((error) => {
        console.error("Migration failed:", error)
        process.exit(1)
    })

