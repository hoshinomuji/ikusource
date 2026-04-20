"use client"

import { useTransition } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Server, ChevronRight, Zap, Package, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { generateOneClickLoginByServiceId, getHostingUsageByServiceId, rotateDirectAdminPassword } from "@/app/actions/directadmin-tools"

function fmtDate(v: unknown) {
    if (!v) return "-"
    const d = new Date(v as any)
    if (Number.isNaN(d.getTime())) return "-"
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d)
}

function getStatusColor(status: string) {
    const s = String(status).toLowerCase()
    if (s === 'active' || s === 'running') return "bg-emerald-500 shadow-[0_0_10px_#10b981]"
    if (s === 'suspended' || s === 'expired') return "bg-red-500 shadow-[0_0_10px_#ef4444]"
    if (s === 'pending') return "bg-amber-500 shadow-[0_0_10px_#f59e0b]"
    return "bg-zinc-500"
}

export function ServicesClient({ services }: { services: any[] }) {
    const [isPending, startTransition] = useTransition()

    const oneClickLogin = (serviceId: number) => {
        startTransition(async () => {
            const result = await generateOneClickLoginByServiceId(serviceId)
            if (!result.success || (!result.url && !result.loginData)) {
                toast.error(result.error || "Unable to generate login URL")
                return
            }
            
            if (result.loginData && result.loginData.method === "POST") {
                const form = document.createElement("form")
                form.method = "POST"
                form.action = result.loginData.url
                form.target = "_blank"
                
                if (result.loginData.username) {
                    const u = document.createElement("input")
                    u.type = "hidden"
                    u.name = "username"
                    u.value = result.loginData.username
                    form.appendChild(u)
                }
                
                if (result.loginData.password) {
                    const p = document.createElement("input")
                    p.type = "hidden"
                    p.name = "password"
                    p.value = result.loginData.password
                    form.appendChild(p)
                }
                
                document.body.appendChild(form)
                form.submit()
                setTimeout(() => document.body.removeChild(form), 1000)
            } else if (result.url) {
                window.open(result.url, "_blank", "noopener,noreferrer")
            }
            
            toast.success("Opening DirectAdmin panel...")
        })
    }

    const showUsage = (serviceId: number) => {
        startTransition(async () => {
            const result = await getHostingUsageByServiceId(serviceId)
            if (!result.success) {
                toast.error(result.error || "Unable to fetch usage")
                return
            }
            const disk = result.data?.diskUsedMb ?? 0
            const bandwidth = result.data?.bandwidthUsedMb ?? 0
            toast.success(`Usage: Disk ${disk} MB | Bandwidth ${bandwidth} MB`)
        })
    }

    const rotatePassword = (serviceId: number) => {
        startTransition(async () => {
            const result = await rotateDirectAdminPassword(serviceId)
            if (!result.success) {
                toast.error(result.error || "Unable to rotate password")
                return
            }
            await navigator.clipboard.writeText(result.password || "")
            toast.success("Password rotated and copied to clipboard")
        })
    }

    return (
        <div className="relative z-10 space-y-8 max-w-full max-w-[1400px]">
            {/* Modern Aurora Background */}
            <div className="fixed top-[-20%] right-[-10%] w-full max-w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-40 animate-pulse" />
            <div className="fixed bottom-[-20%] left-[-10%] w-full max-w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-30" />

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2"
                    >
                        My Services
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground"
                    >
                        Manage and monitor your active services.
                    </motion.p>
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <Button className="h-10 px-6 rounded-full bg-white text-black hover:bg-white/90 font-bold transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] border-0" asChild>
                        <Link href="/dashboard/hosting">
                            <Zap className="mr-2 h-4 w-4 fill-black" />
                            New Service
                        </Link>
                    </Button>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
            >
                {services.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center bg-white/[0.02]">
                        <div className="mx-auto h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Package className="h-8 w-8 text-muted-foreground opacity-50" />
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">No Active Services</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                            You don't have any active services yet. Start by deploying a new service.
                        </p>
                        <Button variant="secondary" className="rounded-full px-8" asChild>
                            <Link href="/dashboard/hosting">Browse Catalog</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {services.map((s, i) => (
                            <motion.div
                                key={s.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className="group relative overflow-x-auto no-scrollbar rounded-2xl bg-[#111]/60 backdrop-blur-md border border-white/[0.03] p-5 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.08]"
                            >
                                <div className="flex items-center gap-5">
                                    {/* Status Indicator Bar */}
                                    <div className={`w-1.5 h-16 rounded-full shrink-0 ${getStatusColor(s.status)}`} />

                                    <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                        <Server className="h-7 w-7 text-muted-foreground group-hover:text-white transition-colors" />
                                    </div>

                                    {/* Info — full clickable area */}
                                    <Link href={`/dashboard/services/${s.id}`} className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-bold text-white truncate group-hover:text-primary transition-colors">
                                                {s.name || `Service #${s.id}`}
                                            </h3>
                                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-white/5 border-white/10 text-muted-foreground shrink-0">
                                                {s.type || "Unknown"}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                                IP: <span className="font-mono text-white/70">{s.ip || "-"}</span>
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5" />
                                                Due: <span className="text-white/70">{fmtDate(s.nextDueDate)}</span>
                                            </span>
                                        </div>
                                    </Link>

                                    <div className="hidden md:flex items-center mr-2 shrink-0">
                                        <div className={`px-3 py-1 rounded-full border ${s.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-muted-foreground'} text-xs font-medium uppercase tracking-wider`}>
                                            {s.status}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {String(s.type).toLowerCase() === "hosting" && (
                                            <>
                                                <Button size="sm" variant="outline" disabled={isPending} onClick={(e) => { e.stopPropagation(); oneClickLogin(s.id) }} className="border-white/10 hover:bg-white/10 text-xs">
                                                    Quick Login
                                                </Button>
                                                <Button size="sm" variant="outline" disabled={isPending} onClick={(e) => { e.stopPropagation(); showUsage(s.id) }} className="border-white/10 hover:bg-white/10 text-xs">
                                                    Usage
                                                </Button>
                                                <Button size="sm" variant="outline" disabled={isPending} onClick={(e) => { e.stopPropagation(); rotatePassword(s.id) }} className="border-white/10 hover:bg-white/10 text-xs">
                                                    Reset Pass
                                                </Button>
                                            </>
                                        )}
                                        <Link href={`/dashboard/services/${s.id}`} onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-full hover:bg-white/10 transition-all">
                                            <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/60 transition-all" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    )
}
