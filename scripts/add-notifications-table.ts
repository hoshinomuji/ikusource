/**
 * Script to add notifications table to the database
 * Run this after updating the schema
 */

import { db } from "../db"
import { sql } from "drizzle-orm"

async function addNotificationsTable() {
    try {
        console.log("Creating notifications table...")
        
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                link TEXT,
                is_read BOOLEAN DEFAULT false NOT NULL,
                created_at TIMESTAMP DEFAULT now() NOT NULL
            )
        `)

        console.log("✓ Notifications table created")

        // Create index for faster queries
        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)
        `)

        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)
        `)

        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)
        `)

        console.log("✓ Indexes created")
        console.log("\nNotifications table created successfully!")
    } catch (error) {
        console.error("Error creating notifications table:", error)
        throw error
    }
}

addNotificationsTable()
    .then(() => {
        console.log("Done!")
        process.exit(0)
    })
    .catch((error) => {
        console.error("Failed:", error)
        process.exit(1)
    })

