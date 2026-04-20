"use client"

import { useState } from "react"
import { AdminSidebar } from "./admin-sidebar"
import { AdminHeader } from "./admin-header"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface User {
    id: number
    name: string
    email: string
    role: string
}

export function AdminShell({
    user,
    logoUrl,
    storeName,
    children,
}: {
    user: User
    logoUrl?: string
    storeName?: string
    children: React.ReactNode
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <div className="flex min-h-screen w-full overflow-x-hidden bg-[#000000] text-foreground font-sans antialiased selection:bg-primary/20">
            {/* Desktop Sidebar - Fixed Width 240px */}
            <aside className="fixed inset-y-0 left-0 z-[70] hidden w-[240px] flex-col sm:flex">
                <AdminSidebar user={user} logoUrl={logoUrl} storeName={storeName} />
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col min-w-0 sm:pl-[240px]">
                <header className="sticky top-0 z-[60] flex h-14 items-center gap-2 border-b border-[#27272a] bg-[#09090b]/80 backdrop-blur-md px-4 sm:px-6 supports-[backdrop-filter]:bg-[#09090b]/60">
                    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button size="icon" variant="ghost" className="sm:hidden -ml-2 text-muted-foreground hover:text-foreground" aria-label="Toggle menu">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-[260px] border-r border-[#27272a] bg-[#09090b]">
                            <AdminSidebar user={user} logoUrl={logoUrl} storeName={storeName} isMobile onClose={() => setIsMobileMenuOpen(false)} />
                        </SheetContent>
                    </Sheet>

                    <div className="flex flex-1 items-center justify-end gap-2 text-white">
                        <AdminHeader user={user} onMenuClick={() => setIsMobileMenuOpen(true)} />
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
                    {children}
                </main>
            </div>
        </div>
    )
}
