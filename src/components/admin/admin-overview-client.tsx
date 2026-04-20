"use client"

import { useState } from "react"
import { ArrowRight, Users, Server, Globe, DollarSign, RefreshCw, Loader2, CreditCard, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Stats {
    totalUsers: number
    totalServices: number
    activeServices: number
    totalInvoices: number
    unpaidInvoices: number
    totalUnpaidAmount: number
    totalWalletBalance: number
    totalDomains: number
}

interface RecentUser {
    id: number
    name: string
    email: string
    role: string
    createdAt: Date
}

function ModernStat({
    label,
    value,
    subValue,
    icon,
    color,
    bg
}: {
    label: string
    value: React.ReactNode
    subValue?: string
    icon: React.ReactNode
    color: string
    bg: string
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`group relative overflow-x-auto rounded-3xl no-scrollbar bg-[#111]/60 backdrop-blur-md border border-white/[0.03] p-6 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.08]`}
        >
            <div className={`absolute top-0 right-0 p-4 opacity-50 transition-opacity group-hover:opacity-100 ${color}`}>
                <div className={`p-3 rounded-2xl ${bg}`}>
                    {icon}
                </div>
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground/80 tracking-wide uppercase">{label}</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white tracking-tight tabular-nums">{value}</span>
                    </div>
                </div>
                {subValue && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 text-white/70 border border-white/5">
                            {subValue}
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    )
}

export function AdminOverviewClient({
    stats,
    recentUsers,
    recentServices,
}: {
    stats: Stats
    recentUsers: RecentUser[]
    recentServices: any[]
}) {
    const [isSuspending, setIsSuspending] = useState(false)

    const handleSuspensionCheck = async () => {
        setIsSuspending(true)
        try {
            const { suspendExpiredHostingAccounts } = await import("@/app/actions/suspension")
            const result = await suspendExpiredHostingAccounts()
            if (result.success) {
                toast.success(result.message)
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Error during suspension check")
            console.error(error)
        } finally {
            setIsSuspending(false)
        }
    }

    return (
        <div className="relative z-10 space-y-8">
            {/* Modern Aurora Background */}
            <div className="fixed top-[-20%] right-[-10%] w-full max-w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-30 animate-pulse" />
            <div className="fixed bottom-[-20%] left-[-10%] w-full max-w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-20" />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2"
                    >
                        System Overview
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground"
                    >
                        Real-time system statistics and recent activity.
                    </motion.p>
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <Button
                        onClick={handleSuspensionCheck}
                        disabled={isSuspending}
                        className="h-10 px-6 rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/10 backdrop-blur-sm transition-all"
                    >
                        {isSuspending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Sync System
                    </Button>
                </motion.div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ModernStat
                    label="Total Users"
                    value={stats.totalUsers}
                    subValue="Active Users"
                    icon={<Users className="w-5 h-5" />}
                    color="text-blue-400"
                    bg="bg-blue-500/10"
                />
                <ModernStat
                    label="Total Services"
                    value={stats.totalServices}
                    subValue={`${stats.activeServices} Active`}
                    icon={<Server className="w-5 h-5" />}
                    color="text-emerald-400"
                    bg="bg-emerald-500/10"
                />
                <ModernStat
                    label="Domains"
                    value={stats.totalDomains}
                    subValue="Registered"
                    icon={<Globe className="w-5 h-5" />}
                    color="text-purple-400"
                    bg="bg-purple-500/10"
                />
                <ModernStat
                    label="Revenue"
                    value={`฿${stats.totalWalletBalance.toLocaleString()}`}
                    subValue="Total Balance"
                    icon={<DollarSign className="w-5 h-5" />}
                    color="text-amber-400"
                    bg="bg-amber-500/10"
                />
            </div>

            {/* Content Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Recent Users List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-2 space-y-6"
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white">Recent Registrations</h2>
                        <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {recentUsers.map((user, i) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className="group relative overflow-x-auto no-scrollbar rounded-2xl bg-[#111]/60 backdrop-blur-md border border-white/[0.03] p-4 transition-all duration-300 hover:bg-white/[0.05] hover:translate-x-1 hover:border-white/[0.08]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-600 flex items-center justify-center text-sm font-bold text-white ring-2 ring-[#111] group-hover:ring-primary/50 transition-all">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium text-white truncate">{user.name}</h3>
                                            <Badge variant={user.role === "admin" ? "default" : "secondary"} className="h-5 text-[10px] px-1.5 font-normal">
                                                {user.role}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                    </div>
                                    <div className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Quick Actions / Notices */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-6"
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white">System Status</h2>
                    </div>

                    <div className="rounded-3xl bg-emerald-500/10 border border-emerald-500/20 p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
                                <RefreshCw className="w-6 h-6 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="font-medium text-white">System Healthy</h3>
                                <p className="text-xs text-emerald-200/70">All services operational</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-white/80">
                                <span>CPU Usage</span>
                                <span>12%</span>
                            </div>
                            <div className="h-1.5 w-full bg-emerald-500/20 rounded-full overflow-x-auto no-scrollbar">
                                <div className="h-full bg-emerald-500 w-[12%] rounded-full" />
                            </div>
                            <div className="flex justify-between text-sm text-white/80 mt-2">
                                <span>Memory</span>
                                <span>34%</span>
                            </div>
                            <div className="h-1.5 w-full bg-emerald-500/20 rounded-full overflow-x-auto no-scrollbar">
                                <div className="h-full bg-emerald-500 w-[34%] rounded-full" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
