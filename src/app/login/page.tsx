import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import LoginForm from "./login-form"
import { getOAuthSettings } from "@/app/actions/settings"
import { hasValidSession } from "@/lib/session"

export const metadata = {
    title: "เข้าสู่ระบบ | Ikuzen Studio",
    description: "เข้าสู่ระบบเพื่อจัดการบริการของคุณ",
}

export default async function LoginPage() {
    const cookieStore = await cookies()
    if (await hasValidSession(cookieStore)) {
        redirect("/dashboard")
    }

    const oauthSettings = await getOAuthSettings()

    return (
        <LoginForm
            googleClientId={oauthSettings.googleClientId}
            discordClientId={oauthSettings.discordClientId}
        />
    )
}
