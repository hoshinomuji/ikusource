"use server"

export async function getDiscordWidgetData(serverId: string) {
    try {
        const res = await fetch(`https://discord.com/api/guilds/${serverId}/widget.json`, {
            next: { revalidate: 60 }, // Cache for 60 seconds
        })

        if (!res.ok) {
            throw new Error(`Failed to fetch Discord data: ${res.statusText}`)
        }

        const data = await res.json()
        return { success: true, data }
    } catch (error) {
        console.error("Discord widget fetch error:", error)
        return { success: false, error: "Failed to fetch data" }
    }
}
