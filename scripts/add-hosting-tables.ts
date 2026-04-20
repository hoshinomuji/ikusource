/**
 * Script to add hosting-related tables to the database
 * Run this after updating the schema
 */

import { db } from "../db"
import { sql } from "drizzle-orm"

async function addHostingTables() {
    try {
        console.log("Creating DirectAdmin config table...")
        
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS directadmin_config (
                id SERIAL PRIMARY KEY,
                reseller_username TEXT NOT NULL,
                reseller_password TEXT NOT NULL,
                server_ip TEXT NOT NULL,
                panel_url TEXT NOT NULL,
                nameserver_1 TEXT NOT NULL,
                nameserver_2 TEXT NOT NULL,
                is_active BOOLEAN DEFAULT true NOT NULL,
                created_at TIMESTAMP DEFAULT now() NOT NULL,
                updated_at TIMESTAMP DEFAULT now() NOT NULL
            )
        `)

        console.log("✓ DirectAdmin config table created")

        console.log("Creating hosting packages table...")
        
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS hosting_packages (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                disk_space INTEGER NOT NULL,
                bandwidth INTEGER NOT NULL,
                domains INTEGER DEFAULT 1 NOT NULL,
                subdomains INTEGER DEFAULT 0 NOT NULL,
                email_accounts INTEGER DEFAULT 0 NOT NULL,
                databases INTEGER DEFAULT 0 NOT NULL,
                ftp_accounts INTEGER DEFAULT 0 NOT NULL,
                price NUMERIC(10, 2) NOT NULL,
                billing_cycle TEXT DEFAULT 'monthly',
                is_active BOOLEAN DEFAULT true NOT NULL,
                created_at TIMESTAMP DEFAULT now() NOT NULL,
                updated_at TIMESTAMP DEFAULT now() NOT NULL
            )
        `)

        console.log("✓ Hosting packages table created")

        console.log("Creating hosting orders table...")
        
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS hosting_orders (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                service_id INTEGER REFERENCES services(id),
                package_id INTEGER NOT NULL REFERENCES hosting_packages(id),
                domain TEXT NOT NULL,
                directadmin_username TEXT NOT NULL,
                directadmin_password TEXT NOT NULL,
                directadmin_email TEXT NOT NULL,
                status TEXT DEFAULT 'pending' NOT NULL,
                created_at TIMESTAMP DEFAULT now() NOT NULL,
                updated_at TIMESTAMP DEFAULT now() NOT NULL
            )
        `)

        console.log("✓ Hosting orders table created")
        console.log("\nAll hosting tables created successfully!")
    } catch (error) {
        console.error("Error creating hosting tables:", error)
        throw error
    }
}

addHostingTables()
    .then(() => {
        console.log("Done!")
        process.exit(0)
    })
    .catch((error) => {
        console.error("Failed:", error)
        process.exit(1)
    })

