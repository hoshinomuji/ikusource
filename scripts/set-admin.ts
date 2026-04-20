/**
 * Script to set user as admin
 * Run this with: bunx tsx scripts/set-admin.ts
 */

import postgres from "postgres"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
    console.error("❌ DATABASE_URL environment variable is required")
    process.exit(1)
}

async function setAdmin() {
    const sql = postgres(connectionString, { prepare: false })

    try {
        const email = process.argv[2] || "admin@ikuzen.studio"
        
        console.log(`Setting user with email "${email}" as admin...`)

        const result = await sql`
            UPDATE users 
            SET role = 'admin' 
            WHERE email = ${email}
        `

        if (result.count === 0) {
            console.log(`❌ No user found with email: ${email}`)
        } else {
            console.log(`✅ Successfully set ${result.count} user(s) as admin`)
        }

        // Verify the change
        const user = await sql`
            SELECT id, email, role, name 
            FROM users 
            WHERE email = ${email}
        `

        if (user.length > 0) {
            console.log("\nUser details:")
            console.log(`  ID: ${user[0].id}`)
            console.log(`  Email: ${user[0].email}`)
            console.log(`  Role: ${user[0].role}`)
            console.log(`  Name: ${user[0].name || "N/A"}`)
        }
    } catch (error: any) {
        console.error("❌ Error:", error.message)
        process.exit(1)
    } finally {
        await sql.end()
    }
}

setAdmin()

