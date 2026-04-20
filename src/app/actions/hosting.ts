"use server"

import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { users, services, invoices, hostingPackages, hostingOrders, directAdminConfig, wallets, pointTransactions, hostingCategories, notifications } from "@/db/schema"
import { eq, and, lt, sql } from "drizzle-orm"
import { DirectAdminClient } from "@/lib/directadmin"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createHostingOrderSchema = z.object({
    packageId: z.number(),
    domain: z.string().min(1, "เธเธฃเธธเธ“เธฒเธเธฃเธญเธเนเธ”เน€เธกเธ"),
    email: z.string().email("เธฃเธนเธเนเธเธเธญเธตเน€เธกเธฅเนเธกเนเธ–เธนเธเธ•เนเธญเธ"),
})
const RESELLER_MARKER = "[[RESELLER]]"

/**
 * Get DirectAdmin configuration from database
 */
async function getDirectAdminConfig(configId?: number) {
    let config

    if (configId) {
        // Get specific config by ID
        config = await db
            .select()
            .from(directAdminConfig)
            .where(eq(directAdminConfig.id, configId))
            .limit(1)
    } else {
        // Get active config
        config = await db
            .select()
            .from(directAdminConfig)
            .where(eq(directAdminConfig.isActive, true))
            .limit(1)
    }

    if (!config || config.length === 0) {
        throw new Error("เนเธกเนเธเธเธเธฒเธฃเธ•เธฑเนเธเธเนเธฒ DirectAdmin")
    }

    return config[0]
}

/**
 * Generate a unique username for DirectAdmin account
 */
function generateUsername(domain: string, userId: number): string {
    // Remove www. and extract main domain
    const cleanDomain = domain.replace(/^www\./, "").split(".")[0]
    // Remove special characters
    let sanitized = cleanDomain.replace(/[^a-z0-9]/gi, "").toLowerCase()

    // Ensure starts with a letter
    if (!/^[a-z]/.test(sanitized)) {
        sanitized = "u" + sanitized
    }

    // DirectAdmin username rules:
    // 1. Start with a-z
    // 2. Length 3-10 characters
    // 3. Alphanumeric

    // Use base36 to compact userId (e.g. 19197 -> "et9")
    const uid = userId.toString(36)
    
    // Generate 2 random characters for uniqueness
    const randomChars = "abcdefghijklmnopqrstuvwxyz0123456789"
    const r1 = randomChars.charAt(Math.floor(Math.random() * randomChars.length))
    const r2 = randomChars.charAt(Math.floor(Math.random() * randomChars.length))
    const suffix = `${r1}${r2}`

    // Calculate available space for domain prefix
    // Max 10 chars total
    const maxTotal = 10
    const reserved = uid.length + suffix.length
    
    // Ensure at least 1 char for prefix
    const availableForPrefix = Math.max(1, maxTotal - reserved)
    const prefix = sanitized.slice(0, availableForPrefix)

    // Construct username
    let username = `${prefix}${uid}${suffix}`

    // Final safety check to ensure max 10 chars
    // (If userId is huge, we might lose suffix, but base36 holds >2 billion in 6 chars, so we are safe)
    if (username.length > 10) {
        username = username.slice(0, 10)
    }

    // Final safety check to ensure min 3 chars
    if (username.length < 3) {
        username = username.padEnd(3, "x")
    }

    return username
}

/**
 * Generate a secure random password
 */
function generatePassword(): string {
    const length = 16
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
}

/**
 * Create a new hosting order and account
 */
export async function createHostingOrder(formData: FormData) {
    try {
        const cookieStore = await cookies()
        const userId = await getSessionUserIdValue(cookieStore)

        if (!userId) {
            return {
                success: false,
                error: "เธเธฃเธธเธ“เธฒเน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธเธเนเธญเธเธชเธฑเนเธเธเธทเนเธญเนเธฎเธชเธ•เธดเนเธ",
            }
        }

        const userIdNum = parseInt(userId)

        // Parse and validate form data
        const rawData = {
            packageId: parseInt(formData.get("packageId") as string),
            domain: formData.get("domain") as string,
            email: formData.get("email") as string,
        }

        const validation = createHostingOrderSchema.safeParse(rawData)
        if (!validation.success) {
            return {
                success: false,
                error: validation.error.issues[0].message,
            }
        }

        const { packageId, domain, email } = validation.data

        // Get user
        const user = await db
            .select()
            .from(users)
            .where(eq(users.id, userIdNum))
            .limit(1)

        if (!user || user.length === 0) {
            return {
                success: false,
                error: "เนเธกเนเธเธเธเธนเนเนเธเน",
            }
        }

        // Get hosting package
        const hostingPackage = await db
            .select()
            .from(hostingPackages)
            .where(eq(hostingPackages.id, packageId))
            .limit(1)

        if (!hostingPackage || hostingPackage.length === 0) {
            return {
                success: false,
                error: "เนเธกเนเธเธเนเธเนเธเน€เธเธเนเธฎเธชเธ•เธดเนเธ",
            }
        }

        const pkg = hostingPackage[0]

        if (!pkg.isActive) {
            return {
                success: false,
                error: "เนเธเนเธเน€เธเธเนเธฎเธชเธ•เธดเนเธเธเธตเนเนเธกเนเธเธฃเนเธญเธกเนเธเนเธเธฒเธ",
            }
        }

        // Get or create wallet
        let wallet = await db
            .select()
            .from(wallets)
            .where(eq(wallets.userId, userIdNum))
            .limit(1)

        if (!wallet || wallet.length === 0) {
            // Create wallet if it doesn't exist
            try {
                const [newWallet] = await db
                    .insert(wallets)
                    .values({
                        userId: userIdNum,
                        balance: "0",
                    })
                    .returning()
                wallet = [newWallet]
            } catch (error) {
                // Wallet might already exist, try to fetch again
                wallet = await db
                    .select()
                    .from(wallets)
                    .where(eq(wallets.userId, userIdNum))
                    .limit(1)

                if (!wallet || wallet.length === 0) {
                    return {
                        success: false,
                        error: "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเธฃเนเธฒเธเธเธฃเธฐเน€เธเนเธฒเน€เธเธดเธเนเธ”เน เธเธฃเธธเธ“เธฒเธ•เธดเธ”เธ•เนเธญเธเนเธฒเธขเธชเธเธฑเธเธชเธเธธเธ",
                    }
                }
            }
        }

        const walletBalance = parseFloat(wallet[0].balance)
        const packagePrice = parseFloat(pkg.price)

        if (walletBalance < packagePrice) {
            return {
                success: false,
                error: `เธขเธญเธ”เน€เธเธดเธเนเธกเนเธเธญ เธ•เนเธญเธเธเธฒเธฃ: ${packagePrice.toFixed(2)} เธเธฒเธ—, เธกเธตเธญเธขเธนเน: ${walletBalance.toFixed(2)} เธเธฒเธ— เธเธฃเธธเธ“เธฒเน€เธ•เธดเธกเน€เธเธดเธเน€เธเนเธฒเธเธฑเธเธเธตเธเนเธญเธ`,
            }
        }

        // Generate account credentials
        const username = generateUsername(domain, userIdNum)
        const password = generatePassword()

        let panelUrl = ""
        let serverIp = ""

        // DirectAdmin flow
        const daConfig = await getDirectAdminConfig(pkg.configId || undefined)
        panelUrl = daConfig.panelUrl
        serverIp = daConfig.serverIp
        if (!pkg.directAdminPackageName) {
            return {
                success: false,
                error: "เนเธเนเธเน€เธเธเนเธฎเธชเธ•เธดเนเธเธเธตเนเธขเธฑเธเนเธกเนเนเธ”เนเธ•เธฑเนเธเธเนเธฒ DirectAdmin package name เธเธฃเธธเธ“เธฒเธ•เธดเธ”เธ•เนเธญเธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ",
            }
        }

        const daClient = new DirectAdminClient({
            resellerUsername: daConfig.resellerUsername,
            resellerPassword: daConfig.resellerPassword,
            serverIp: daConfig.serverIp,
            panelUrl: daConfig.panelUrl,
        })

        console.log("Testing DirectAdmin connection before creating account...")
        const connectionTest = await daClient.testConnection()
        if (!connectionTest.success) {
            console.error("DirectAdmin connection test failed:", connectionTest.message)
            return {
                success: false,
                error: `เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เน€เธเธทเนเธญเธกเธ•เนเธญเธเธฑเธ DirectAdmin เนเธ”เน\n\n${connectionTest.message}\n\nเธเธฃเธธเธ“เธฒเธ•เธฃเธงเธเธชเธญเธ:\n1. DirectAdmin configuration เนเธ Admin Settings\n2. URL: ${daConfig.panelUrl}\n3. Reseller username เนเธฅเธฐ password เธ–เธนเธเธ•เนเธญเธเธซเธฃเธทเธญเนเธกเน\n4. Server เธชเธฒเธกเธฒเธฃเธ–เน€เธเนเธฒเธ–เธถเธ DirectAdmin server เนเธ”เนเธซเธฃเธทเธญเนเธกเน\n5. เธฅเธญเธเนเธเน IP address เนเธ—เธ domain name (เน€เธเนเธ https://IP:2222)`,
            }
        }
        console.log("DirectAdmin connection test passed:", connectionTest.message)

        console.log("Creating DirectAdmin account with params:", {
            username,
            email,
            domain,
            packageName: pkg.directAdminPackageName,
            ip: daConfig.serverIp,
        })

        const daResult = await daClient.createAccount({
            username,
            email,
            password,
            domain,
            packageName: pkg.directAdminPackageName,
            ip: daConfig.serverIp,
            notify: true,
        })

        console.log("DirectAdmin createAccount result:", daResult)

        if (!daResult.success) {
            console.error("DirectAdmin account creation failed:", {
                message: daResult.message,
                username,
                domain,
                email,
            })

            const isUnexpectedError = daResult.message?.toLowerCase().includes("unexpected") ||
                daResult.message?.toLowerCase().includes("เนเธกเนเธเธฒเธ”เธเธดเธ”")

            if (!isUnexpectedError) {
                return {
                    success: false,
                    error: daResult.message || "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเธฃเนเธฒเธเธเธฑเธเธเธตเนเธฎเธชเธ•เธดเนเธเนเธ”เน",
                }
            }

            console.warn("DirectAdmin returned unexpected response, treating as potential success")
        }

        console.log("DirectAdmin account created successfully, now creating database records...")

        // Calculate next due date based on billing cycle
        const nextDueDate = new Date()
        if (pkg.billingCycle === "yearly") {
            nextDueDate.setFullYear(nextDueDate.getFullYear() + 1)
        } else {
            nextDueDate.setDate(nextDueDate.getDate() + 30)
        }

        try {
            // Create service record
            console.log("Creating service record...")
            const [service] = await db
                .insert(services)
                .values({
                    userId: userIdNum,
                    name: `Hosting - ${domain}`,
                    type: "hosting",
                    status: "active",
                    price: pkg.price,
                    billingCycle: pkg.billingCycle,
                    nextDueDate: nextDueDate,
                    ip: serverIp,
                    disk: `${pkg.diskSpace} MB`,
                })
                .returning()

            console.log("Service record created:", service.id)

            // Create hosting order record
            console.log("Creating hosting order record...")
            await db.insert(hostingOrders).values({
                userId: userIdNum,
                serviceId: service.id,
                packageId: packageId,
                domain: domain,
                directAdminUsername: username,
                directAdminPassword: password,
                directAdminEmail: email,
                status: "active",
            })
            console.log("Hosting order record created")

            // Deduct from wallet
            console.log("Deducting from wallet...")
            const newBalance = walletBalance - packagePrice
            await db
                .update(wallets)
                .set({
                    balance: newBalance.toString(),
                    updatedAt: new Date(),
                })
                .where(eq(wallets.userId, userIdNum))
            console.log("Wallet updated, new balance:", newBalance)

            // Create invoice
            console.log("Creating invoice...")
            const [createdInvoice] = await db.insert(invoices).values({
                userId: userIdNum,
                serviceId: service.id,
                amount: pkg.price,
                status: "paid",
                dueDate: nextDueDate,
                paidAt: new Date(),
            }).returning()
            console.log("Invoice created:", createdInvoice?.id)

            // Create notification for successful hosting order
            await db.insert(notifications).values({
                userId: userIdNum,
                type: "service",
                title: "Hosting เธชเธฃเนเธฒเธเธชเธณเน€เธฃเนเธ",
                message: `Hosting เธชเธณเธซเธฃเธฑเธ ${domain} เนเธ”เนเธ–เธนเธเธชเธฃเนเธฒเธเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง`,
                link: `/dashboard/services`,
            })

            // Add transaction record to point_transactions
            console.log("Creating transaction record...")
            await db.insert(pointTransactions).values({
                userId: userIdNum,
                walletId: wallet[0].id,
                amount: (-packagePrice).toString(),
                type: "payment",
                description: `Hosting order for ${domain}`,
                referenceId: service.id.toString(),
            })
            console.log("Transaction record created")

            // Send Discord notification
            try {
                const { sendDiscordNotification } = await import("@/lib/discord-notify")

                // Use existing user object from earlier in the function
                await sendDiscordNotification("order", {
                    userName: user[0].name,
                    userId: userIdNum,
                    packageName: pkg.name,
                    price: pkg.price,
                    domain: domain
                })
            } catch (error) {
                console.error("Failed to send Discord notification:", error)
            }

            // Send Email notification
            try {
                const { sendHostingCreatedEmail } = await import("@/lib/email-service")

                await sendHostingCreatedEmail(
                    userIdNum,
                    service,
                    {
                        domain,
                        packageName: pkg.name,
                        ip: serverIp,
                        username,
                        password,
                        panelUrl,
                        nextDueDate: nextDueDate
                    }
                )
            } catch (error) {
                console.error("Failed to send email notification:", error)
            }

            revalidatePath("/dashboard/hosting")
            revalidatePath("/dashboard/wallet")
            revalidatePath("/dashboard/services")
            revalidatePath("/dashboard/billing")

            console.log("All database operations completed successfully!")

            return {
                success: true,
                message: "เธชเธฃเนเธฒเธเธเธฑเธเธเธตเนเธฎเธชเธ•เธดเนเธเธชเธณเน€เธฃเนเธ!",
                data: {
                    serviceId: service.id,
                    username: username,
                    password: password,
                    domain: domain,
                    panelUrl: panelUrl,
                },
            }
        } catch (dbError) {
            console.error("Database error after DirectAdmin success:", dbError)
            return {
                success: false,
                error: `เธชเธฃเนเธฒเธเธเธฑเธเธเธต DirectAdmin เธชเธณเน€เธฃเนเธเนเธ•เนเน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เธเธฒเธเธเนเธญเธกเธนเธฅ: ${dbError instanceof Error ? dbError.message : "เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เธเธฒเธเธเนเธญเธกเธนเธฅเธ—เธตเนเนเธกเนเธ—เธฃเธฒเธเธชเธฒเน€เธซเธ•เธธ"}`,
            }
        }
    } catch (error) {
        console.error("Error creating hosting order invoice:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเธฃเนเธฒเธเธเธณเธชเธฑเนเธเธเธทเนเธญเนเธฎเธชเธ•เธดเนเธเนเธ”เน",
        }
    }
}

/**
 * Get all available hosting packages
 */
/**
 * Get all hosting categories
 */
export async function getHostingCategories() {
    try {
        // Check if table exists by trying to query it
        const categories = await db
            .select()
            .from(hostingCategories)
            .where(eq(hostingCategories.isActive, true))
            .orderBy(hostingCategories.displayOrder, hostingCategories.name)

        return {
            success: true,
            data: categories,
        }
    } catch (error: any) {
        // If table doesn't exist, return empty array instead of error
        if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
            console.warn("Hosting categories table does not exist yet. Please run migration script.")
            return {
                success: true,
                data: [],
            }
        }
        console.error("Error fetching hosting categories:", error)
        return {
            success: true, // Return success with empty array to prevent UI errors
            data: [],
        }
    }
}

/**
 * Get hosting packages by category
 */
export async function getHostingPackages(categoryId?: number) {
    try {
        if (categoryId) {
            const packages = await db
                .select()
                .from(hostingPackages)
                .where(and(
                    eq(hostingPackages.isActive, true),
                    eq(hostingPackages.categoryId, categoryId)
                ))
                .orderBy(hostingPackages.price)

            return {
                success: true,
                data: packages.filter((pkg) => !String(pkg.description || "").includes(RESELLER_MARKER)),
            }
        } else {
            const packages = await db
                .select()
                .from(hostingPackages)
                .where(eq(hostingPackages.isActive, true))
                .orderBy(hostingPackages.price)

            return {
                success: true,
                data: packages.filter((pkg) => !String(pkg.description || "").includes(RESELLER_MARKER)),
            }
        }
    } catch (error: any) {
        // If table doesn't exist, return empty array instead of error
        if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
            console.warn("Hosting packages table does not exist yet. Please run migration script.")
            return {
                success: true,
                data: [],
            }
        }
        // If DB connection fails during build (e.g., Netlify), return empty array
        const errorCode = error?.code || error?.cause?.code
        if (errorCode === "ECONNREFUSED" || !process.env.DATABASE_URL || process.env.NETLIFY) {
            if (process.env.NEXT_PHASE !== "phase-production-build") {
                console.warn("Database connection unavailable - returning empty packages array")
            }
            return {
                success: true,
                data: [],
            }
        }
        console.error("Error fetching hosting packages:", error)
        return {
            success: true, // Return success with empty array to prevent UI errors
            data: [],
        }
    }
}

/**
 * Get hosting order details by service ID
 */
export async function getHostingOrderByServiceId(serviceId: number) {
    try {
        const cookieStore = await cookies()
        const userId = await getSessionUserIdValue(cookieStore)

        if (!userId) {
            return {
                success: false,
                error: "เธเธฃเธธเธ“เธฒเน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธ",
            }
        }

        const userIdNum = parseInt(userId)

        const order = await db
            .select({
                id: hostingOrders.id,
                domain: hostingOrders.domain,
                directAdminUsername: hostingOrders.directAdminUsername,
                directAdminPassword: hostingOrders.directAdminPassword,
                directAdminEmail: hostingOrders.directAdminEmail,
                status: hostingOrders.status,
                package: hostingPackages,
            })
            .from(hostingOrders)
            .innerJoin(hostingPackages, eq(hostingOrders.packageId, hostingPackages.id))
            .where(eq(hostingOrders.serviceId, serviceId))
            .limit(1)

        if (!order || order.length === 0) {
            return {
                success: false,
                error: "เนเธกเนเธเธเธเธณเธชเธฑเนเธเธเธทเนเธญเนเธฎเธชเธ•เธดเนเธ",
            }
        }

        // Verify ownership
        const service = await db
            .select()
            .from(services)
            .where(eq(services.id, serviceId))
            .limit(1)

        if (!service || service.length === 0 || service[0].userId !== userIdNum) {
            return {
                success: false,
                error: "เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเน€เธเนเธฒเธ–เธถเธ",
            }
        }

        // Get DirectAdmin config for panel URL
        const daConfig = await getDirectAdminConfig(order[0].package.configId || undefined)

        return {
            success: true,
            data: {
                ...order[0],
                panelUrl: daConfig.panelUrl,
                serverIp: daConfig.serverIp,
                nameservers: [daConfig.nameserver1, daConfig.nameserver2],
            },
        }
    } catch (error) {
        console.error("Error fetching hosting order:", error)
        return {
            success: false,
            error: "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธถเธเธเนเธญเธกเธนเธฅเธเธณเธชเธฑเนเธเธเธทเนเธญเนเธฎเธชเธ•เธดเนเธเนเธ”เน",
        }
    }
}

/**
 * Delete a hosting order (Admin only)
 * This will also delete the associated service
 */
export async function deleteHostingOrder(orderId: number): Promise<{
    success: boolean
    error?: string
}> {
    const cookieStore = await cookies()
    const userId = await getSessionUserIdValue(cookieStore)

    if (!userId) {
        return { success: false, error: "เนเธกเนเธเธเธเธฒเธฃเธขเธทเธเธขเธฑเธเธ•เธฑเธงเธ•เธ" }
    }

    const userIdNum = parseInt(userId)

    // Check if user is admin
    const user = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userIdNum))
        .limit(1)

    if (!user || user.length === 0 || user[0].role !== "admin") {
        return { success: false, error: "เนเธกเนเธกเธตเธชเธดเธ—เธเธดเน - เน€เธเธเธฒเธฐ Admin เน€เธ—เนเธฒเธเธฑเนเธ" }
    }

    try {
        // Get the hosting order
        const order = await db
            .select()
            .from(hostingOrders)
            .where(eq(hostingOrders.id, orderId))
            .limit(1)

        if (!order || order.length === 0) {
            return { success: false, error: "Hosting order not found" }
        }

        // Try to delete account from DirectAdmin
        try {
            // Get package to find DirectAdmin config
            const pkg = await db
                .select({
                    configId: hostingPackages.configId,
                })
                .from(hostingPackages)
                .where(eq(hostingPackages.id, order[0].packageId))
                .limit(1)

            if (!pkg || pkg.length === 0) {
                console.warn("Package not found while deleting hosting order, skipping panel deletion")
            } else {
                let daConfig
                if (pkg[0].configId) {
                    daConfig = await db
                        .select()
                        .from(directAdminConfig)
                        .where(eq(directAdminConfig.id, pkg[0].configId))
                        .limit(1)
                } else {
                    daConfig = await db
                        .select()
                        .from(directAdminConfig)
                        .where(eq(directAdminConfig.isActive, true))
                        .limit(1)
                }

                if (daConfig && daConfig.length > 0) {
                    const daClient = new DirectAdminClient({
                        resellerUsername: daConfig[0].resellerUsername,
                        resellerPassword: daConfig[0].resellerPassword,
                        serverIp: daConfig[0].serverIp,
                        panelUrl: daConfig[0].panelUrl,
                    })

                    await daClient.deleteAccount(order[0].directAdminUsername)
                    console.log(`Deleted DirectAdmin account: ${order[0].directAdminUsername}`)
                }
            }
        } catch (cpError) {
            console.error("Failed to delete control panel account (continuing with DB deletion):", cpError)
        }

        const serviceId = order[0].serviceId

        // Delete hosting order first (foreign key)
        await db.delete(hostingOrders).where(eq(hostingOrders.id, orderId))

        // Delete associated service
        if (serviceId) {
            // Delete any invoices linked to this service
            await db.delete(invoices).where(eq(invoices.serviceId, serviceId))

            // Delete the service
            await db.delete(services).where(eq(services.id, serviceId))
        }

        revalidatePath("/dashboard/admin/hosting")
        revalidatePath("/dashboard/services")

        return { success: true }
    } catch (error) {
        console.error("Error deleting hosting order:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเธเธณเธชเธฑเนเธเธเธทเนเธญเนเธฎเธชเธ•เธดเนเธเนเธ”เน",
        }
    }
}

/**
 * Update hosting order details (Admin only)
 * Can update username, password, status, and next due date
 */
export async function updateHostingOrder(
    orderId: number,
    data: {
        directAdminUsername?: string
        directAdminPassword?: string
        status?: string
        nextDueDate?: Date | null
    }
): Promise<{ success: boolean; error?: string }> {
    const cookieStore = await cookies()
    const userId = await getSessionUserIdValue(cookieStore)

    if (!userId) {
        return { success: false, error: "เนเธกเนเธเธเธเธฒเธฃเธขเธทเธเธขเธฑเธเธ•เธฑเธงเธ•เธ" }
    }

    const userIdNum = parseInt(userId)

    // Check if user is admin
    const user = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userIdNum))
        .limit(1)

    if (!user || user.length === 0 || user[0].role !== "admin") {
        return { success: false, error: "เนเธกเนเธกเธตเธชเธดเธ—เธเธดเน - เน€เธเธเธฒเธฐ Admin เน€เธ—เนเธฒเธเธฑเนเธ" }
    }

    try {
        // Get the hosting order to find associated service
        const order = await db
            .select()
            .from(hostingOrders)
            .where(eq(hostingOrders.id, orderId))
            .limit(1)

        if (!order || order.length === 0) {
            return { success: false, error: "Hosting order not found" }
        }

        const currentOrder = order[0]
        const serviceId = currentOrder.serviceId

        // Prepare update data for hosting order
        const updateData: any = {
            updatedAt: new Date(),
        }

        if (data.directAdminUsername !== undefined) {
            updateData.directAdminUsername = data.directAdminUsername
        }

        if (data.directAdminPassword !== undefined && data.directAdminPassword.trim() !== "") {
            updateData.directAdminPassword = data.directAdminPassword
        }

        if (data.status !== undefined) {
            updateData.status = data.status
        }

        // Update hosting order
        await db
            .update(hostingOrders)
            .set(updateData)
            .where(eq(hostingOrders.id, orderId))

        // Update associated service
        if (serviceId) {
            const serviceUpdateData: any = {}
            if (data.status !== undefined) {
                serviceUpdateData.status = data.status as "active" | "pending" | "suspended" | "terminated"
            }
            if (data.nextDueDate !== undefined) {
                serviceUpdateData.nextDueDate = data.nextDueDate
            }

            if (Object.keys(serviceUpdateData).length > 0) {
                await db
                    .update(services)
                    .set(serviceUpdateData)
                    .where(eq(services.id, serviceId))
            }
        }

        revalidatePath("/dashboard/admin/hosting")
        revalidatePath("/dashboard/services")

        return { success: true }
    } catch (error) {
        console.error("Error updating hosting order:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธญเธฑเธเน€เธ”เธ•เธเธณเธชเธฑเนเธเธเธทเนเธญเนเธฎเธชเธ•เธดเนเธเนเธ”เน",
        }
    }
}


/**
 * Suspend DirectAdmin account (Admin only)
 * Unsuspend functionality has been removed
 */
export async function toggleHostingSuspension(
    orderId: number,
    shouldSuspend: boolean
): Promise<{ success: boolean; error?: string }> {
    // Only allow suspend, not unsuspend
    if (!shouldSuspend) {
        return { success: false, error: "เธเธฑเธเธเนเธเธฑเธเธขเธเน€เธฅเธดเธเธเธฒเธฃเธฃเธฐเธเธฑเธเนเธกเนเธเธฃเนเธญเธกเนเธเนเธเธฒเธ" }
    }
    const cookieStore = await cookies()
    const userId = await getSessionUserIdValue(cookieStore)

    if (!userId) {
        return { success: false, error: "เนเธกเนเธเธเธเธฒเธฃเธขเธทเธเธขเธฑเธเธ•เธฑเธงเธ•เธ" }
    }

    const userIdNum = parseInt(userId)

    const user = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userIdNum))
        .limit(1)

    if (!user || user.length === 0 || user[0].role !== "admin") {
        return { success: false, error: "เนเธกเนเธกเธตเธชเธดเธ—เธเธดเน - เน€เธเธเธฒเธฐ Admin เน€เธ—เนเธฒเธเธฑเนเธ" }
    }

    try {
        const order = await db
            .select()
            .from(hostingOrders)
            .where(eq(hostingOrders.id, orderId))
            .limit(1)

        if (!order || order.length === 0) {
            return { success: false, error: "Hosting order not found" }
        }

        // Get package to know DirectAdmin config
        const pkg = await db
            .select({
                configId: hostingPackages.configId,
            })
            .from(hostingPackages)
            .where(eq(hostingPackages.id, order[0].packageId))
            .limit(1)

        if (!pkg || pkg.length === 0) {
            return { success: false, error: "เนเธกเนเธเธเธเนเธญเธกเธนเธฅเนเธเนเธเน€เธเธเธเธญเธเธเธณเธชเธฑเนเธเธเธทเนเธญเธเธตเน" }
        }

        let daConfig
        if (pkg[0].configId) {
            daConfig = await db
                .select()
                .from(directAdminConfig)
                .where(eq(directAdminConfig.id, pkg[0].configId))
                .limit(1)
        } else {
            daConfig = await db
                .select()
                .from(directAdminConfig)
                .where(eq(directAdminConfig.isActive, true))
                .limit(1)
        }

        if (!daConfig || daConfig.length === 0) {
            return { success: false, error: "เนเธกเนเธเธเธเธฒเธฃเธ•เธฑเนเธเธเนเธฒ DirectAdmin" }
        }

        const daClient = new DirectAdminClient({
            resellerUsername: daConfig[0].resellerUsername,
            resellerPassword: daConfig[0].resellerPassword,
            serverIp: daConfig[0].serverIp,
            panelUrl: daConfig[0].panelUrl,
        })

        // Call DirectAdmin API - only suspend is supported
        const result = await daClient.suspendAccount(order[0].directAdminUsername)

        if (!result.success) {
            return { success: false, error: `เธเนเธญเธเธดเธ”เธเธฅเธฒเธ” DirectAdmin: ${result.message}` }
        }

        // Update DB status if successful
        const newStatus = shouldSuspend ? "suspended" : "active"

        await db
            .update(hostingOrders)
            .set({
                status: newStatus,
                updatedAt: new Date(),
            })
            .where(eq(hostingOrders.id, orderId))

        if (order[0].serviceId) {
            await db
                .update(services)
                .set({
                    status: newStatus,
                })
                .where(eq(services.id, order[0].serviceId))
        }

        revalidatePath("/dashboard/admin/hosting")
        revalidatePath("/dashboard/services")

        return { success: true }
    } catch (error) {
        console.error("Error toggling suspension:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เน€เธเธฅเธตเนเธขเธเธชเธ–เธฒเธเธฐเธเธฒเธฃเธฃเธฐเธเธฑเธเนเธ”เน",
        }
    }
}

/**
 * Suspend expired hosting accounts
 * This function checks for hosting services that have expired (nextDueDate < today)
 * and suspends them on DirectAdmin
 */
export async function suspendExpiredHosting() {
    try {
        const now = new Date()
        console.log(`[${now.toISOString()}] Checking for expired hosting services...`)

        // Find all active hosting services that have expired
        const expiredServices = await db
            .select({
                id: services.id,
                userId: services.userId,
                name: services.name,
                nextDueDate: services.nextDueDate,
                status: services.status,
            })
            .from(services)
            .where(
                and(
                    eq(services.type, "hosting"),
                    eq(services.status, "active"),
                    sql`${services.nextDueDate} < ${now}`
                )
            )

        if (expiredServices.length === 0) {
            console.log("No expired hosting services found.")
            return {
                success: true,
                message: "เนเธกเนเธเธเธเธฃเธดเธเธฒเธฃเนเธฎเธชเธ•เธดเนเธเธ—เธตเนเธซเธกเธ”เธญเธฒเธขเธธ",
                suspendedCount: 0,
            }
        }

        console.log(`Found ${expiredServices.length} expired hosting service(s)`)

        let suspendedCount = 0
        let failedCount = 0
        const errors: string[] = []

        // Process each expired service
        for (const service of expiredServices) {
            try {
                console.log(`Processing expired service ID: ${service.id} (${service.name})`)

                // Find the hosting order for this service
                const hostingOrder = await db
                    .select({
                        id: hostingOrders.id,
                        directAdminUsername: hostingOrders.directAdminUsername,
                        packageId: hostingOrders.packageId,
                        status: hostingOrders.status,
                        domain: hostingOrders.domain,
                    })
                    .from(hostingOrders)
                    .where(eq(hostingOrders.serviceId, service.id))
                    .limit(1)

                if (!hostingOrder || hostingOrder.length === 0) {
                    console.warn(`No hosting order found for service ID: ${service.id}`)
                    errors.push(`Service ${service.id}: No hosting order found`)
                    failedCount++
                    continue
                }

                const order = hostingOrder[0]

                // Skip if already suspended
                if (order.status === "suspended") {
                    console.log(`Service ${service.id} is already suspended, skipping...`)
                    continue
                }

                // Get the package to find DirectAdmin config
                const packageData = await db
                    .select({
                        configId: hostingPackages.configId,
                    })
                    .from(hostingPackages)
                    .where(eq(hostingPackages.id, order.packageId))
                    .limit(1)

                if (!packageData || packageData.length === 0) {
                    console.warn(`Package not found for hosting order ID: ${order.id}`)
                    errors.push(`Service ${service.id}: Package not found`)
                    failedCount++
                    continue
                }

                const daConfig = await getDirectAdminConfig(packageData[0].configId || undefined)

                const daClient = new DirectAdminClient({
                    resellerUsername: daConfig.resellerUsername,
                    resellerPassword: daConfig.resellerPassword,
                    serverIp: daConfig.serverIp,
                    panelUrl: daConfig.panelUrl,
                })

                console.log(`Suspending DirectAdmin account: ${order.directAdminUsername}`)
                const suspendResult = await daClient.suspendAccount(order.directAdminUsername)

                if (!suspendResult.success) {
                    console.error(`Failed to suspend DirectAdmin account ${order.directAdminUsername}: ${suspendResult.message}`)
                    errors.push(`Service ${service.id}: ${suspendResult.message}`)
                    failedCount++
                    continue
                }

                // Update service status to suspended
                await db
                    .update(services)
                    .set({
                        status: "suspended",
                    })
                    .where(eq(services.id, service.id))

                // Update hosting order status to suspended
                await db
                    .update(hostingOrders)
                    .set({
                        status: "suspended",
                        updatedAt: new Date(),
                    })
                    .where(eq(hostingOrders.id, order.id))

                // Create notification for suspension
                await db.insert(notifications).values({
                    userId: service.userId,
                    type: "service",
                    title: "Hosting เธ–เธนเธเธฃเธฐเธเธฑเธ",
                    message: `Hosting ${service.name} เธ–เธนเธเธฃเธฐเธเธฑเธเน€เธเธทเนเธญเธเธเธฒเธเธซเธกเธ”เธญเธฒเธขเธธ เธเธฃเธธเธ“เธฒเธ•เนเธญเธญเธฒเธขเธธเน€เธเธทเนเธญเนเธเนเธเธฒเธเธ•เนเธญ`,
                    link: `/dashboard/services`,
                })

                console.log(`โ… Successfully suspended service ID: ${service.id} (DirectAdmin username: ${order.directAdminUsername})`)
                suspendedCount++
            } catch (error) {
                console.error(`Error processing service ID ${service.id}:`, error)
                errors.push(`Service ${service.id}: ${error instanceof Error ? error.message : "Unknown error"}`)
                failedCount++
            }
        }

        const result = {
            success: true,
            message: `Processed ${expiredServices.length} expired service(s). Suspended: ${suspendedCount}, Failed: ${failedCount}`,
            suspendedCount,
            failedCount,
            totalExpired: expiredServices.length,
        }

        if (errors.length > 0) {
            console.error("Errors encountered:", errors)
            return {
                ...result,
                errors,
            }
        }

        console.log(`โ… Suspension process completed: ${suspendedCount} service(s) suspended`)
        return result
    } catch (error) {
        console.error("Error in suspendExpiredHosting:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฃเธฐเธเธฑเธเนเธฎเธชเธ•เธดเนเธเธ—เธตเนเธซเธกเธ”เธญเธฒเธขเธธเนเธ”เน",
            suspendedCount: 0,
            failedCount: 0,
        }
    }
}

/**
 * Renew hosting service
 * Allows user to extend their hosting service for 1, 3, 6, or 12 months
 */
export async function renewHosting(formData: FormData) {
    try {
        const cookieStore = await cookies()
        const userId = await getSessionUserIdValue(cookieStore)

        if (!userId) {
            return {
                success: false,
                error: "เธเธฃเธธเธ“เธฒเน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธ",
            }
        }

        const userIdNum = parseInt(userId)
        const serviceId = parseInt(formData.get("serviceId") as string)
        const months = parseInt(formData.get("months") as string)

        if (!serviceId || !months || ![1, 3, 6, 12].includes(months)) {
            return {
                success: false,
                error: "เธฃเธซเธฑเธชเธเธฃเธดเธเธฒเธฃเธซเธฃเธทเธญเธฃเธฐเธขเธฐเน€เธงเธฅเธฒเธ•เนเธญเธญเธฒเธขเธธเนเธกเนเธ–เธนเธเธ•เนเธญเธ",
            }
        }

        // Get service and verify ownership
        const service = await db
            .select()
            .from(services)
            .where(eq(services.id, serviceId))
            .limit(1)

        if (!service || service.length === 0) {
            return {
                success: false,
                error: "เนเธกเนเธเธเธเธฃเธดเธเธฒเธฃ",
            }
        }

        if (service[0].userId !== userIdNum) {
            return {
                success: false,
                error: "Unauthorized",
            }
        }

        if (service[0].type !== "hosting") {
            return {
                success: false,
                error: "เธเธฃเธดเธเธฒเธฃเธเธตเนเนเธกเนเนเธเนเธเธฃเธดเธเธฒเธฃเนเธฎเธชเธ•เธดเนเธ",
            }
        }

        // Get hosting order
        const hostingOrder = await db
            .select({
                id: hostingOrders.id,
                packageId: hostingOrders.packageId,
                directAdminUsername: hostingOrders.directAdminUsername,
                domain: hostingOrders.domain,
            })
            .from(hostingOrders)
            .where(eq(hostingOrders.serviceId, serviceId))
            .limit(1)

        if (!hostingOrder || hostingOrder.length === 0) {
            return {
                success: false,
                error: "Hosting order not found",
            }
        }

        // Get package to calculate renewal price and find config
        const packageData = await db
            .select()
            .from(hostingPackages)
            .where(eq(hostingPackages.id, hostingOrder[0].packageId))
            .limit(1)

        if (!packageData || packageData.length === 0) {
            return {
                success: false,
                error: "เนเธกเนเธเธเนเธเนเธเน€เธเธ",
            }
        }

        const pkg = packageData[0]
        const monthlyPrice = parseFloat(pkg.price)
        const renewalPrice = monthlyPrice * months

        // Check wallet balance
        const wallet = await db
            .select()
            .from(wallets)
            .where(eq(wallets.userId, userIdNum))
            .limit(1)

        if (!wallet || wallet.length === 0) {
            return {
                success: false,
                error: "เนเธกเนเธเธเธเธฃเธฐเน€เธเนเธฒเน€เธเธดเธ เธเธฃเธธเธ“เธฒเธ•เธดเธ”เธ•เนเธญเธเนเธฒเธขเธชเธเธฑเธเธชเธเธธเธ",
            }
        }

        const walletBalance = parseFloat(wallet[0].balance)

        if (walletBalance < renewalPrice) {
            return {
                success: false,
                error: `เธขเธญเธ”เน€เธเธดเธเนเธกเนเธเธญ เธ•เนเธญเธเธเธฒเธฃ: ${renewalPrice.toFixed(2)} เธเธฒเธ—, เธกเธตเธญเธขเธนเน: ${walletBalance.toFixed(2)} เธเธฒเธ—`,
            }
        }

        // Unsuspend if needed
        if (service[0].status === "suspended") {
            const daConfig = await getDirectAdminConfig(pkg.configId || undefined)
            const daClient = new DirectAdminClient({
                resellerUsername: daConfig.resellerUsername,
                resellerPassword: daConfig.resellerPassword,
                serverIp: daConfig.serverIp,
                panelUrl: daConfig.panelUrl,
            })
            await daClient.unsuspendAccount(hostingOrder[0].directAdminUsername)

            // Update status to active
            await db
                .update(hostingOrders)
                .set({ status: "active" })
                .where(eq(hostingOrders.id, hostingOrder[0].id))
        }

        // Calculate new due date
        const currentDueDate = service[0].nextDueDate || new Date()
        // If expired, start from now? Or from expiration?
        // Usually if suspended, we renew from now or from expiration depending on policy.
        // Assuming strict renewal: extends from existing due date.
        // But if it's very old, it might be weird. Let's assume standard behavior: extend current due date.
        // However, if it's already expired (today > nextDueDate), simply adding months to nextDueDate might still leave it expired or barely active.
        // For user convenience, if expired, we might want to reset to NOW + months, or handle it properly.
        // Let's stick to extending the date for simple renewal logic.

        // Correct logic: if expired, maybe we should ensure new date is in future?
        // User requested: "เน€เธกเธทเนเธญเธเธ”เธ•เนเธญเธกเธฑเธเธเนเธฐเธเธฅเธ”เธฃเธฐเธเธฑเธ ... เนเธเนเธเธฒเธเธ•เนเธญเนเธ”เน"
        // Let's ensure the new date is at least Now + Months if it was expired?
        // Or just `setMonth(newDueDate.getMonth() + months)`.
        // If expired 2 months ago and they pay for 1 month, it's still expired. That's bad.
        // Let's verify expiration status.

        let newDueDate = new Date(currentDueDate)
        if (newDueDate < new Date()) {
            // If already expired, start fresh from today
            newDueDate = new Date()
        }
        newDueDate.setMonth(newDueDate.getMonth() + months)

        // Update service nextDueDate and status
        await db
            .update(services)
            .set({
                nextDueDate: newDueDate,
                status: "active" // Ensure active
            })
            .where(eq(services.id, serviceId))

        // Deduct from wallet
        const newBalance = walletBalance - renewalPrice
        await db
            .update(wallets)
            .set({
                balance: newBalance.toString(),
                updatedAt: new Date(),
            })
            .where(eq(wallets.userId, userIdNum))

        // Create invoice
        await db.insert(invoices).values({
            userId: userIdNum,
            serviceId: serviceId,
            amount: renewalPrice.toString(),
            status: "paid",
            dueDate: newDueDate,
            paidAt: new Date(),
        })

        // Create notification for renewal
        await db.insert(notifications).values({
            userId: userIdNum,
            type: "service",
            title: "เธ•เนเธญเธญเธฒเธขเธธ Hosting เธชเธณเน€เธฃเนเธ",
            message: `Hosting เนเธ”เนเธ–เธนเธเธ•เนเธญเธญเธฒเธขเธธเน€เธเนเธเน€เธงเธฅเธฒ ${months} เน€เธ”เธทเธญเธเนเธฅเนเธง`,
            link: `/dashboard/services`,
        })

        // Add transaction record
        await db.insert(pointTransactions).values({
            userId: userIdNum,
            walletId: wallet[0].id,
            amount: (-renewalPrice).toString(),
            type: "payment",
            description: `Hosting renewal for ${months} month(s)`,
            referenceId: serviceId.toString(),
        })

        revalidatePath("/dashboard/hosting")
        revalidatePath("/dashboard/wallet")
        revalidatePath("/dashboard/billing")

        return {
            success: true,
            message: `เธ•เนเธญเธญเธฒเธขเธธเนเธฎเธชเธ•เธดเนเธเธชเธณเน€เธฃเนเธเน€เธเนเธเน€เธงเธฅเธฒ ${months} เน€เธ”เธทเธญเธ`,
            data: {
                newDueDate,
                renewalPrice,
            },
        }
    } catch (error) {
        console.error("Error renewing hosting:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ•เนเธญเธญเธฒเธขเธธเนเธฎเธชเธ•เธดเนเธเนเธ”เน",
        }
    }
}

/**
 * Change hosting package
 * Calculates pro-rated amount based on remaining days and package prices
 */
export async function changeHostingPackage(formData: FormData) {
    try {
        const cookieStore = await cookies()
        const userId = await getSessionUserIdValue(cookieStore)

        if (!userId) {
            return {
                success: false,
                error: "เธเธฃเธธเธ“เธฒเน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธ",
            }
        }

        const userIdNum = parseInt(userId)
        const serviceId = parseInt(formData.get("serviceId") as string)
        const newPackageId = parseInt(formData.get("newPackageId") as string)

        if (!serviceId || !newPackageId) {
            return {
                success: false,
                error: "เธฃเธซเธฑเธชเธเธฃเธดเธเธฒเธฃเธซเธฃเธทเธญเธฃเธซเธฑเธชเนเธเนเธเน€เธเธเนเธกเนเธ–เธนเธเธ•เนเธญเธ",
            }
        }

        // Get service and verify ownership
        const service = await db
            .select()
            .from(services)
            .where(eq(services.id, serviceId))
            .limit(1)

        if (!service || service.length === 0) {
            return {
                success: false,
                error: "เนเธกเนเธเธเธเธฃเธดเธเธฒเธฃ",
            }
        }

        if (service[0].userId !== userIdNum) {
            return {
                success: false,
                error: "Unauthorized",
            }
        }

        if (service[0].type !== "hosting") {
            return {
                success: false,
                error: "เธเธฃเธดเธเธฒเธฃเธเธตเนเนเธกเนเนเธเนเธเธฃเธดเธเธฒเธฃเนเธฎเธชเธ•เธดเนเธ",
            }
        }

        // Get hosting order
        const hostingOrder = await db
            .select({
                id: hostingOrders.id,
                packageId: hostingOrders.packageId,
                directAdminUsername: hostingOrders.directAdminUsername,
                domain: hostingOrders.domain,
            })
            .from(hostingOrders)
            .where(eq(hostingOrders.serviceId, serviceId))
            .limit(1)

        if (!hostingOrder || hostingOrder.length === 0) {
            return {
                success: false,
                error: "Hosting order not found",
            }
        }

        const currentPackageId = hostingOrder[0].packageId

        if (currentPackageId === newPackageId) {
            return {
                success: false,
                error: "เธเธธเธ“เนเธเนเนเธเนเธเน€เธเธเธเธตเนเธญเธขเธนเนเนเธฅเนเธง",
            }
        }

        // Get current and new packages
        const [currentPackage, newPackage] = await Promise.all([
            db
                .select()
                .from(hostingPackages)
                .where(eq(hostingPackages.id, currentPackageId))
                .limit(1),
            db
                .select()
                .from(hostingPackages)
                .where(eq(hostingPackages.id, newPackageId))
                .limit(1),
        ])

        if (!currentPackage || currentPackage.length === 0 || !newPackage || newPackage.length === 0) {
            return {
                success: false,
                error: "Package not found",
            }
        }

        const currentPkg = currentPackage[0]
        const newPkg = newPackage[0]

        // Calculate pro-rated amount
        const currentDueDate = service[0].nextDueDate || new Date()
        const now = new Date()
        const daysRemaining = Math.max(0, Math.ceil((currentDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

        // Calculate days in current billing period
        const billingCycle = currentPkg.billingCycle === "yearly" ? 365 : 30
        const daysInPeriod = Math.max(1, Math.ceil((currentDueDate.getTime() - (service[0].createdAt?.getTime() || now.getTime())) / (1000 * 60 * 60 * 24)))

        // Calculate refund for remaining days (current package)
        const currentMonthlyPrice = parseFloat(currentPkg.price)
        const currentDailyPrice = currentMonthlyPrice / billingCycle
        const refundAmount = currentDailyPrice * daysRemaining

        // Calculate cost for remaining days (new package)
        const newMonthlyPrice = parseFloat(newPkg.price)
        const newBillingCycle = newPkg.billingCycle === "yearly" ? 365 : 30
        const newDailyPrice = newMonthlyPrice / newBillingCycle
        const newCost = newDailyPrice * daysRemaining

        // Calculate net amount (positive = need to pay, negative = refund)
        const netAmount = newCost - refundAmount

        // Get wallet
        const wallet = await db
            .select()
            .from(wallets)
            .where(eq(wallets.userId, userIdNum))
            .limit(1)

        if (!wallet || wallet.length === 0) {
            return {
                success: false,
                error: "เนเธกเนเธเธเธเธฃเธฐเน€เธเนเธฒเน€เธเธดเธ เธเธฃเธธเธ“เธฒเธ•เธดเธ”เธ•เนเธญเธเนเธฒเธขเธชเธเธฑเธเธชเธเธธเธ",
            }
        }

        const walletBalance = parseFloat(wallet[0].balance)

        // If need to pay, check balance
        if (netAmount > 0 && walletBalance < netAmount) {
            return {
                success: false,
                error: `เธขเธญเธ”เน€เธเธดเธเนเธกเนเธเธญ เธ•เนเธญเธเธเธฒเธฃ: ${netAmount.toFixed(2)} เธเธฒเธ—, เธกเธตเธญเธขเธนเน: ${walletBalance.toFixed(2)} เธเธฒเธ—`,
            }
        }

        // Update package in DirectAdmin
        const daConfig = await getDirectAdminConfig(newPkg.configId || undefined)

        // Only update if package name is different and username exists
        if (currentPkg.directAdminPackageName !== newPkg.directAdminPackageName && newPkg.directAdminPackageName && hostingOrder[0].directAdminUsername) {
            const daClient = new DirectAdminClient({
                resellerUsername: daConfig.resellerUsername,
                resellerPassword: daConfig.resellerPassword,
                serverIp: daConfig.serverIp,
                panelUrl: daConfig.panelUrl,
            })

            console.log(`Changing DirectAdmin package for ${hostingOrder[0].directAdminUsername} to ${newPkg.directAdminPackageName}`)

            const daResult = await daClient.changePackage(hostingOrder[0].directAdminUsername, newPkg.directAdminPackageName)

            if (!daResult.success) {
                console.error("Failed to change DirectAdmin package:", daResult.message)
                return {
                    success: false,
                    error: `เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธเธฃเธฑเธเน€เธเธฅเธตเนเธขเธเนเธเนเธเน€เธเธเธเธเน€เธเธดเธฃเนเธเน€เธงเธญเธฃเนเนเธ”เน: ${daResult.message}`,
                }
            }
        }

        // Update hosting order package
        await db
            .update(hostingOrders)
            .set({
                packageId: newPackageId,
                updatedAt: new Date(),
            })
            .where(eq(hostingOrders.id, hostingOrder[0].id))

        // Update service price
        await db
            .update(services)
            .set({
                price: newPkg.price,
                billingCycle: newPkg.billingCycle,
            })
            .where(eq(services.id, serviceId))

        // Update wallet
        const newBalance = walletBalance - netAmount
        await db
            .update(wallets)
            .set({
                balance: newBalance.toString(),
                updatedAt: new Date(),
            })
            .where(eq(wallets.userId, userIdNum))

        // Create invoice if need to pay
        if (netAmount > 0) {
            const [changePackageInvoice] = await db.insert(invoices).values({
                userId: userIdNum,
                serviceId: serviceId,
                amount: netAmount.toString(),
                status: "paid",
                dueDate: currentDueDate,
                paidAt: new Date(),
            }).returning()
            console.log("Change package invoice created:", changePackageInvoice?.id)
        }

        // Create notification for package change
        await db.insert(notifications).values({
            userId: userIdNum,
            type: "service",
            title: "เน€เธเธฅเธตเนเธขเธ Package เธชเธณเน€เธฃเนเธ",
            message: `Package เนเธ”เนเธ–เธนเธเน€เธเธฅเธตเนเธขเธเน€เธเนเธ ${newPkg.name} เนเธฅเนเธง`,
            link: `/dashboard/services`,
        })

        // Add transaction record
        await db.insert(pointTransactions).values({
            userId: userIdNum,
            walletId: wallet[0].id,
            amount: (-netAmount).toString(),
            type: netAmount > 0 ? "payment" : "refund",
            description: `Package change: ${currentPkg.name} โ’ ${newPkg.name} (${daysRemaining} days remaining)`,
            referenceId: serviceId.toString(),
        })

        revalidatePath("/dashboard/hosting")
        revalidatePath("/dashboard/wallet")
        revalidatePath("/dashboard/billing")

        return {
            success: true,
            message: netAmount > 0
                ? `เน€เธเธฅเธตเนเธขเธเนเธเนเธเน€เธเธเธชเธณเน€เธฃเนเธ เธ•เนเธญเธเธเธณเธฃเธฐเน€เธเธดเนเธก: ${netAmount.toFixed(2)} เธเธฒเธ—`
                : `เน€เธเธฅเธตเนเธขเธเนเธเนเธเน€เธเธเธชเธณเน€เธฃเนเธ เธเธทเธเน€เธเธดเธ: ${Math.abs(netAmount).toFixed(2)} เธเธฒเธ—`,
            data: {
                netAmount,
                refundAmount,
                newCost,
                daysRemaining,
            },
        }
    } catch (error) {
        console.error("Error changing hosting package:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เน€เธเธฅเธตเนเธขเธเนเธเนเธเน€เธเธเนเธฎเธชเธ•เธดเนเธเนเธ”เน",
        }
    }
}

/**
 * Calculate pro-rated price for changing package
 * Returns the amount user needs to pay (positive) or will receive (negative)
 */
export async function calculateChangePackagePrice(serviceId: number, newPackageId: number) {
    try {
        const cookieStore = await cookies()
        const userId = await getSessionUserIdValue(cookieStore)

        if (!userId) {
            return {
                success: false,
                error: "เธเธฃเธธเธ“เธฒเน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธ",
            }
        }

        const userIdNum = parseInt(userId)

        // Get service and verify ownership
        const service = await db
            .select()
            .from(services)
            .where(eq(services.id, serviceId))
            .limit(1)

        if (!service || service.length === 0 || service[0].userId !== userIdNum) {
            return {
                success: false,
                error: "เนเธกเนเธเธเธเธฃเธดเธเธฒเธฃเธซเธฃเธทเธญเนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเน€เธเนเธฒเธ–เธถเธ",
            }
        }

        // Get hosting order
        const hostingOrder = await db
            .select({
                packageId: hostingOrders.packageId,
            })
            .from(hostingOrders)
            .where(eq(hostingOrders.serviceId, serviceId))
            .limit(1)

        if (!hostingOrder || hostingOrder.length === 0) {
            return {
                success: false,
                error: "Hosting order not found",
            }
        }

        const currentPackageId = hostingOrder[0].packageId

        if (currentPackageId === newPackageId) {
            return {
                success: true,
                data: {
                    netAmount: 0,
                    refundAmount: 0,
                    newCost: 0,
                    daysRemaining: 0,
                },
            }
        }

        // Get packages
        const [currentPackage, newPackage] = await Promise.all([
            db
                .select()
                .from(hostingPackages)
                .where(eq(hostingPackages.id, currentPackageId))
                .limit(1),
            db
                .select()
                .from(hostingPackages)
                .where(eq(hostingPackages.id, newPackageId))
                .limit(1),
        ])

        if (!currentPackage || currentPackage.length === 0 || !newPackage || newPackage.length === 0) {
            return {
                success: false,
                error: "Package not found",
            }
        }

        const currentPkg = currentPackage[0]
        const newPkg = newPackage[0]

        // Calculate pro-rated amount
        const currentDueDate = service[0].nextDueDate || new Date()
        const now = new Date()
        const daysRemaining = Math.max(0, Math.ceil((currentDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

        // Calculate days in current billing period
        const currentBillingCycle = currentPkg.billingCycle === "yearly" ? 365 : 30
        const newBillingCycle = newPkg.billingCycle === "yearly" ? 365 : 30

        // Calculate refund for remaining days (current package)
        const currentMonthlyPrice = parseFloat(currentPkg.price)
        const currentDailyPrice = currentMonthlyPrice / currentBillingCycle
        const refundAmount = currentDailyPrice * daysRemaining

        // Calculate cost for remaining days (new package)
        const newMonthlyPrice = parseFloat(newPkg.price)
        const newDailyPrice = newMonthlyPrice / newBillingCycle
        const newCost = newDailyPrice * daysRemaining

        // Calculate net amount (positive = need to pay, negative = refund)
        const netAmount = newCost - refundAmount

        return {
            success: true,
            data: {
                netAmount,
                refundAmount,
                newCost,
                daysRemaining,
            },
        }
    } catch (error) {
        console.error("Error calculating change package price:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธเธณเธเธงเธ“เธฃเธฒเธเธฒเนเธ”เน",
        }
    }
}


