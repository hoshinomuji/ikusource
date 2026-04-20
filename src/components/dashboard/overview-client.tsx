"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, CreditCard, ChevronRight, Server, Clock, Zap, ArrowUpRight, Globe, Shield } from "lucide-react"
import { motion } from "framer-motion"

function fmtMoney(v: number) {
    if (!Number.isFinite(v)) return "0.00"
    return new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
}

function fmtDate(v: unknown) {
    if (!v) return "-"
    const d = new Date(v as any)
    if (Number.isNaN(d.getTime())) return "-"
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(d)
}

export function OverviewClient({
    userName,
    storeName,
    stats,
    services,
    news,
}: {
    userName: string
    storeName: string
    stats: {
        activeServices: number
        totalDomains: number
        expiringDomains: number
        walletBalance: number
    }
    services: any[]
    news: any[]
}) {
    return (
        <div className="relative z-10 space-y-10 w-full">
            {/* Modern Aurora Background */}
            <div className="fixed top-[-20%] right-[-10%] w-full max-w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-40 animate-pulse" />
            <div className="fixed bottom-[-20%] left-[-10%] w-full max-w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-30" />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-4"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_currentColor] animate-pulse" />
                        System Operational
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2"
                    >
                        Hello, <span className="text-white/60">{userName}</span>
                    </motion.h1>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-3"
                >
                    <div className="hidden md:block text-right mr-4">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Balance</p>
                        <p className="text-xl font-bold font-mono text-white tracking-tight">฿{fmtMoney(stats.walletBalance)}</p>
                    </div>
                    <Button size="icon" className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-indigo-500 text-white shadow-lg shadow-primary/25 border-0 hover:scale-105 transition-transform" asChild>
                        <Link href="/dashboard/wallet">
                            <CreditCard className="h-5 w-5" />
                        </Link>
                    </Button>
                    <Button className="h-10 px-6 rounded-full bg-white text-black hover:bg-white/90 font-bold transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] border-0" asChild>
                        <Link href="/dashboard/hosting">
                            <Zap className="mr-2 h-4 w-4 fill-black" />
                            New Project
                        </Link>
                    </Button>
                </motion.div>
            </div>

            {/* Stats - Horizontal Scroll on Mobile, Grid on Desktop */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ModernStat
                    label="Running Services"
                    value={stats.activeServices}
                    icon={<Server className="w-5 h-5" />}
                    color="text-emerald-400"
                    bg="group-hover:bg-emerald-500/10"
                />
                <ModernStat
                    label="Total Domains"
                    value={stats.totalDomains}
                    icon={<Globe className="w-5 h-5" />}
                    color="text-blue-400"
                    bg="group-hover:bg-blue-500/10"
                />
                <ModernStat
                    label="Expiring Soon"
                    value={stats.expiringDomains}
                    icon={<Clock className="w-5 h-5" />}
                    color={stats.expiringDomains > 0 ? "text-amber-400" : "text-muted-foreground"}
                    bg="group-hover:bg-amber-500/10"
                />
                <ModernStat
                    label="Security Score"
                    value="98%"
                    icon={<Shield className="w-5 h-5" />}
                    color="text-purple-400"
                    bg="group-hover:bg-purple-500/10"
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Modern List View - No more stiff tables */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-2 space-y-6"
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white">Active Projects</h2>
                        <Button variant="link" asChild className="text-muted-foreground hover:text-white p-0 h-auto font-normal">
                            <Link href="/dashboard/services">View All</Link>
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {services?.length ? (
                            services.map((s, i) => (
                                <Link href={`/dashboard/services/${s.id}`} key={s.id} className="block group">
                                    <div className="relative overflow-x-auto no-scrollbar rounded-2xl bg-[#111]/60 backdrop-blur-md border border-white/[0.03] p-4 transition-all duration-300 group-hover:bg-white/[0.05] group-hover:translate-x-1 group-hover:border-white/[0.08]">
                                        <div className="flex items-center gap-4">
                                            {/* Status Indicator Bar */}
                                            <div className={`w-1 h-12 rounded-full ${getStatusColor(s.status)}`} />

                                            <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-300">
                                                <Server className="h-6 w-6 text-muted-foreground group-hover:text-white transition-colors" />
                                            </div>

                                            <div className="flex-1 min-w-0 py-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-white text-base truncate pr-2 group-hover:text-primary transition-colors">
                                                        {s.name || `Project #${s.id}`}
                                                    </h3>
                                                    {s.status === 'active' && (
                                                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground font-mono flex items-center gap-3">
                                                    <span>CPU: <span className="text-white/70">2 vCore</span></span>
                                                    <span className="w-1 h-1 rounded-full bg-white/10" />
                                                    <span>RAM: <span className="text-white/70">4 GB</span></span>
                                                    <span className="w-1 h-1 rounded-full bg-white/10" />
                                                    <span>Due: {fmtDate(s.nextDueDate)}</span>
                                                </p>
                                            </div>

                                            <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center bg-white/[0.02]">
                                <div className="mx-auto h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                    <Server className="h-6 w-6 text-muted-foreground opacity-50" />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-1">No Active Projects</h3>
                                <p className="text-sm text-muted-foreground mb-4">You haven't deployed any services yet.</p>
                                <Button variant="secondary" className="rounded-full" asChild>
                                    <Link href="/dashboard/hosting">Start Deployment</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* News & Updates - Stacked Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-6"
                >
                    <h2 className="text-xl font-semibold text-white">Latest News</h2>
                    <div className="space-y-4">
                        {news?.length ? (
                            news.slice(0, 3).map((n, i) => (
                                <Link href={`/dashboard/news/${n.id}`} key={n.id} className="block group">
                                    <div className="relative p-5 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.03] hover:border-white/10 transition-all hover:-translate-y-1">
                                        <div className="absolute top-4 right-4">
                                            <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <Badge variant="outline" className="mb-3 rounded-md border-white/10 text-[10px] bg-black/20 text-muted-foreground">
                                            {n.type || "Update"}
                                        </Badge>
                                        <h4 className="text-sm font-medium text-white leading-snug mb-2 group-hover:text-primary transition-colors">
                                            {n.title}
                                        </h4>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {n.content}
                                        </p>
                                        <div className="mt-3 text-[10px] text-muted-foreground/50 font-mono">
                                            {fmtDate(n.publishedAt)}
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="p-8 text-center text-sm text-muted-foreground opacity-50">No updates</div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

function ModernStat({ label, value, icon, color, bg }: any) {
    return (
        <div className={`group relative p-5 rounded-3xl bg-[#111]/40 border border-white/[0.03] hover:border-white/10 transition-all duration-300`}>
            {/* Hover Glow */}
            <div className={`absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 ${bg}`} />

            <div className="relative flex flex-col h-full justify-between gap-4">
                <div className="flex justify-between items-start">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
                    <div className={`p-2 rounded-xl bg-white/5 ${color} group-hover:scale-110 transition-transform duration-300`}>
                        {icon}
                    </div>
                </div>
                <div>
                    <span className="text-2xl font-bold text-white tracking-tight group-hover:text-primary transition-colors">{value}</span>
                </div>
            </div>
        </div>
    )
}

function getStatusColor(status: string) {
    const s = String(status).toLowerCase()
    if (s === 'active' || s === 'running') return "bg-emerald-500 shadow-[0_0_10px_#10b981]"
    if (s === 'suspended' || s === 'expired') return "bg-red-500"
    if (s === 'pending') return "bg-amber-500"
    return "bg-zinc-500"
}
