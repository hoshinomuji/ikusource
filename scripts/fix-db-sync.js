const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ DATABASE_URL environment variable is required")
    process.exit(1)
}

const sql = postgres(connectionString);

async function main() {
    try {
        console.log('🔌 Connecting to database...');

        // 1. Ensure migrations table exists
        await sql`
            CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
                id SERIAL PRIMARY KEY,
                hash text NOT NULL,
                created_at bigint
            );
        `;
        console.log('✅ Checked __drizzle_migrations table');

        // 2. Check and Insert Migration 0000
        const mig0 = await sql`SELECT 1 FROM "__drizzle_migrations" WHERE hash = '0000_colossal_bishop'`;
        if (mig0.length === 0) {
            await sql`
                INSERT INTO "__drizzle_migrations" (hash, created_at)
                VALUES ('0000_colossal_bishop', 1766911687391)
            `;
            console.log('✅ Marked 0000_colossal_bishop as applied');
        } else {
            console.log('ℹ️ 0000_colossal_bishop already tracked');
        }

        // 3. Check and Insert Migration 0001
        const mig1 = await sql`SELECT 1 FROM "__drizzle_migrations" WHERE hash = '0001_shiny_otto_octavius'`;
        if (mig1.length === 0) {
            await sql`
                INSERT INTO "__drizzle_migrations" (hash, created_at)
                VALUES ('0001_shiny_otto_octavius', 1767510451473)
            `;
            console.log('✅ Marked 0001_shiny_otto_octavius as applied');
        } else {
            console.log('ℹ️ 0001_shiny_otto_octavius already tracked');
        }

        console.log('\n🎉 Database sync completed!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

main();
