"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { getWebsiteSettings } from "@/app/actions/settings"

// Dynamically import Navbar with SSR disabled to prevent hydration mismatch
const Navbar = dynamic(() => import("./navbar").then(mod => ({ default: mod.Navbar })), {
    ssr: false,
    loading: () => (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">
                    <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />
                    <div className="hidden lg:flex items-center gap-6">
                        <div className="h-6 w-16 bg-gray-200 animate-pulse rounded" />
                        <div className="h-6 w-16 bg-gray-200 animate-pulse rounded" />
                        <div className="h-6 w-20 bg-gray-200 animate-pulse rounded" />
                    </div>
                </div>
            </div>
        </nav>
    ),
})

export function NavbarWrapper() {
    const [settings, setSettings] = useState<{ logoUrl: string; storeName: string }>({ logoUrl: "", storeName: process.env.NEXT_PUBLIC_STORE_NAME || "Ikuzen Studio" })

    useEffect(() => {
        getWebsiteSettings().then(setSettings)
    }, [])

    return <Navbar logoUrl={settings.logoUrl} storeName={settings.storeName} />
}

