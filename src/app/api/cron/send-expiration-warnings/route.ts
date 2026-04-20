import { NextRequest, NextResponse } from "next/server"
import { verifyAndSendExpirationWarnings } from "@/app/actions/cron"
import { getCronSettings } from "@/app/actions/settings"
import { verifySignedRequest } from "@/lib/request-signature"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const cronSettings = await getCronSettings()

        const expectedSecret = cronSettings.cronSecret || process.env.CRON_SECRET || null

        if (expectedSecret) {
            const authHeader = request.headers.get("authorization")
            const token = authHeader?.replace("Bearer ", "").trim()
            const hasBearer = Boolean(token && token === expectedSecret)

            if (!hasBearer) {
                const verified = await verifySignedRequest(request, expectedSecret)
                if (!verified.ok) {
                    return NextResponse.json({ error: "Unauthorized", reason: verified.reason }, { status: 401 })
                }
            }
        }

        const result = await verifyAndSendExpirationWarnings()

        return NextResponse.json(result)
    } catch (error) {
        console.error("Cron job error:", error)
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
