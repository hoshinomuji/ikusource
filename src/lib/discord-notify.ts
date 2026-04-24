interface DiscordWebhookContent {
    content?: string
    embeds?: Array<Record<string, unknown>>
}

type DiscordNotificationType = "register" | "topup" | "order" | "directadmin" | "test"

const COLORS = {
    SUCCESS: 0x22c55e,
    INFO: 0x3b82f6,
    PURPLE: 0xa855f7,
}

/**
 * Sanitize user-controlled text before inserting into Discord embed fields.
 * Prevents @everyone/@here mention injection and newline-based embed abuse.
 */
function sanitizeDiscordText(value: string | null | undefined): string {
    if (!value) return "-"
    return value
        .replace(/@everyone/gi, "@ everyone")
        .replace(/@here/gi, "@ here")
        .replace(/[\n\r]/g, " ")
        .slice(0, 1024)
}

function isValidDiscordWebhookUrl(value: string): boolean {
    try {
        const url = new URL(value)
        if (url.protocol !== "https:") return false
        const isDiscordHost = url.hostname === "discord.com" || url.hostname === "discordapp.com"
        if (!isDiscordHost) return false
        return /^\/api\/webhooks\/\d+\/[^/]+$/.test(url.pathname)
    } catch {
        return false
    }
}

function normalizeDiscordError(status: number, body: string): string {
    const compact = body.replace(/\s+/g, " ").trim().slice(0, 300)
    return compact ? `Discord webhook failed (${status}): ${compact}` : `Discord webhook failed (${status})`
}

async function sendWebhook(url: string, payload: DiscordWebhookContent): Promise<void> {
    if (!isValidDiscordWebhookUrl(url)) {
        throw new Error("Invalid Discord webhook URL")
    }

    const maxAttempts = 3
    let lastError: Error = new Error("Failed to send Discord webhook")

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
                cache: "no-store",
            })

            clearTimeout(timeoutId)

            if (response.ok) {
                return
            }

            if (response.status === 429 && attempt < maxAttempts) {
                let retryAfterMs = 1200
                try {
                    const data = await response.json()
                    if (typeof data?.retry_after === "number") {
                        const retryMs = Math.ceil(data.retry_after * 1000)
                        retryAfterMs = Number.isFinite(retryMs) ? Math.max(1, retryMs) : 1200
                    }
                } catch {
                    // ignore malformed response body
                }

                await new Promise((resolve) => setTimeout(resolve, retryAfterMs))
                continue
            }

            const errorText = await response.text().catch(() => "")
            lastError = new Error(normalizeDiscordError(response.status, errorText))
            throw lastError
        } catch (error) {
            clearTimeout(timeoutId)

            if (error instanceof Error) {
                if (error.name === "AbortError") {
                    lastError = new Error("Discord webhook request timed out")
                } else {
                    lastError = error
                }
            } else {
                lastError = new Error("Unknown Discord webhook error")
            }

            if (attempt < maxAttempts) {
                const backoffMs = 500 * attempt
                await new Promise((resolve) => setTimeout(resolve, backoffMs))
                continue
            }
        }
    }

    throw lastError
}

export async function sendDiscordNotification(
    type: DiscordNotificationType,
    data: any,
    options?: { webhookUrlOverride?: string }
): Promise<void> {
    try {
        const { getSetting } = await import("@/app/actions/settings")

        const webhookUrl = options?.webhookUrlOverride?.trim() || await getSetting("discord_webhook_url")
        if (!webhookUrl) {
            throw new Error("Discord webhook URL is not configured")
        }

        const enabled = await getSetting(`discord_notify_${type}`)
        if (type !== "test" && enabled !== "true") {
            return
        }

        const storeName = await getSetting("website_store_name") || "Ikuzen Studio"
        const domain = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://ikuzen.studio"

        const embed: Record<string, unknown> = {
            author: {
                name: storeName,
                url: domain,
                icon_url: "https://cdn.simpleicons.org/discord/white",
            },
            footer: {
                text: `${storeName} System Notification`,
            },
            timestamp: new Date().toISOString(),
        }

        switch (type) {
            case "register":
                embed.title = "New User Registration"
                embed.color = COLORS.INFO
                embed.fields = [
                    { name: "Name", value: sanitizeDiscordText(data.name), inline: true },
                    { name: "Email", value: sanitizeDiscordText(data.email), inline: true },
                    { name: "User ID", value: data.id ? `#${data.id}` : "-", inline: true },
                ]
                break

            case "topup":
                embed.title = "New Top-up"
                embed.color = COLORS.SUCCESS
                embed.fields = [
                    { name: "User", value: sanitizeDiscordText(`${data.userName || "Unknown"} (#${data.userId || "-"})`), inline: true },
                    { name: "Amount", value: sanitizeDiscordText(`${data.amount || 0}`), inline: true },
                    { name: "Method", value: sanitizeDiscordText(data.method), inline: true },
                    { name: "Reference", value: sanitizeDiscordText(data.reference), inline: false },
                ]
                break

            case "order":
                embed.title = "New Order"
                embed.color = COLORS.SUCCESS
                embed.fields = [
                    { name: "User", value: sanitizeDiscordText(`${data.userName || "Unknown"} (#${data.userId || "-"})`), inline: true },
                    { name: "Service", value: sanitizeDiscordText(data.packageName), inline: true },
                    { name: "Price", value: sanitizeDiscordText(`${data.price || 0}`), inline: true },
                    { name: "Domain", value: sanitizeDiscordText(data.domain), inline: false },
                ]
                break

            case "test":
                embed.title = "Webhook Test"
                embed.description = "Discord webhook is working normally."
                embed.color = COLORS.PURPLE
                embed.fields = [
                    { name: "Status", value: "Active", inline: true },
                    { name: "Latency", value: "<1000ms", inline: true },
                    { name: "User", value: sanitizeDiscordText(data.user) || "Admin", inline: true },
                ]
                break
            case "directadmin":
                embed.title = "DirectAdmin Event"
                embed.color = data.status === "failed" ? COLORS.PURPLE : COLORS.INFO
                embed.fields = [
                    { name: "Action", value: sanitizeDiscordText(data.action), inline: true },
                    { name: "Status", value: sanitizeDiscordText(data.status), inline: true },
                    { name: "Order ID", value: data.orderId ? `#${data.orderId}` : "-", inline: true },
                    { name: "Message", value: sanitizeDiscordText(data.message), inline: false },
                ]
                break
        }

        await sendWebhook(webhookUrl, { embeds: [embed] })
    } catch (error) {
        console.error("Failed to send Discord notification:", error)
    }
}
