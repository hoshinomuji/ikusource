/**
 * Script to add wallet and point transaction tables
 * Run this with: npx tsx scripts/add-wallet-tables.ts
 */

import postgres from "postgres"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
    console.error("❌ DATABASE_URL environment variable is required")
    process.exit(1)
}

async function addWalletTables() {
    const sql = postgres(connectionString, { prepare: false })

    try {
        console.log("Adding wallet and point transaction tables...")

        // Check and create wallets table
        const walletsExists = await sql`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'wallets'
            )
        `
        if (!walletsExists[0].exists) {
            await sql`
                CREATE TABLE wallets (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
                    balance DECIMAL(10, 2) DEFAULT 0 NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
                    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
                )
            `
            console.log("✓ Created wallets table")
        } else {
            console.log("✓ wallets table already exists")
        }

        // Check and create point_transactions table
        const transactionsExists = await sql`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'point_transactions'
            )
        `
        if (!transactionsExists[0].exists) {
            await sql`
                CREATE TABLE point_transactions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    wallet_id INTEGER NOT NULL REFERENCES wallets(id),
                    amount DECIMAL(10, 2) NOT NULL,
                    type TEXT NOT NULL,
                    description TEXT,
                    reference_id TEXT,
                    created_at TIMESTAMP DEFAULT NOW() NOT NULL
                )
            `
            console.log("✓ Created point_transactions table")
        } else {
            console.log("✓ point_transactions table already exists")
        }

        console.log("\n✅ All wallet tables have been created successfully!")
    } catch (error) {
        console.error("❌ Error creating tables:", error)
        throw error
    } finally {
        await sql.end()
    }
}

addWalletTables()
    .then(() => {
        console.log("\n✨ Migration completed!")
        process.exit(0)
    })
    .catch((error) => {
        console.error("\n💥 Migration failed:", error)
        process.exit(1)
    })

