// Node.js-only instrumentation. Keep all Node dependencies here.
// Next.js will call `register()` from `src/instrumentation.ts`.

// Flag to prevent multiple intervals
let isSchedulerRunning = false

// Direct database access for instrumentation (no cookies/session needed)
async function getSettingDirect(key: string): Promise<string | null> {
    try {
        // Dynamic imports to prevent Edge Runtime errors
        const { db } = await import("@/db")
        const { systemSettings } = await import("@/db/schema")
        const { eq } = await import("drizzle-orm")

        const result = await db
            .select({ value: systemSettings.value })
            .from(systemSettings)
            .where(eq(systemSettings.key, key))
            .limit(1)

        return result.length > 0 ? result[0].value : null
    } catch (error) {
        console.error(`[Scheduler] Error getting setting ${key}:`, error)
        return null
    }
}

async function runSuspensionCheck() {
    try {
        // Check if auto suspend is enabled
        const enabled = await getSettingDirect("auto_suspend_enabled")
        if (enabled !== "true") {
            console.log("[Scheduler] Auto suspension is disabled, skipping...")
            return
        }

        // Get grace days
        const graceDaysStr = await getSettingDirect("suspend_grace_days")
        const graceDays = parseInt(graceDaysStr || "0")

        console.log(`[Scheduler] Running suspension check with ${graceDays} grace days...`)

        // Dynamic import to avoid edge runtime issues
        const { suspendExpiredHostingAccounts } = await import("@/app/actions/suspension")
        const result = await suspendExpiredHostingAccounts(graceDays, true)

        if (result.totalSuspended > 0 || result.totalFailed > 0) {
            console.log(
                `[Scheduler] Suspension check completed: ${result.totalSuspended} suspended, ${result.totalFailed} failed`
            )
        } else {
            console.log("[Scheduler] Suspension check completed: No services to suspend")
        }
    } catch (error) {
        console.error("[Scheduler] Error running suspension check:", error)
    }
}

export async function register() {
    if (isSchedulerRunning) {
        console.log("[Scheduler] Already running, skipping initialization")
        return
    }

    isSchedulerRunning = true
    console.log("[Scheduler] Starting internal cron scheduler...")

    // Get check interval from settings (default: 60 seconds = 1 minute)
    let intervalMs = 60 * 1000 // 1 minute default

    try {
        const intervalSetting = await getSettingDirect("suspension_check_interval_minutes")
        if (intervalSetting) {
            intervalMs = parseInt(intervalSetting) * 60 * 1000
        }
    } catch {
        // Use default
    }

    console.log(`[Scheduler] Check interval: ${intervalMs / 1000 / 60} minutes`)

    // Run immediately on startup
    setTimeout(() => {
        void runSuspensionCheck()
    }, 5000) // Wait 5 seconds after startup

    // Then run at regular intervals
    setInterval(() => {
        void runSuspensionCheck()
    }, intervalMs)

    console.log("[Scheduler] Internal cron scheduler started successfully")
}
