/**
 * Script to add hosting_order_pending table
 * This table stores order details before payment
 */

import { db } from "../db"
import { sql } from "drizzle-orm"

async function addPendingOrdersTable() {
    try {
        console.log("Creating hosting_order_pending table...")
        
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS hosting_order_pending (
                id SERIAL PRIMARY KEY,
                invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id),
                package_id INTEGER NOT NULL REFERENCES hosting_packages(id),
                domain TEXT NOT NULL,
                email TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT now() NOT NULL
            )
        `)

        console.log("✓ hosting_order_pending table created")

        // Create index
        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS idx_pending_orders_invoice_id ON hosting_order_pending(invoice_id)
        `)
        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS idx_pending_orders_user_id ON hosting_order_pending(user_id)
        `)

        console.log("✓ Indexes created")
        console.log("\n✅ hosting_order_pending table created successfully!")
    } catch (error) {
        console.error("Error creating hosting_order_pending table:", error)
        throw error
    }
}

addPendingOrdersTable()
    .then(() => {
        console.log("Done!")
        process.exit(0)
    })
    .catch((error) => {
        console.error("Migration failed:", error)
        process.exit(1)
    })

