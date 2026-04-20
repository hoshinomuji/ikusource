/**
 * Script to setup DirectAdmin configuration and hosting packages
 * Run this script to initialize the hosting system
 */

import { db } from "../db"
import { directAdminConfig, hostingPackages } from "../db/schema"

async function setupHosting() {
    try {
        console.log("Setting up DirectAdmin configuration...")

        // TODO: Replace placeholder values with secure environment variables before production
        await db.insert(directAdminConfig).values({
            resellerUsername: process.env.DA_RESELLER_USERNAME || "",
            resellerPassword: process.env.DA_RESELLER_PASSWORD || "",
            serverIp: process.env.DA_SERVER_IP || "",
            panelUrl: process.env.DA_PANEL_URL || "",
            nameserver1: process.env.DA_NAMESERVER_1 || "",
            nameserver2: process.env.DA_NAMESERVER_2 || "",
            isActive: true,
        })

        console.log("✓ DirectAdmin configuration added")

        console.log("Setting up hosting packages...")

        // Insert hosting packages
        const packages = [
            {
                name: "Starter",
                description: "Perfect for small websites and blogs",
                diskSpace: 1000, // 1 GB
                bandwidth: 10000, // 10 GB
                domains: 1,
                subdomains: 5,
                emailAccounts: 5,
                databases: 1,
                ftpAccounts: 1,
                price: "4.99",
                billingCycle: "monthly",
                isActive: true,
            },
            {
                name: "Business",
                description: "Ideal for growing businesses",
                diskSpace: 5000, // 5 GB
                bandwidth: 50000, // 50 GB
                domains: 5,
                subdomains: 25,
                emailAccounts: 25,
                databases: 5,
                ftpAccounts: 5,
                price: "9.99",
                billingCycle: "monthly",
                isActive: true,
            },
            {
                name: "Professional",
                description: "For high-traffic websites",
                diskSpace: 10000, // 10 GB
                bandwidth: 100000, // 100 GB
                domains: 10,
                subdomains: 50,
                emailAccounts: 50,
                databases: 10,
                ftpAccounts: 10,
                price: "19.99",
                billingCycle: "monthly",
                isActive: true,
            },
            {
                name: "Enterprise",
                description: "Maximum resources for enterprise needs",
                diskSpace: 50000, // 50 GB
                bandwidth: 500000, // 500 GB
                domains: 50,
                subdomains: 100,
                emailAccounts: 100,
                databases: 50,
                ftpAccounts: 50,
                price: "39.99",
                billingCycle: "monthly",
                isActive: true,
            },
        ]

        for (const pkg of packages) {
            await db.insert(hostingPackages).values(pkg)
        }

        console.log("✓ Hosting packages added")
        console.log("\nSetup completed successfully!")
    } catch (error) {
        console.error("Error setting up hosting:", error)
        throw error
    }
}

setupHosting()
    .then(() => {
        console.log("Done!")
        process.exit(0)
    })
    .catch((error) => {
        console.error("Failed:", error)
        process.exit(1)
    })

