"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Bell, LayoutDashboard, Server, Wallet, ListChecks, User, Shield, Menu, LogOut, Settings2, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { logout } from "@/app/actions/logout"
import { DashboardSearch } from "@/components/dashboard/dashboard-search"

type ShellUser = {
    name: string
    email: string
    role: string
}

type ShellNotification = {
    id: string
    title: string
    message: string
    time: string
    link?: string | null
    isRead?: boolean
    type?: string
}

// Separate component for logout button to avoid passing server actions directly if problematic
function LogoutButton({ mobile = false }: { mobile?: boolean }) {
    return (
        <form action={logout} className="w-full">
            <Button type="submit" variant="ghost" className={cn("w-full justify-start text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg h-9 text-xs font-medium transition-colors", mobile ? "px-2" : "")}>
                <LogOut className="h-3.5 w-3.5 mr-2 shrink-0" />
                Sign Out
            </Button>
        </form>
    )
}

function ShellNav({
    storeName,
    logoUrl,
    user,
    notifications,
    onNavigate,
    mobile = false,
}: {
    storeName: string
    logoUrl?: string
    user: ShellUser
    notifications: ShellNotification[]
    onNavigate?: () => void
    mobile?: boolean
}) {
    const pathname = usePathname()

    const items = useMemo(() => {
        const base = [
            { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
            { href: "/dashboard/services", label: "Services", icon: Server },
            { href: "/dashboard/hosting", label: "Hosting", icon: ListChecks },
            { href: "/dashboard/wallet", label: "Topup", icon: Wallet },
        ]

        const settings = [
            { href: "/dashboard/profile", label: "Account", icon: User },
            { href: "/dashboard/security", label: "Security", icon: Shield },
        ]

        if (user.role === "admin") {
            settings.push({ href: "/admin", label: "Admin", icon: Settings2 })
        }

        return { main: base, settings }
    }, [user.role])

    // Mount check to prevent hydration mismatch for things dependent on browser state
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    if (!mounted) return null

    return (
        <div className={cn("flex h-full flex-col transition-colors", mobile ? "bg-background" : "bg-neutral-50 dark:bg-[#09090b] border-r border-[#e5e5e5] dark:border-[#27272a]")}>
            {/* Branding */}
            <div className="px-6 py-5 flex items-center gap-3">
                <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-3 group">
                    <div className="relative h-8 w-8 rounded-lg overflow-x-auto no-scrollbar bg-black/5 dark:bg-white/5 ring-1 ring-black/10 dark:ring-white/10 flex items-center justify-center transition-all group-hover:ring-primary/50 group-hover:shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                        {logoUrl ? (
                            <Image src={logoUrl} alt={storeName} fill className="object-cover" />
                        ) : (
                            <span className="text-sm font-bold text-neutral-900 dark:text-foreground">{storeName?.[0]?.toUpperCase() || "S"}</span>
                        )}
                    </div>
                    <span className="font-semibold text-sm tracking-tight text-neutral-900 hover:text-neutral-700 dark:text-white/90 dark:group-hover:text-white transition-colors">
                        {storeName || "Cloud Panel"}
                    </span>
                </Link>
            </div>

            <div className="flex-1 flex flex-col gap-6 px-3 py-4 overflow-y-auto no-scrollbar">
                {/* Main Menu */}
                <div className="space-y-0.5">
                    <p className="px-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-2">Platform</p>
                    {items.main.map((it) => <NavItem key={it.href} item={it} pathname={pathname} onClick={onNavigate} />)}
                </div>

                {/* Settings Menu */}
                <div className="space-y-0.5">
                    <p className="px-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-2 mt-4">Settings</p>
                    {items.settings.map((it) => <NavItem key={it.href} item={it} pathname={pathname} onClick={onNavigate} />)}
                </div>
            </div>

            {/* User Profile Footer */}
            <div className="p-3 mt-auto border-t border-[#e5e5e5] dark:border-[#27272a] bg-neutral-50 dark:bg-[#09090b] transition-colors">
                <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-neutral-300 to-neutral-400 dark:from-zinc-700 dark:to-zinc-600 flex items-center justify-center text-[10px] font-bold text-neutral-900 dark:text-white ring-1 ring-black/10 dark:ring-white/10 group-hover:ring-primary/50 transition-all">
                        {user.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate text-neutral-800 group-hover:text-neutral-900 dark:text-foreground/90 dark:group-hover:text-foreground">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                </div>
                <LogoutButton mobile={mobile} />
            </div>
        </div>
    )
}

function NavItem({ item, pathname, onClick }: { item: any; pathname: string; onClick?: () => void }) {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
    const Icon = item.icon

    return (
        <Link
            href={item.href}
            onClick={onClick}
            className={cn(
                "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                active
                    ? "text-foreground bg-white/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
            )}
        >
            <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground/80")} />
            <span className="flex-1 truncate">{item.label}</span>
            {active && <div className="w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_currentColor]" />}
        </Link>
    )
}

export function DashboardShell({
    user,
    notifications,
    logoUrl,
    storeName,
    children,
}: {
    user: ShellUser
    notifications: ShellNotification[]
    logoUrl?: string
    storeName: string
    children: React.ReactNode
}) {
    const [mobileOpen, setMobileOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const unreadCount = notifications.filter((n) => !n.isRead).length
    const navNotifications = notifications.slice(0, 5)

    // Prevent hydration mismatch by rendering a placeholder until mounted
    if (!isMounted) {
        return <div className="min-h-screen bg-[#09090b]" />
    }

    return (
        <div className="flex min-h-screen w-full overflow-x-hidden bg-[#000000] text-foreground font-sans antialiased selection:bg-primary/20">
            {/* Desktop Sidebar - Fixed Width 240px for sleeker look */}
            <aside className="hidden md:flex md:w-[240px] md:flex-col fixed inset-y-0 z-50">
                <ShellNav
                    storeName={storeName}
                    logoUrl={logoUrl}
                    user={user}
                    notifications={notifications}
                />
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col min-w-0 md:pl-[240px]">
                {/* Header */}
                <header className="sticky top-0 z-40 h-14 border-b border-[#e5e5e5] dark:border-[#27272a] bg-neutral-50/80 dark:bg-[#09090b]/80 backdrop-blur-md supports-[backdrop-filter]:bg-neutral-50/60 dark:supports-[backdrop-filter]:bg-[#09090b]/60 transition-colors">
                    <div className="flex h-full items-center justify-between gap-4 px-4 lg:px-6">
                        <div className="flex items-center gap-4">
                            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                                <SheetTrigger asChild>
                                    <Button size="icon" variant="ghost" className="md:hidden -ml-2 text-muted-foreground hover:text-foreground" aria-label="Open menu">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="p-0 w-[260px] border-r border-[#e5e5e5] dark:border-[#27272a] bg-neutral-50 dark:bg-[#09090b]">
                                    <ShellNav
                                        storeName={storeName}
                                        logoUrl={logoUrl}
                                        user={user}
                                        notifications={notifications}
                                        onNavigate={() => setMobileOpen(false)}
                                        mobile
                                    />
                                </SheetContent>
                            </Sheet>

                            {/* Breadcrumb or Page Title could go here */}
                            <div className="hidden md:flex items-center text-sm text-muted-foreground">
                                <span className="opacity-50">Dashboard</span>
                                <ChevronRight className="w-4 h-4 mx-1 opacity-50" />
                                <span className="text-foreground font-medium">Overview</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Minimized Search */}
                            <div className="hidden sm:block mr-4">
                                <DashboardSearch className="w-40 md:w-56" />
                            </div>

                            {/* Notifications */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-neutral-900 dark:hover:text-foreground transition-colors" aria-label="Notifications">
                                        <Bell className="h-4 w-4" />
                                        {unreadCount > 0 && <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-neutral-50 dark:ring-[#09090b]" />}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[320px] rounded-xl border-[#e5e5e5] dark:border-[#27272a] bg-neutral-50 dark:bg-[#09090b] shadow-2xl p-0 overflow-x-auto no-scrollbar">
                                    <div className="p-3 border-b border-[#e5e5e5] dark:border-[#27272a] flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
                                        <span className="text-xs font-semibold">Notifications</span>
                                        {unreadCount > 0 && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{unreadCount} new</span>}
                                    </div>
                                    {navNotifications.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-muted-foreground">No new notifications</div>
                                    ) : (
                                        <div className="max-h-[300px] overflow-y-auto">
                                            {navNotifications.map((n) => (
                                                <DropdownMenuItem key={n.id} className="p-3 border-b border-[#e5e5e5] dark:border-[#27272a] last:border-0 rounded-none focus:bg-black/[0.03] dark:focus:bg-white/[0.03] cursor-pointer">
                                                    <div className="flex flex-col gap-1 w-full">
                                                        <div className="flex items-center justify-between w-full">
                                                            <span className={cn("text-xs font-medium", !n.isRead ? "text-neutral-900 dark:text-foreground" : "text-muted-foreground")}>{n.title}</span>
                                                            <span className="text-[10px] text-muted-foreground/50">{n.time}</span>
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground line-clamp-2">{n.message}</span>
                                                    </div>
                                                </DropdownMenuItem>
                                            ))}
                                        </div>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="w-px h-4 bg-neutral-300 dark:bg-[#27272a] mx-1" />

                            {/* User Menu Trigger */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full overflow-x-auto no-scrollbar ring-1 ring-black/10 dark:ring-white/10 hover:ring-black/30 dark:hover:ring-white/30 transition-all">
                                        <div className="h-full w-full bg-gradient-to-tr from-neutral-200 to-neutral-300 dark:from-zinc-700 dark:to-zinc-600 flex items-center justify-center text-[10px] font-bold text-neutral-900 dark:text-white">
                                            {user.name?.[0]?.toUpperCase()}
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-lg border-[#e5e5e5] dark:border-[#27272a] bg-neutral-50 dark:bg-[#09090b] shadow-xl p-1">
                                    <DropdownMenuLabel className="font-normal p-2">
                                        <div className="flex flex-col space-y-0.5">
                                            <p className="text-sm font-medium leading-none truncate">{user.name}</p>
                                            <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-[#e5e5e5] dark:bg-[#27272a]" />
                                    <DropdownMenuItem className="rounded-md focus:bg-black/5 dark:focus:bg-white/5 cursor-pointer" asChild>
                                        <Link href="/dashboard/profile">Profile</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-md focus:bg-black/5 dark:focus:bg-white/5 cursor-pointer" asChild>
                                        <Link href="/dashboard/settings">Settings</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-[#e5e5e5] dark:bg-[#27272a]" />
                                    <LogoutButton />
                                </DropdownMenuContent>
                            </DropdownMenu>

                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-10 w-full animate-in fade-in duration-500 bg-white dark:bg-[#000000] transition-colors">
                    {children}
                </main>
            </div>
        </div>
    )
}
