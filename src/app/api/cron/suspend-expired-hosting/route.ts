/**
 * API Route for suspending expired hosting accounts
 * This endpoint should be called by a cron job (e.g., Vercel Cron, external cron service)
 * 
 * Usage:
 * - Vercel Cron: Add to vercel.json
 * - External Cron: Call this endpoint periodically (e.g., daily at midnight)
 * 
 * Security: Add authentication token check if needed
 */

import { NextRequest, NextResponse } from "next/server"
import { suspendExpiredHostingAccounts } from "@/app/actions/suspension"
import { getCronSettings } from "@/app/actions/settings"
import { verifySignedRequest } from "@/lib/request-signature"

function formatThaiTime(date: Date): string {
    return new Intl.DateTimeFormat("th-TH", {
        timeZone: "Asia/Bangkok",
        dateStyle: "short",
        timeStyle: "medium",
        hour12: false,
    }).format(date)
}

export async function GET(request: NextRequest) {
    try {
        const cronSettings = await getCronSettings()
        const now = new Date()
        console.log(
            `[Cron][Suspend][Heartbeat] status=${cronSettings.autoSuspendEnabled ? "active" : "inactive"} graceDays=${cronSettings.suspendGraceDays} at_th=${formatThaiTime(now)} at_utc=${now.toISOString()}`
        )
        const expectedSecret = cronSettings.cronSecret || process.env.CRON_SECRET || null

        if (expectedSecret) {
            const authHeader = request.headers.get("authorization")
            const token = authHeader?.replace("Bearer ", "").trim()
            const hasBearer = Boolean(token && token === expectedSecret)

            if (!hasBearer) {
                const verified = await verifySignedRequest(request, expectedSecret)
                if (!verified.ok) {
                    return NextResponse.json(
                        { success: false, error: "Unauthorized", reason: verified.reason },
                        { status: 401 }
                    )
                }
            }
        }

        if (!cronSettings.autoSuspendEnabled) {
            console.log("[Cron][Suspend] skipped=true reason=disabled")
            return NextResponse.json({
                success: true,
                skipped: true,
                message: "Auto suspension is disabled in settings",
                timestamp: new Date().toISOString(),
            })
        }
        const result = await suspendExpiredHostingAccounts(
            cronSettings.suspendGraceDays,
            true
        )

        if (!result.success) {
            console.log(`[Cron][Suspend] success=false error="${result.message || "unknown"}"`)
            return NextResponse.json(
                {
                    success: false,
                    error: result.message || "Suspension check failed",
                    timestamp: new Date().toISOString(),
                },
                { status: 500 }
            )
        }

        console.log(`[Cron][Suspend] success=true checked=${result.totalChecked} suspended=${result.totalSuspended} failed=${result.totalFailed}`)
        return NextResponse.json({
            success: true,
            message: result.message,
            suspendedCount: result.totalSuspended,
            failedCount: result.totalFailed,
            totalExpired: result.totalChecked,
            results: result.results || [],
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error("[Cron] Unexpected error:", error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Internal server error",
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        )
    }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
    return GET(request)
}

