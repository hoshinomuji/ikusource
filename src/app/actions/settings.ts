"use server"

import { getSessionUserIdValue } from "@/lib/session"
import { db } from "@/db"
import { cookies } from "next/headers"
import { users, systemSettings } from "@/db/schema"
import { eq, count } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { sendEmail } from "@/lib/email-service"
import { hasDatabaseConnectionConfig } from "@/db/config"
function shouldSkipDbDuringBuild() {
    return process.env.NEXT_PHASE === "phase-production-build" && !hasDatabaseConnectionConfig()
}

// Check if user is admin
async function checkAdmin() {
    const cookieStore = await cookies()
    const userId = await getSessionUserIdValue(cookieStore)

    if (!userId) {
        return { isAdmin: false, error: "Not authenticated" }
    }

    const user = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, parseInt(userId)))
        .limit(1)

    if (!user || user.length === 0 || user[0].role !== "admin") {
        return { isAdmin: false, error: "Not authorized" }
    }

    return { isAdmin: true }
}

// Get a setting by key
export async function getSetting(key: string): Promise<string | null> {
    if (shouldSkipDbDuringBuild()) {
        return null
    }

    try {
        const result = await db
            .select({ value: systemSettings.value })
            .from(systemSettings)
            .where(eq(systemSettings.key, key))
            .limit(1)

        return result.length > 0 ? result[0].value : null
    } catch (error: any) {
        // If DB connection fails during build, return null (fallback)
        const errorCode = error?.code || error?.cause?.code;
        const errorMessage = error?.message || error?.cause?.message || "";

        // Handle various database errors during build
        if (
            errorCode === "ECONNREFUSED" ||
            errorCode === "42P01" || // relation does not exist
            errorMessage.includes("does not exist") ||
            errorMessage.includes("relation") ||
            !hasDatabaseConnectionConfig()
        ) {
            console.warn(`Failed to fetch setting "${key}" from database during build (${errorCode || 'unknown'}) - using fallback`)
            return null
        }
        console.warn(`Failed to fetch setting "${key}" from database:`, error)
        return null
    }
}

// Get multiple settings
export async function getSettings(keys: string[]): Promise<Record<string, string>> {
    const results: Record<string, string> = {}

    for (const key of keys) {
        const value = await getSetting(key)
        if (value !== null) {
            results[key] = value
        }
    }

    return results
}

// Set a setting
export async function setSetting(key: string, value: string, description?: string): Promise<{ success: boolean; error?: string }> {
    const adminCheck = await checkAdmin()
    if (!adminCheck.isAdmin) {
        return { success: false, error: adminCheck.error }
    }

    try {
        const existing = await db
            .select()
            .from(systemSettings)
            .where(eq(systemSettings.key, key))
            .limit(1)

        if (existing.length > 0) {
            await db
                .update(systemSettings)
                .set({
                    value,
                    description: description || existing[0].description,
                    updatedAt: new Date(),
                })
                .where(eq(systemSettings.key, key))
        } else {
            await db.insert(systemSettings).values({
                key,
                value,
                description,
            })
        }

        revalidatePath("/dashboard/admin/settings")
        return { success: true }
    } catch (error: any) {
        console.error("Error setting value:", error)
        const errorCode = error?.code || error?.cause?.code
        if (errorCode === "ECONNREFUSED") {
            return { success: false, error: "Database connection failed (ECONNREFUSED)" }
        }
        if (errorCode === "42P01") {
            return { success: false, error: "Database schema not ready (table missing)" }
        }
        return { success: false, error: "Failed to save setting" }
    }
}

async function setSettingOrThrow(key: string, value: string, description?: string) {
    const result = await setSetting(key, value, description)
    if (!result.success) {
        throw new Error(result.error || `Failed to save setting: ${key}`)
    }
}

// Get cron settings
export async function getCronSettings(): Promise<{
    cronSecret: string | null
    autoSuspendEnabled: boolean
    suspendGraceDays: number
    checkIntervalMinutes: number
}> {
    try {
        const settings = await getSettings([
            "cron_secret",
            "auto_suspend_enabled",
            "suspend_grace_days",
            "suspension_check_interval_minutes"
        ])

        return {
            cronSecret: settings["cron_secret"] || process.env.CRON_SECRET || null,
            autoSuspendEnabled: settings["auto_suspend_enabled"] === "true",
            suspendGraceDays: parseInt(settings["suspend_grace_days"] || "0"),
            checkIntervalMinutes: parseInt(settings["suspension_check_interval_minutes"] || "1"),
        }
    } catch {
        return {
            cronSecret: null,
            autoSuspendEnabled: false,
            suspendGraceDays: 0,
            checkIntervalMinutes: 1,
        }
    }
}

// Save cron settings
export async function saveCronSettings(data: {
    autoSuspendEnabled: boolean
    suspendGraceDays: number
    checkIntervalMinutes?: number
}): Promise<{ success: boolean; error?: string }> {
    const adminCheck = await checkAdmin()
    if (!adminCheck.isAdmin) {
        return { success: false, error: adminCheck.error }
    }

    try {
        await setSettingOrThrow("auto_suspend_enabled", String(data.autoSuspendEnabled), "Enable automatic suspension of expired services")
        await setSettingOrThrow("suspend_grace_days", String(data.suspendGraceDays), "Grace period days after expiration before suspension")
        if (data.checkIntervalMinutes !== undefined) {
            await setSettingOrThrow("suspension_check_interval_minutes", String(data.checkIntervalMinutes), "How often to check for expired services (minutes)")
        }

        revalidatePath("/dashboard/admin/settings")
        return { success: true }
    } catch (error) {
        console.error("Error saving cron settings:", error)
        return { success: false, error: "Failed to save settings" }
    }
}

// Get all system settings (for admin view)
export async function getAllSettings(): Promise<{
    success: boolean
    data?: { key: string; value: string; description: string | null }[]
    error?: string
}> {
    const adminCheck = await checkAdmin()
    if (!adminCheck.isAdmin) {
        return { success: false, error: adminCheck.error }
    }

    try {
        const settings = await db
            .select({
                key: systemSettings.key,
                value: systemSettings.value,
                description: systemSettings.description,
            })
            .from(systemSettings)

        return { success: true, data: settings }
    } catch (error) {
        console.error("Error fetching settings:", error)
        return { success: false, error: "Failed to fetch settings" }
    }
}

// Get payment settings (TrueMoney, slip verify receiver name, bank info)
export async function getPaymentSettings(): Promise<{
    truemoneyDefaultPhone: string
    truemoneyEnabled: boolean
    slipVerifyReceiverNameTh: string
    slipVerifyReceiverNameEn: string
    bankName: string
    bankAccountNumber: string
}> {
    try {
        const settings = await getSettings([
            "truemoney_default_phone",
            "truemoney_enabled",
            "slip_verify_receiver_name_th",
            "slip_verify_receiver_name_en",
            "slip_verify_receiver_name",
            "bank_name",
            "bank_account_number",
            // Backward compatibility with old keys
            "rdcw_account_name",
            "rdcw_bank_name",
            "rdcw_bank_account_number",
        ])

        return {
            truemoneyDefaultPhone: settings["truemoney_default_phone"] || "",
            truemoneyEnabled: settings["truemoney_enabled"] === "true",
            slipVerifyReceiverNameTh: settings["slip_verify_receiver_name_th"] || settings["slip_verify_receiver_name"] || settings["rdcw_account_name"] || "",
            slipVerifyReceiverNameEn: settings["slip_verify_receiver_name_en"] || "",
            bankName: settings["bank_name"] || settings["rdcw_bank_name"] || "",
            bankAccountNumber: settings["bank_account_number"] || settings["rdcw_bank_account_number"] || "",
        }
    } catch {
        return {
            truemoneyDefaultPhone: "",
            truemoneyEnabled: true, // Default enabled
            slipVerifyReceiverNameTh: "",
            slipVerifyReceiverNameEn: "",
            bankName: "",
            bankAccountNumber: "",
        }
    }
}

// Save payment settings
export async function savePaymentSettings(data: {
    truemoneyDefaultPhone: string
    truemoneyEnabled: boolean
    slipVerifyReceiverNameTh: string
    slipVerifyReceiverNameEn: string
    bankName: string
    bankAccountNumber: string
}): Promise<{ success: boolean; error?: string }> {
    const adminCheck = await checkAdmin()
    if (!adminCheck.isAdmin) {
        return { success: false, error: adminCheck.error }
    }

    try {
        await setSettingOrThrow("truemoney_default_phone", data.truemoneyDefaultPhone, "Default phone number for TrueMoney voucher redemption")
        await setSettingOrThrow("truemoney_enabled", String(data.truemoneyEnabled), "Enable/disable TrueMoney voucher redemption")
        await setSettingOrThrow("slip_verify_receiver_name_th", data.slipVerifyReceiverNameTh, "Receiver name (Thai) used for slip verification")
        await setSettingOrThrow("slip_verify_receiver_name_en", data.slipVerifyReceiverNameEn, "Receiver name (English) used for slip verification")
        // Backward-compat key
        await setSettingOrThrow("slip_verify_receiver_name", data.slipVerifyReceiverNameTh, "Receiver name used for slip verification")
        await setSettingOrThrow("bank_name", data.bankName, "Bank name for manual transfer")
        await setSettingOrThrow("bank_account_number", data.bankAccountNumber, "Bank account number for manual transfer")

        revalidatePath("/dashboard/admin/settings")
        return { success: true }
    } catch (error) {
        console.error("Error saving payment settings:", error)
        return { success: false, error: "Failed to save settings" }
    }
}

// Get website settings (logo, store name, website title, description)
export async function getWebsiteSettings(): Promise<{
    logoUrl: string
    storeName: string
    websiteTitle: string
    description: string
}> {
    if (shouldSkipDbDuringBuild()) {
        return {
            logoUrl: "",
            storeName: process.env.NEXT_PUBLIC_STORE_NAME || "Ikuzen Studio",
            websiteTitle: `${process.env.NEXT_PUBLIC_STORE_NAME || "Ikuzen Studio"} - Lightning-Fast Cloud Hosting`,
            description: "",
        }
    }

    try {
        const settings = await getSettings([
            "website_logo_url",
            "website_store_name",
            "website_title",
            "website_description",
        ])

        return {
            logoUrl: settings["website_logo_url"] || "",
            storeName: settings["website_store_name"] || process.env.NEXT_PUBLIC_STORE_NAME || "Ikuzen Studio",
            websiteTitle: settings["website_title"] || `${process.env.NEXT_PUBLIC_STORE_NAME || "Ikuzen Studio"} - Lightning-Fast Cloud Hosting`,
            description: settings["website_description"] || "",
        }
    } catch (error: any) {
        // If DB connection fails during build, return fallback values
        const errorCode = error?.code || error?.cause?.code;
        const errorMessage = error?.message || error?.cause?.message || "";

        // Handle various database errors during build
        if (
            errorCode === "ECONNREFUSED" ||
            errorCode === "42P01" || // relation does not exist
            errorMessage.includes("does not exist") ||
            errorMessage.includes("relation") ||
            !hasDatabaseConnectionConfig()
        ) {
            console.warn(`Error fetching website settings during build (${errorCode || 'unknown'}) - using fallback values`)
            return {
                logoUrl: "",
                storeName: process.env.NEXT_PUBLIC_STORE_NAME || "Ikuzen Studio",
                websiteTitle: `${process.env.NEXT_PUBLIC_STORE_NAME || "Ikuzen Studio"} - Lightning-Fast Cloud Hosting`,
                description: "",
            }
        }
        console.warn("Error fetching website settings - using fallback values:", error)
        return {
            logoUrl: "",
            storeName: process.env.NEXT_PUBLIC_STORE_NAME || "Ikuzen Studio",
            websiteTitle: `${process.env.NEXT_PUBLIC_STORE_NAME || "Ikuzen Studio"} - Lightning-Fast Cloud Hosting`,
            description: "",
        }
    }
}

// Save website settings
export async function saveWebsiteSettings(data: {
    logoUrl: string
    storeName: string
    websiteTitle: string
    description: string
}): Promise<{ success: boolean; error?: string }> {
    const adminCheck = await checkAdmin()
    if (!adminCheck.isAdmin) {
        return { success: false, error: adminCheck.error }
    }

    try {
        await setSettingOrThrow("website_logo_url", data.logoUrl, "Website logo URL")
        await setSettingOrThrow("website_store_name", data.storeName, "Store/Brand name")
        await setSettingOrThrow("website_title", data.websiteTitle, "Website title for browser tab and SEO")
        await setSettingOrThrow("website_description", data.description, "Website description for SEO")

        revalidatePath("/dashboard/admin/settings")
        revalidatePath("/")
        return { success: true }
    } catch (error) {
        console.error("Error saving website settings:", error)
        return { success: false, error: "Failed to save settings" }
    }
}

// Get landing page settings (selected packages and comparison table category)
export async function getLandingPageSettings(): Promise<{
    selectedPackage1: number | null
    selectedPackage2: number | null
    selectedPackage3: number | null
    selectedPackage4: number | null
    comparisonTableCategoryId: number | null
}> {
    try {
        const settings = await getSettings([
            "landing_selected_package_1",
            "landing_selected_package_2",
            "landing_selected_package_3",
            "landing_selected_package_4",
            "landing_comparison_table_category_id",
        ])

        return {
            selectedPackage1: settings["landing_selected_package_1"] ? parseInt(settings["landing_selected_package_1"]) : null,
            selectedPackage2: settings["landing_selected_package_2"] ? parseInt(settings["landing_selected_package_2"]) : null,
            selectedPackage3: settings["landing_selected_package_3"] ? parseInt(settings["landing_selected_package_3"]) : null,
            selectedPackage4: settings["landing_selected_package_4"] ? parseInt(settings["landing_selected_package_4"]) : null,
            comparisonTableCategoryId: settings["landing_comparison_table_category_id"] ? parseInt(settings["landing_comparison_table_category_id"]) : null,
        }
    } catch {
        return {
            selectedPackage1: null,
            selectedPackage2: null,
            selectedPackage3: null,
            selectedPackage4: null,
            comparisonTableCategoryId: null,
        }
    }
}

// Save landing page settings
export async function saveLandingPageSettings(data: {
    selectedPackage1: number | null
    selectedPackage2: number | null
    selectedPackage3: number | null
    selectedPackage4: number | null
    comparisonTableCategoryId: number | null
}): Promise<{ success: boolean; error?: string }> {
    const adminCheck = await checkAdmin()
    if (!adminCheck.isAdmin) {
        return { success: false, error: adminCheck.error }
    }

    try {
        await setSettingOrThrow("landing_selected_package_1", data.selectedPackage1?.toString() || "", "Landing page selected package 1 ID")
        await setSettingOrThrow("landing_selected_package_2", data.selectedPackage2?.toString() || "", "Landing page selected package 2 ID")
        await setSettingOrThrow("landing_selected_package_3", data.selectedPackage3?.toString() || "", "Landing page selected package 3 ID")
        await setSettingOrThrow("landing_selected_package_4", data.selectedPackage4?.toString() || "", "Landing page selected package 4 ID")
        await setSettingOrThrow("landing_comparison_table_category_id", data.comparisonTableCategoryId?.toString() || "", "Landing page comparison table category ID")

        revalidatePath("/dashboard/admin/settings")
        revalidatePath("/")
        return { success: true }
    } catch (error) {
        console.error("Error saving landing page settings:", error)
        return { success: false, error: "Failed to save settings" }
    }
}

/**
 * Get total user count
 */
export async function getTotalUserCount(): Promise<number> {
    if (shouldSkipDbDuringBuild()) {
        return 0
    }

    try {
        const result = await db
            .select({ count: count() })
            .from(users)

        return result[0]?.count || 0
    } catch (error) {
        // If DB connection fails during build, return 0
        const errorCode = (error as any)?.code || (error as any)?.cause?.code
        if (errorCode === "ECONNREFUSED") {
            console.warn("Database connection unavailable during build - returning 0 user count")
            return 0
        }
        console.error("Error getting total user count:", error)
        return 0
    }
}

// Get OAuth settings
export async function getOAuthSettings(): Promise<{
    googleClientId: string
    googleClientSecret: string
    discordClientId: string
    discordClientSecret: string
}> {
    try {
        const settings = await getSettings([
            "google_client_id",
            "google_client_secret",
            "discord_client_id",
            "discord_client_secret",
        ])

        return {
            googleClientId: settings["google_client_id"] || "",
            googleClientSecret: settings["google_client_secret"] || "",
            discordClientId: settings["discord_client_id"] || "",
            discordClientSecret: settings["discord_client_secret"] || "",
        }
    } catch {
        return {
            googleClientId: "",
            googleClientSecret: "",
            discordClientId: "",
            discordClientSecret: "",
        }
    }
}

// Save OAuth settings
export async function saveOAuthSettings(data: {
    googleClientId: string
    googleClientSecret: string
    discordClientId: string
    discordClientSecret: string
}): Promise<{ success: boolean; error?: string }> {
    const adminCheck = await checkAdmin()
    if (!adminCheck.isAdmin) {
        return { success: false, error: adminCheck.error }
    }

    try {
        await setSettingOrThrow("google_client_id", data.googleClientId, "Google OAuth Client ID")
        await setSettingOrThrow("google_client_secret", data.googleClientSecret, "Google OAuth Client Secret")
        await setSettingOrThrow("discord_client_id", data.discordClientId, "Discord OAuth Client ID")
        await setSettingOrThrow("discord_client_secret", data.discordClientSecret, "Discord OAuth Client Secret")

        revalidatePath("/dashboard/admin/settings")
        revalidatePath("/login")
        return { success: true }
    } catch (error) {
        console.error("Error saving OAuth settings:", error)
        return { success: false, error: "Failed to save settings" }
    }
}

// Get Discord settings
export async function getDiscordSettings(): Promise<{
    webhookUrl: string
    notifyRegister: boolean
    notifyTopup: boolean
    notifyOrder: boolean
}> {
    try {
        const settings = await getSettings([
            "discord_webhook_url",
            "discord_notify_register",
            "discord_notify_topup",
            "discord_notify_order",
        ])

        return {
            webhookUrl: settings["discord_webhook_url"] || "",
            notifyRegister: settings["discord_notify_register"] === "true",
            notifyTopup: settings["discord_notify_topup"] === "true",
            notifyOrder: settings["discord_notify_order"] === "true",
        }
    } catch {
        return {
            webhookUrl: "",
            notifyRegister: false,
            notifyTopup: false,
            notifyOrder: false,
        }
    }
}

// Save Discord settings
export async function saveDiscordSettings(data: {
    webhookUrl: string
    notifyRegister: boolean
    notifyTopup: boolean
    notifyOrder: boolean
}): Promise<{ success: boolean; error?: string }> {
    const adminCheck = await checkAdmin()
    if (!adminCheck.isAdmin) {
        return { success: false, error: adminCheck.error }
    }

    try {
        const webhook = data.webhookUrl.trim()
        if (webhook) {
            try {
                const parsed = new URL(webhook)
                const isDiscordHost = parsed.hostname === "discord.com" || parsed.hostname === "discordapp.com"
                const isWebhookPath = /^\/api\/webhooks\/\d+\/[^/]+$/.test(parsed.pathname)
                if (parsed.protocol !== "https:" || !isDiscordHost || !isWebhookPath) {
                    return { success: false, error: "Discord Webhook URL เนเธกเนเธ–เธนเธเธ•เนเธญเธ" }
                }
            } catch {
                return { success: false, error: "Discord Webhook URL เนเธกเนเธ–เธนเธเธ•เนเธญเธ" }
            }
        }

        await setSettingOrThrow("discord_webhook_url", webhook, "Discord Webhook URL for notifications")
        await setSettingOrThrow("discord_notify_register", String(data.notifyRegister), "Notify on new user registration")
        await setSettingOrThrow("discord_notify_topup", String(data.notifyTopup), "Notify on balance top-up")
        await setSettingOrThrow("discord_notify_order", String(data.notifyOrder), "Notify on new service order")

        revalidatePath("/dashboard/admin/settings")
        return { success: true }
    } catch (error) {
        console.error("Error saving Discord settings:", error)
        return { success: false, error: "Failed to save settings" }
    }
}

// Test Discord Webhook
export async function testDiscordWebhook(webhookUrl?: string): Promise<{ success: boolean; error?: string }> {
    const adminCheck = await checkAdmin()
    if (!adminCheck.isAdmin) {
        return { success: false, error: adminCheck.error }
    }

    try {
        const { sendDiscordNotification } = await import("@/lib/discord-notify")
        const override = webhookUrl?.trim()
        await sendDiscordNotification("test", { user: "Admin" }, { webhookUrlOverride: override })
        return { success: true }
    } catch (error) {
        console.error("Error testing Discord webhook:", error)
        const message = error instanceof Error ? error.message : "Failed to send test notification"
        return { success: false, error: message }
    }
}

// Get Email settings
export async function getEmailSettings(): Promise<{
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPass: string
    smtpFrom: string
    smtpSenderName: string
    smtpSecure: boolean
}> {
    try {
        const settings = await getSettings([
            "smtp_host",
            "smtp_port",
            "smtp_user",
            "smtp_pass",
            "smtp_from",
            "smtp_sender_name",
            "smtp_secure",
        ])

        return {
            smtpHost: settings["smtp_host"] || "",
            smtpPort: parseInt(settings["smtp_port"] || "587"),
            smtpUser: settings["smtp_user"] || "",
            smtpPass: settings["smtp_pass"] || "",
            smtpFrom: settings["smtp_from"] || "noreply@ikuzen.studio",
            smtpSenderName: settings["smtp_sender_name"] || "Ikuzen Studio",
            smtpSecure: settings["smtp_secure"] === "true",
        }
    } catch {
        return {
            smtpHost: "",
            smtpPort: 587,
            smtpUser: "",
            smtpPass: "",
            smtpFrom: "noreply@ikuzen.studio",
            smtpSenderName: "Ikuzen Studio",
            smtpSecure: false,
        }
    }
}

// Save Email settings
export async function saveEmailSettings(data: {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPass: string
    smtpFrom: string
    smtpSenderName: string
    smtpSecure: boolean
}): Promise<{ success: boolean; error?: string }> {
    const adminCheck = await checkAdmin()
    if (!adminCheck.isAdmin) {
        return { success: false, error: adminCheck.error }
    }

    try {
        await setSettingOrThrow("smtp_host", data.smtpHost, "SMTP Host")
        await setSettingOrThrow("smtp_port", String(data.smtpPort), "SMTP Port")
        await setSettingOrThrow("smtp_user", data.smtpUser, "SMTP User")
        await setSettingOrThrow("smtp_pass", data.smtpPass, "SMTP Password")
        await setSettingOrThrow("smtp_from", data.smtpFrom, "Sender Email Address")
        await setSettingOrThrow("smtp_sender_name", data.smtpSenderName, "Sender Name (e.g. Ikuzen Studio)")
        await setSettingOrThrow("smtp_secure", String(data.smtpSecure), "Use Secure Connection (SSL/TLS)")

        revalidatePath("/dashboard/admin/settings")
        return { success: true }
    } catch (error) {
        console.error("Error saving Email settings:", error)
        return { success: false, error: "Failed to save settings" }
    }
}

// Test Email settings - send a test email to specified address
export async function testEmailSettings(toEmail: string): Promise<{ success: boolean; error?: string }> {
    const adminCheck = await checkAdmin()
    if (!adminCheck.isAdmin) {
        return { success: false, error: adminCheck.error }
    }

    if (!toEmail) {
        return { success: false, error: "เธเธฃเธธเธ“เธฒเธฃเธฐเธเธธเธญเธตเน€เธกเธฅเธชเธณเธซเธฃเธฑเธเธ—เธ”เธชเธญเธ" }
    }

    try {
        const emailSettings = await getEmailSettings()

        if (!emailSettings.smtpHost || !emailSettings.smtpUser || !emailSettings.smtpFrom) {
            return {
                success: false,
                error: "เธขเธฑเธเนเธกเนเนเธ”เนเธ•เธฑเนเธเธเนเธฒ SMTP เธเธฃเธเธ–เนเธงเธ เธเธฃเธธเธ“เธฒเธเธฑเธเธ—เธถเธเธเธฒเธฃเธ•เธฑเนเธเธเนเธฒเธญเธตเน€เธกเธฅเธเนเธญเธ",
            }
        }

        const html = `
            <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border-radius: 16px; border: 1px solid #e5e7eb;">
                <h2 style="margin: 0 0 12px; font-size: 20px; color: #111827;">เธญเธตเน€เธกเธฅเธ—เธ”เธชเธญเธเธเธฒเธเธฃเธฐเธเธ Ikuzen Studio</h2>
                <p style="margin: 0 0 8px; color: #374151;">เธซเธฒเธเธเธธเธ“เน€เธซเนเธเธญเธตเน€เธกเธฅเธเธเธฑเธเธเธตเน เนเธชเธ”เธเธงเนเธฒ SMTP เธ–เธนเธเธ•เธฑเนเธเธเนเธฒเธญเธขเนเธฒเธเธ–เธนเธเธ•เนเธญเธเนเธฅเนเธง โ…</p>
                <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px;">
                    เน€เธงเธฅเธฒเธ—เธตเนเธชเนเธ: ${new Date().toLocaleString("th-TH")}
                </p>
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                    เธซเธฒเธเธเธธเธ“เนเธกเนเนเธ”เนเน€เธเนเธเธเธนเนเธฃเนเธญเธเธเธญเธ—เธ”เธชเธญเธเธญเธตเน€เธกเธฅเธเธตเน เธญเธฒเธเน€เธเนเธเธเธฒเธฃเธ•เธฑเนเธเธเนเธฒเธเธฒเธเธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธเธเธญเธเธเธธเธ“
                </p>
            </div>
        `

        const result = await sendEmail(toEmail, "เธ—เธ”เธชเธญเธเธเธฒเธฃเธชเนเธเธญเธตเน€เธกเธฅเธเธฒเธเธฃเธฐเธเธ", html)

        if (!result.success) {
            return { success: false, error: result.error || "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเนเธเธญเธตเน€เธกเธฅเธ—เธ”เธชเธญเธเนเธ”เน" }
        }

        return { success: true }
    } catch (error) {
        console.error("Error testing Email settings:", error)
        return { success: false, error: "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเนเธเธญเธตเน€เธกเธฅเธ—เธ”เธชเธญเธเนเธ”เน" }
    }
}
