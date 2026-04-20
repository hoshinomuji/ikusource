// Run this script to fix migration tracking
// Usage: node run-migration.js

const { Client } = require('pg');

async function runMigration() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error("❌ DATABASE_URL environment variable is required")
        process.exit(1)
    }

    const client = new Client({
        connectionString,
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Create migrations table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
                id SERIAL PRIMARY KEY,
                hash text NOT NULL,
                created_at bigint
            );
        `);
        console.log('✅ Ensured __drizzle_migrations table exists');

        // Check if migrations are already tracked
        const existing = await client.query(`SELECT hash FROM "__drizzle_migrations"`);
        const existingHashes = existing.rows.map(r => r.hash);

        // Mark migration 0000 as applied
        if (!existingHashes.includes('0000_colossal_bishop')) {
            await client.query(`
                INSERT INTO "__drizzle_migrations" (hash, created_at)
                VALUES ('0000_colossal_bishop', 1766911687391)
            `);
            console.log('✅ Marked 0000_colossal_bishop as applied');
        } else {
            console.log('ℹ️ 0000_colossal_bishop already tracked');
        }

        // Mark migration 0001 as applied
        if (!existingHashes.includes('0001_shiny_otto_octavius')) {
            await client.query(`
                INSERT INTO "__drizzle_migrations" (hash, created_at)
                VALUES ('0001_shiny_otto_octavius', 1767510451473)
            `);
            console.log('✅ Marked 0001_shiny_otto_octavius as applied');
        } else {
            console.log('ℹ️ 0001_shiny_otto_octavius already tracked');
        }

        // Also create password_resets if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS password_resets (
                id SERIAL PRIMARY KEY,
                email TEXT NOT NULL,
                token TEXT NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT NOW() NOT NULL
            );
        `);
        console.log('✅ Ensured password_resets table exists');

        console.log('\n🎉 Migration fix completed successfully!');

        // Show current migrations
        const migrations = await client.query(`SELECT * FROM "__drizzle_migrations" ORDER BY id`);
        console.log('\nCurrent migrations:');
        migrations.rows.forEach(m => console.log(`  - ${m.hash}`));

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await client.end();
    }
}

runMigration();

