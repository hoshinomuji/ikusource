/**
 * Script to add missing profile columns to the users table
 * Run this with: npx tsx scripts/add-profile-columns.ts
 */

import postgres from "postgres"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
    console.error("❌ DATABASE_URL environment variable is required")
    process.exit(1)
}

async function addProfileColumns() {
    const sql = postgres(connectionString, { prepare: false })

    try {
        console.log("Adding profile columns to users table...")

        // Check and add phone column
        const phoneExists = await sql`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'phone'
            )
        `
        if (!phoneExists[0].exists) {
            await sql`ALTER TABLE users ADD COLUMN phone text`
            console.log("✓ Added phone column")
        } else {
            console.log("✓ phone column already exists")
        }

        // Check and add address column
        const addressExists = await sql`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'address'
            )
        `
        if (!addressExists[0].exists) {
            await sql`ALTER TABLE users ADD COLUMN address text`
            console.log("✓ Added address column")
        } else {
            console.log("✓ address column already exists")
        }

        // Check and add bio column
        const bioExists = await sql`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'bio'
            )
        `
        if (!bioExists[0].exists) {
            await sql`ALTER TABLE users ADD COLUMN bio text`
            console.log("✓ Added bio column")
        } else {
            console.log("✓ bio column already exists")
        }

        // Check and add avatar_url column
        const avatarUrlExists = await sql`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'avatar_url'
            )
        `
        if (!avatarUrlExists[0].exists) {
            await sql`ALTER TABLE users ADD COLUMN avatar_url text`
            console.log("✓ Added avatar_url column")
        } else {
            console.log("✓ avatar_url column already exists")
        }

        // Check and add updated_at column
        const updatedAtExists = await sql`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'updated_at'
            )
        `
        if (!updatedAtExists[0].exists) {
            await sql`ALTER TABLE users ADD COLUMN updated_at timestamp DEFAULT now() NOT NULL`
            console.log("✓ Added updated_at column")
        } else {
            console.log("✓ updated_at column already exists")
        }

        console.log("\n✅ All profile columns have been added successfully!")
    } catch (error) {
        console.error("❌ Error adding columns:", error)
        throw error
    } finally {
        await sql.end()
    }
}

addProfileColumns()
    .then(() => {
        console.log("\n✨ Migration completed!")
        process.exit(0)
    })
    .catch((error) => {
        console.error("\n💥 Migration failed:", error)
        process.exit(1)
    })

