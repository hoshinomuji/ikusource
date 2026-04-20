import { getWebsiteSettings } from "@/app/actions/settings"
import Image from "next/image"
import { Server } from "lucide-react"

export async function WebsiteBrand() {
    const settings = await getWebsiteSettings()
    
    return {
        logoUrl: settings.logoUrl,
        storeName: settings.storeName,
        websiteTitle: settings.websiteTitle,
    }
}

export function BrandLogo({ logoUrl, storeName }: { logoUrl: string, storeName: string }) {
    if (logoUrl && logoUrl.trim()) {
        return (
            <Image
                src={logoUrl}
                alt={storeName}
                width={32}
                height={32}
                className="h-7 w-7 md:h-8 md:w-8 object-contain"
                onError={(e) => {
                    // Fallback to icon if image fails
                    e.currentTarget.style.display = 'none'
                }}
            />
        )
    }
    
    return (
        <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-cyan-400 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            <Server className="h-7 w-7 md:h-8 md:w-8 text-sky-600 group-hover:text-sky-700 transition-colors relative z-10" />
        </div>
    )
}

export function BrandName({ storeName }: { storeName: string }) {
    return (
        <span className="text-lg md:text-xl font-bold text-foreground">
            {storeName}
        </span>
    )
}

