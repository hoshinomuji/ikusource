/**
 * Script to add payment_gateways table to the database
 * Run this after updating the schema
 */

import { db } from "../db"
import { sql } from "drizzle-orm"

async function addPaymentGatewaysTable() {
    try {
        console.log("Creating payment_gateways table...")
        
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS payment_gateways (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                display_name TEXT NOT NULL,
                is_active BOOLEAN DEFAULT false NOT NULL,
                is_test_mode BOOLEAN DEFAULT true NOT NULL,
                stripe_publishable_key TEXT,
                stripe_secret_key TEXT,
                stripe_webhook_secret TEXT,
                google_pay_merchant_id TEXT,
                google_pay_environment TEXT DEFAULT 'TEST',
                supported_cards TEXT,
                currency TEXT DEFAULT 'USD' NOT NULL,
                created_at TIMESTAMP DEFAULT now() NOT NULL,
                updated_at TIMESTAMP DEFAULT now() NOT NULL
            )
        `)

        console.log("✓ Payment gateways table created")

        // Create index
        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS idx_payment_gateways_name ON payment_gateways(name)
        `)

        console.log("✓ Indexes created")

        // Insert default payment gateways
        const defaultGateways = [
            {
                name: "stripe",
                display_name: "Stripe (Mastercard, Visa)",
                is_active: false,
                is_test_mode: true,
                supported_cards: JSON.stringify(["mastercard", "visa", "amex"]),
                currency: "USD"
            },
            {
                name: "google_pay",
                display_name: "Google Pay",
                is_active: false,
                is_test_mode: true,
                supported_cards: JSON.stringify(["mastercard", "visa", "amex"]),
                currency: "USD"
            }
        ]

        for (const gateway of defaultGateways) {
            const existing = await db.execute(sql`
                SELECT id FROM payment_gateways WHERE name = ${gateway.name}
            `)
            
            if (!existing.rows || existing.rows.length === 0) {
                await db.execute(sql`
                    INSERT INTO payment_gateways (
                        name, display_name, is_active, is_test_mode,
                        supported_cards, currency
                    ) VALUES (
                        ${gateway.name},
                        ${gateway.display_name},
                        ${gateway.is_active},
                        ${gateway.is_test_mode},
                        ${gateway.supported_cards},
                        ${gateway.currency}
                    )
                `)
                console.log(`✓ Inserted default gateway: ${gateway.display_name}`)
            } else {
                console.log(`✓ Gateway ${gateway.display_name} already exists`)
            }
        }

        console.log("\n✅ Payment gateways table created successfully!")
    } catch (error) {
        console.error("Error creating payment gateways table:", error)
        throw error
    }
}

addPaymentGatewaysTable()
    .then(() => {
        console.log("Done!")
        process.exit(0)
    })
    .catch((error) => {
        console.error("Failed:", error)
        process.exit(1)
    })

