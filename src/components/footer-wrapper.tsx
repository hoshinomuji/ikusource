import { Footer } from "./footer"
import { getWebsiteSettings, getTotalUserCount } from "@/app/actions/settings"

export async function FooterWrapper() {
    const settings = await getWebsiteSettings()
    const userCount = await getTotalUserCount()
    
    return <Footer logoUrl={settings.logoUrl} storeName={settings.storeName} userCount={userCount} />
}

