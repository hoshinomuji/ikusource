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
            
            // Use constant-time comparison to prevent timing attacks
            const hasBearer = token && crypto.subtle && await constantTimeCompare(token, expectedSecret)

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

async function constantTimeCompare(a: string, b: string): Promise<boolean> {
    const aBuffer = new TextEncoder().encode(a)
    const bBuffer = new TextEncoder().encode(b)
    
    if (aBuffer.length !== bBuffer.length) {
        return false
    }
    
    let result = 0
    for (let i = 0; i < aBuffer.length; i++) {
        result |= aBuffer[i] ^ bBuffer[i]
    }
    
    return result === 0
}
