import { getSessionUserIdValue } from "@/lib/session"
/**
 * API Route for redeeming TrueMoney vouchers
 * Uses TrueMoney API directly to bypass blocking
 * Based on PHP code that uses User-Agent "Park"
 */

import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/db"
import { users, wallets, pointTransactions } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getPaymentSettings } from "@/app/actions/settings"
import { rateLimit } from "@/lib/rate-limit"
import { isTrustedSameOriginRequest } from "@/lib/request-security"

const limiter = rateLimit({
    interval: 60 * 60 * 1000, // 1 hour
    limit: 30, // 30 attempts per hour
})

/**
 * Extract voucher hash from TrueMoney link
 */
function extractVoucherHash(link: string): string | null {
    const regex = /gift\.truemoney\.com\/campaign\/\?v=([A-Za-z0-9]+)/
    const match = link.match(regex)
    return match ? match[1] : null
}

export async function POST(request: NextRequest) {
    try {
        if (!isTrustedSameOriginRequest(request)) {
            return NextResponse.json(
                { status: "fail", message: "Invalid request origin" },
                { status: 403 }
            )
        }

        // Check authentication using Next.js cookies
        const cookieStore = await cookies()
        const userId = await getSessionUserIdValue(cookieStore)

        if (!userId) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "เน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธเธเนเธญเธเธ”เธณเน€เธเธดเธเธเธฒเธฃเธเธฃเธฑเธ",
                },
                { status: 400 }
            )
        }

        const userIdNum = parseInt(userId)

        try {
            await limiter.check(userId)
        } catch {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "เธ—เธณเธฃเธฒเธขเธเธฒเธฃเธ–เธตเนเน€เธเธดเธเนเธ เธเธฃเธธเธ“เธฒเธฃเธญเธชเธฑเธเธเธฃเธนเน",
                },
                { status: 429 }
            )
        }

        // Get request body

        // Get request body
        const body = await request.json()
        const link = body.link

        if (!link || link === "") {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธฅเธดเธเธเนเธเธญเธเธญเธฑเนเธเน€เธเธฒ",
                },
                { status: 400 }
            )
        }

        // Extract voucher hash
        const voucherHash = extractVoucherHash(link)
        if (!voucherHash) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "เธฅเธดเนเธเธญเธฑเนเธเน€เธเธฒเนเธกเนเธ–เธนเธเธ•เนเธญเธ",
                },
                { status: 400 }
            )
        }

        // Get phone number from admin settings
        const paymentSettings = await getPaymentSettings()

        // Check if TrueMoney is enabled
        if (!paymentSettings.truemoneyEnabled) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "เธฃเธฐเธเธเน€เธ•เธดเธกเน€เธเธดเธ TrueMoney เธ–เธนเธเธเธดเธ”เนเธเนเธเธฒเธ เธเธฃเธธเธ“เธฒเธ•เธดเธ”เธ•เนเธญเธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ",
                },
                { status: 400 }
            )
        }

        const phone = paymentSettings.truemoneyDefaultPhone

        if (!phone) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "เธขเธฑเธเนเธกเนเนเธ”เนเธ•เธฑเนเธเธเนเธฒเน€เธเธญเธฃเนเธฃเธฑเธเธเธญเธ เธเธฃเธธเธ“เธฒเนเธซเน Admin เธ•เธฑเนเธเธเนเธฒเน€เธเธญเธฃเนเนเธ—เธฃเธจเธฑเธเธ—เนเนเธเธซเธเนเธฒ Admin Settings",
                },
                { status: 400 }
            )
        }

        // Call TrueMoney API directly (like PHP code)
        const truemoneyUrl = `https://gift.truemoney.com/campaign/vouchers/${voucherHash}/redeem`

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000)

        let response
        try {
            response = await fetch(truemoneyUrl, {
                method: "POST",
                headers: {
                    "accept": "application/json",
                    "content-type": "application/json",
                    "User-Agent": "Park", // Use "Park" User-Agent to bypass blocking
                },
                body: JSON.stringify({
                    mobile: phone,
                    voucher_hash: voucherHash,
                }),
                signal: controller.signal,
            })
            clearTimeout(timeoutId)
        } catch (error: any) {
            clearTimeout(timeoutId)
            if (error.name === "AbortError") {
                return NextResponse.json(
                    {
                        status: "fail",
                        message: "เธเธฒเธฃเน€เธเธทเนเธญเธกเธ•เนเธญเธซเธกเธ”เน€เธงเธฅเธฒ เธเธฃเธธเธ“เธฒเธฅเธญเธเธญเธตเธเธเธฃเธฑเนเธ",
                    },
                    { status: 400 }
                )
            }
            throw error
        }

        // Check response status first
        if (!response.ok) {
            let errorMessage = `TrueMoney API Error (Status: ${response.status})`
            try {
                const errorText = await response.text()
                console.error("TrueMoney API Error Response:", errorText.substring(0, 500))

                // Try to parse as JSON
                try {
                    const errorJson = JSON.parse(errorText)
                    if (errorJson.status?.message) {
                        errorMessage = errorJson.status.message
                    } else if (errorJson.message) {
                        errorMessage = errorJson.message
                    }
                } catch {
                    // If not JSON, check if it's HTML (Cloudflare challenge)
                    if (errorText.includes("cloudflare") || errorText.includes("challenge") || errorText.trim().startsWith("<!DOCTYPE")) {
                        errorMessage = "TrueMoney API เธ–เธนเธเธเธฅเนเธญเธเนเธ”เธขเธฃเธฐเธเธเธเธงเธฒเธกเธเธฅเธญเธ”เธ เธฑเธข เธเธฃเธธเธ“เธฒเธฅเธญเธเธญเธตเธเธเธฃเธฑเนเธเนเธเธ เธฒเธขเธซเธฅเธฑเธ"
                    }
                }
            } catch {
                // Ignore parsing errors
            }

            return NextResponse.json(
                {
                    status: "fail",
                    message: errorMessage,
                },
                { status: 400 }
            )
        }

        // Parse response
        let result
        try {
            const responseText = await response.text()

            if (!responseText || responseText.trim() === "") {
                return NextResponse.json(
                    {
                        status: "fail",
                        message: "TrueMoney API เธ•เธญเธเธเธฅเธฑเธเน€เธเนเธเธเนเธญเธกเธนเธฅเธงเนเธฒเธ",
                    },
                    { status: 400 }
                )
            }

            result = JSON.parse(responseText)
        } catch (error) {
            console.error("Error parsing TrueMoney API response:", error)
            return NextResponse.json(
                {
                    status: "fail",
                    message: "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธญเนเธฒเธเธเนเธญเธกเธนเธฅเธเธฒเธ TrueMoney API เนเธ”เน เธเธฃเธธเธ“เธฒเธ•เธฃเธงเธเธชเธญเธเธฅเธดเธเธเนเธเธญเธเธญเธฑเนเธเน€เธเธฒ",
                },
                { status: 400 }
            )
        }

        // Check if response has status code
        if (!result || !result.status || !result.status.code) {
            console.error("Invalid TrueMoney API response structure:", result)
            return NextResponse.json(
                {
                    status: "fail",
                    message: "เธฅเธดเนเธเธญเธฑเนเธเน€เธเธฒเนเธกเนเธ–เธนเธเธ•เนเธญเธ เธซเธฃเธทเธญ TrueMoney API เธ•เธญเธเธเธฅเธฑเธเนเธกเนเธ–เธนเธเธ•เนเธญเธ",
                },
                { status: 400 }
            )
        }

        const codeStatus = result.status.code
        const member = result.data?.voucher?.member || 0

        // Check member count (must be < 2, meaning only 1 person can redeem)
        if (member >= 2) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "เธ•เธฑเนเธเธเธญเธเธญเธฑเนเธเน€เธเธฒเน€เธเนเธเธซเธเธถเนเธเธเธเน€เธ—เนเธฒเธเธฑเนเธ",
                },
                { status: 400 }
            )
        }

        // Handle different error codes
        if (codeStatus === "VOUCHER_OUT_OF_STOCK") {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "เธญเธฑเนเธเน€เธเธฒเธเธตเนเธ–เธนเธเนเธเนเธเธฒเธเนเธเนเธฅเนเธง",
                },
                { status: 400 }
            )
        }

        if (codeStatus === "VOUCHER_NOT_FOUND") {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "เนเธกเนเธเธเธญเธฑเนเธเน€เธเธฒเธเธตเน!!",
                },
                { status: 400 }
            )
        }

        if (codeStatus === "VOUCHER_EXPIRED") {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "เธญเธฑเนเธเน€เธเธฒเธซเธกเธ”เธญเธฒเธขเธธ!!",
                },
                { status: 400 }
            )
        }

        // Success case
        if (codeStatus === "SUCCESS") {
            const balance = result.data.voucher
            const amountStr = balance.redeemed_amount_baht || balance.amount_baht || "0"
            const amount = parseFloat(amountStr.replace(/,/g, "")) || 0

            if (amount <= 0) {
                return NextResponse.json(
                    {
                        status: "fail",
                        message: "เนเธกเนเธเธเธเธณเธเธงเธเน€เธเธดเธเนเธเธเธญเธเธญเธฑเนเธเน€เธเธฒ",
                    },
                    { status: 400 }
                )
            }

            // Calculate fee (2.3% but max 10 baht) - Check if fee is enabled in settings
            // For now, we'll skip fee calculation as it's not in the settings
            // You can add fee setting later if needed
            let finalAmount = amount
            // const feeEnabled = await getSetting("truemoney_fee_enabled")
            // if (feeEnabled === "true") {
            //     const fee = Math.min(0.023 * amount, 10)
            //     finalAmount = amount - fee
            // }

            // Get user
            const userResult = await db
                .select()
                .from(users)
                .where(eq(users.id, userIdNum))
                .limit(1)

            if (!userResult || userResult.length === 0) {
                return NextResponse.json(
                    {
                        status: "fail",
                        message: "เนเธกเนเธเธเธเธนเนเนเธเน",
                    },
                    { status: 400 }
                )
            }

            const user = userResult[0]

            // Get or create wallet
            let wallet = await db
                .select()
                .from(wallets)
                .where(eq(wallets.userId, userIdNum))
                .limit(1)

            if (!wallet || wallet.length === 0) {
                const [newWallet] = await db
                    .insert(wallets)
                    .values({
                        userId: userIdNum,
                        balance: "0",
                    })
                    .returning()
                wallet = [newWallet]
            }

            const currentBalance = parseFloat(wallet[0].balance)
            const newBalance = currentBalance + finalAmount

            // Database Transaction
            try {
                await db.transaction(async (tx) => {
                    // Update wallet balance
                    await tx
                        .update(wallets)
                        .set({
                            balance: newBalance.toFixed(2),
                            updatedAt: new Date(),
                        })
                        .where(eq(wallets.id, wallet[0].id))

                    // Create transaction record
                    await tx.insert(pointTransactions).values({
                        userId: userIdNum,
                        walletId: wallet[0].id,
                        amount: finalAmount.toFixed(2),
                        type: "bonus",
                        description: `เน€เธ•เธดเธกเน€เธเธดเธเธ”เนเธงเธข TrueMoney เธเธญเธเธเธญเธเธเธงเธฑเธ (${link})`,
                        referenceId: `truemoney-${voucherHash}`,
                    })
                })
            } catch (err) {
                throw new Error("Transaction failed")
            }

            // Send Discord notification
            try {
                const { sendDiscordNotification } = await import("@/lib/discord-notify")
                await sendDiscordNotification("topup", {
                    userName: user.name,
                    userId: userIdNum,
                    amount: finalAmount.toFixed(2),
                    method: "TrueMoney Gift",
                    reference: link
                })
            } catch (error) {
                console.error("Failed to send Discord notification:", error)
            }

            console.log(`[Topup][TrueMoney] user=${userIdNum} amount=${finalAmount.toFixed(2)} voucher=${voucherHash}`)

            return NextResponse.json(
                {
                    status: "success",
                    message: `เธเธธเธ“เนเธ”เนเธฃเธฑเธเน€เธเธดเธเธเธณเธเธงเธ ${finalAmount.toFixed(2)} เธเนเธญเธขเธ—เน`,
                },
                { status: 200 }
            )
        }

        // Unknown error
        return NextResponse.json(
            {
                status: "fail",
                message: "เนเธกเนเธ—เธฃเธฒเธเธชเธฒเน€เธซเธ•เธธ!!",
            },
            { status: 400 }
        )
    } catch (error) {
        console.error("Error in TrueMoney redeem API:", error)
        return NextResponse.json(
            {
                status: "fail",
                message: error instanceof Error ? error.message : "เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”",
            },
            { status: 500 }
        )
    }
}

