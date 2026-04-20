"use client"

import Image from "next/image"
import { useState } from "react"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Users,
    Server,
    ArrowRight,
    CreditCard,
    Settings,
    Shield,
    Database,
    Megaphone,
    Package2,
    LogOut,
    Menu
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/actions/logout"

interface User {
    name: string
    email: string
    role?: string
}

const adminSidebarItems = {
    management: [
        { icon: LayoutDashboard, label: "Overview", href: "/admin" },
        { icon: Users, label: "Users", href: "/admin/users" },
        { icon: Server, label: "Services", href: "/admin/services" },
        { icon: Database, label: "Packages", href: "/admin/packages" },
    ],
    system: [
        { icon: Megaphone, label: "News & Updates", href: "/admin/news" },
        { icon: Shield, label: "Hosting Config", href: "/admin/hosting/config" },
        { icon: CreditCard, label: "Finance", href: "/admin/finance" },
        { icon: Settings, label: "Settings", href: "/admin/settings" },
    ]
}

export function AdminSidebar({
    user,
    logoUrl,
    storeName,
    isMobile,
    onClose,
}: {
    user: User | null
    logoUrl?: string
    storeName?: string
    isMobile?: boolean
    onClose?: () => void
}) {
    const pathname = usePathname()
    const [imageError, setImageError] = useState(false)
    const brandName = storeName || "Ikuzen Studio"

    return (
        <div className={cn("flex h-full flex-col transition-colors", isMobile ? "bg-background" : "bg-neutral-50 dark:bg-[#09090b] border-r border-[#e5e5e5] dark:border-[#27272a]")}>
            {/* Branding */}
            <div className="px-6 py-5 flex items-center gap-3">
                <a href="/admin" onClick={onClose} className="flex items-center gap-3 group">
                    <div className="relative h-8 w-8 rounded-lg overflow-x-auto no-scrollbar bg-black/5 dark:bg-white/5 ring-1 ring-black/10 dark:ring-white/10 flex items-center justify-center transition-all group-hover:ring-primary/50 group-hover:shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                        {logoUrl && !imageError ? (
                            <Image
                                src={logoUrl}
                                alt={brandName}
                                width={32}
                                height={32}
                                className="h-8 w-8 object-contain"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <Package2 className="h-5 w-5 text-primary" />
                        )}
                    </div>
                    <span className="font-semibold text-sm tracking-tight text-neutral-900 hover:text-neutral-700 dark:text-white/90 dark:group-hover:text-white transition-colors">
                        {brandName}
                    </span>
                </a>
            </div>

            <div className="flex-1 flex flex-col gap-6 px-3 py-4 overflow-y-auto no-scrollbar">
                {/* Management Group */}
                <div className="space-y-0.5">
                    <p className="px-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-2">Management</p>
                    {adminSidebarItems.management.map((item) => (
                        <NavItem key={item.href} item={item} pathname={pathname} onClose={onClose} />
                    ))}
                </div>

                {/* System Group */}
                <div className="space-y-0.5">
                    <p className="px-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-2 mt-2">System</p>
                    {adminSidebarItems.system.map((item) => (
                        <NavItem key={item.href} item={item} pathname={pathname} onClose={onClose} />
                    ))}
                    <a
                        href="/dashboard"
                        onClick={onClose}
                        className="group relative mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-all duration-200"
                    >
                        <ArrowRight className="h-4 w-4 shrink-0 transition-colors text-muted-foreground group-hover:text-neutral-900 dark:group-hover:text-white/80" />
                        <span className="flex-1 truncate">Back to Clients</span>
                    </a>
                </div>
            </div>

            {/* Admin User Footer */}
            <div className="p-3 mt-auto border-t border-[#e5e5e5] dark:border-[#27272a] bg-neutral-50 dark:bg-[#09090b]">
                <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-rose-600 to-orange-600 flex items-center justify-center text-[10px] font-bold text-white ring-1 ring-black/10 dark:ring-white/10 group-hover:ring-primary/50 transition-all">
                        {user?.name?.[0]?.toUpperCase() || "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate text-neutral-900 group-hover:text-neutral-700 dark:text-white/90 dark:group-hover:text-white">{user?.name || "Admin User"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user?.email || "admin@example.com"}</p>
                    </div>
                </div>
                <form action={logout} className="w-full">
                    <Button type="submit" variant="ghost" className="w-full justify-start text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg h-9 text-xs font-medium transition-colors">
                        <LogOut className="h-3.5 w-3.5 mr-2 shrink-0" />
                        Sign Out
                    </Button>
                </form>
            </div>
        </div>
    )
}

function NavItem({ item, pathname, onClose }: { item: any; pathname: string; onClose?: () => void }) {
    const isActive = pathname === item.href || (pathname?.startsWith(item.href + "/") && item.href !== "/admin")
    const Icon = item.icon

    return (
        <a
            href={item.href}
            onClick={onClose}
            className={cn(
                "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                    ? "text-neutral-900 bg-black/5 dark:text-white dark:bg-white/5"
                    : "text-muted-foreground hover:text-neutral-900 hover:bg-black/[0.03] dark:hover:text-white dark:hover:bg-white/[0.03]"
            )}
        >
            <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-neutral-900 dark:group-hover:text-white/80")} />
            <span className="flex-1 truncate">{item.label}</span>
            {isActive && <div className="w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_currentColor]" />}
        </a>
    )
}
