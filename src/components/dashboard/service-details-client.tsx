"use client"

import { useTransition, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    ArrowLeft, Server, Globe, Lock, ExternalLink, RefreshCw,
    Activity, Shield, HardDrive, Zap, Database, Copy, Check,
    Eye, EyeOff, Loader2, Mail, User, Wifi, Network
} from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
    generateOneClickLoginByServiceId,
    getHostingUsageByServiceId,
    rotateDirectAdminPassword,
} from "@/app/actions/directadmin-tools"

function fmtDate(v: unknown) {
    if (!v) return "-"
    const d = new Date(v as any)
    if (Number.isNaN(d.getTime())) return "-"
    return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(d)
}

function getStatusStyle(status: string) {
    const s = String(status).toLowerCase()
    if (s === "active") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
    if (s === "suspended") return "text-red-400 bg-red-500/10 border-red-500/30"
    if (s === "pending") return "text-amber-400 bg-amber-500/10 border-amber-500/30"
    return "text-zinc-400 bg-zinc-500/10 border-zinc-500/30"
}

function InfoRow({ label, value, mono, copy }: { label: string; value: string; mono?: boolean; copy?: boolean }) {
    const [copied, setCopied] = useState(false)
    const handleCopy = () => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        toast.success("Copied!")
        setTimeout(() => setCopied(false), 2000)
    }
    return (
        <div className="group flex items-center justify-between py-3.5 px-4 -mx-4 rounded-xl hover:bg-white/[0.02] border-b border-transparent hover:border-white/[0.02] transition-colors">
            <span className="text-sm text-white/50 shrink-0 w-32 md:w-40 font-medium">{label}</span>
            <div className="flex items-center gap-3 min-w-0">
                <span className={`text-sm text-white/90 truncate ${mono ? "font-mono text-blue-100" : ""}`}>{value || "-"}</span>
                {copy && value && (
                    <button
                        onClick={handleCopy}
                        className="shrink-0 p-1.5 rounded-lg text-white/20 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                )}
            </div>
        </div>
    )
}

export function ServiceDetailsClient({ service, hostingDetails }: { service: any; hostingDetails: any }) {
    const [isPending, startTransition] = useTransition()
    const [usage, setUsage] = useState<{ disk: string; bandwidth: string } | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [password, setPassword] = useState<string>(hostingDetails?.directAdminPassword || "")

    const oneClickLogin = () => {
        startTransition(async () => {
            const result = await generateOneClickLoginByServiceId(service.id)
            if (!result.success || (!result.url && !result.loginData)) {
                // Fallback: open panel URL directly
                if (hostingDetails?.panelUrl) {
                    window.open(hostingDetails.panelUrl, "_blank", "noopener,noreferrer")
                    toast.error((result.error || "Login key failed") + " — Opening panel instead")
                } else {
                    toast.error(result.error || "Unable to generate login URL")
                }
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

    const fetchUsage = () => {
        startTransition(async () => {
            const result = await getHostingUsageByServiceId(service.id)
            if (!result.success) {
                toast.error(result.error || "Unable to fetch usage")
                return
            }
            setUsage({
                disk: `${result.data?.diskUsedMb ?? 0} MB`,
                bandwidth: `${result.data?.bandwidthUsedMb ?? 0} MB`,
            })
            toast.success("Usage updated")
        })
    }

    const doRotatePassword = () => {
        if (!confirm("รีเซ็ตรหัสผ่านสำหรับ DirectAdmin ใช่ไหม? รหัสใหม่จะถูก copy ไปยัง clipboard")) return
        startTransition(async () => {
            const result = await rotateDirectAdminPassword(service.id)
            if (!result.success) {
                toast.error(result.error || "Unable to rotate password")
                return
            }
            setPassword(result.password || "")
            navigator.clipboard.writeText(result.password || "")
            toast.success("รหัสผ่านใหม่ถูก copy ไปยัง clipboard แล้ว")
        })
    }

    return (
        <div className="relative z-10 space-y-8 max-w-5xl mx-auto pb-20">
            {/* Aurora BG */}
            <div className="fixed top-[-20%] right-[-10%] w-full max-w-[600px] h-[600px] bg-blue-500/20 blur-[130px] rounded-full pointer-events-none -z-10" />
            <div className="fixed bottom-[-10%] left-[-10%] w-full max-w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

            {/* Back + Header */}
            <div className="space-y-6">
                <Button asChild variant="ghost" size="sm" className="w-fit -ml-2 text-white/50 hover:text-white hover:bg-white/5 rounded-xl">
                    <Link href="/dashboard/services" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Services
                    </Link>
                </Button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                {service.name || `Service #${service.id}`}
                            </h1>
                            <Badge variant="outline" className={`px-2.5 py-0.5 rounded-full border ${getStatusStyle(service.status)}`}>
                                {service.status}
                            </Badge>
                        </div>
                        <p className="text-white/50 text-sm font-medium">
                            {service.type === "hosting" ? "Web Hosting" : service.type} · Created {fmtDate(service.createdAt)}
                        </p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-3">
                        <Button variant="outline" onClick={fetchUsage} disabled={isPending} className="border-white/10 hover:bg-white/5 bg-black/20 backdrop-blur-md rounded-xl">
                            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-400" /> : <Activity className="w-4 h-4 mr-2 text-blue-400" />}
                            Check Usage
                        </Button>
                        {service.type === "hosting" && (
                            <Button onClick={oneClickLogin} disabled={isPending} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-blue-500/25 rounded-xl transition-all">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                DirectAdmin Login
                            </Button>
                        )}
                    </motion.div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3 items-start">
                {/* Left: Hosting Details */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="md:col-span-2 space-y-6"
                >
                    {/* Credentials */}
                    {hostingDetails && (
                        <Card className="bg-black/40 backdrop-blur-xl border-white/[0.05] rounded-3xl overflow-x-auto no-scrollbar shadow-2xl">
                            <CardHeader className="border-b border-white/[0.05] bg-white/[0.01] px-6 py-5">
                                <CardTitle className="flex items-center gap-3 text-lg font-semibold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                    <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                        <Lock className="w-4 h-4 text-blue-400" />
                                    </div>
                                    Login Credentials
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-6 py-2 space-y-0 divide-y divide-white/5">
                                <InfoRow label="Domain" value={hostingDetails.domain} copy />
                                <InfoRow label="Server IP" value={hostingDetails.serverIp || service.ip} mono copy />
                                <InfoRow label="Username" value={hostingDetails.directAdminUsername} mono copy />
                                <InfoRow label="Email" value={hostingDetails.directAdminEmail} copy />

                                {/* Password row */}
                                <div className="group flex items-center justify-between py-3.5 px-4 -mx-4 rounded-xl hover:bg-white/[0.02] border-b border-transparent hover:border-white/[0.02] transition-colors">
                                    <span className="text-sm text-white/50 shrink-0 w-32 md:w-40 font-medium">Password</span>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={`text-sm text-white/90 ${showPassword ? 'font-mono text-blue-100' : ''}`}>
                                            {showPassword ? (password || "—") : "••••••••••••"}
                                        </span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setShowPassword((v) => !v)}
                                                className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all"
                                                title={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            </button>
                                            {showPassword && password && (
                                                <CopyBtn value={password} />
                                            )}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={doRotatePassword}
                                            disabled={isPending}
                                            className="h-7 text-xs border-white/10 hover:bg-white/10 bg-black/20 ml-2 rounded-lg"
                                        >
                                            <RefreshCw className="w-3 h-3 mr-1.5 text-blue-400" />
                                            Reset
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Nameservers */}
                    {hostingDetails?.nameservers?.filter(Boolean).length > 0 && (
                        <Card className="bg-black/40 backdrop-blur-xl border-white/[0.05] rounded-3xl overflow-x-auto no-scrollbar shadow-2xl">
                            <CardHeader className="border-b border-white/[0.05] bg-white/[0.01] px-6 py-5">
                                <CardTitle className="flex items-center gap-3 text-lg font-semibold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                        <Network className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    Nameservers
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {hostingDetails.nameservers.filter(Boolean).map((ns: string, i: number) => (
                                        <div key={i} className="group flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-2xl p-4 border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                    <span className="text-xs font-bold text-emerald-400">NS{i+1}</span>
                                                </div>
                                                <span className="font-mono text-sm text-white/90 truncate">{ns}</span>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <CopyBtn value={ns} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-5 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                                    <Globe className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                                    <p className="text-sm text-blue-200/70">โปรดตั้งค่า Nameserver เหล่านี้ที่ผู้ให้บริการโดเมน (Domain Registrar) ของคุณ เพื่อเชื่อมต่อโดเมนเข้ากับโฮสติ้ง</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Usage Stats */}
                    {usage && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                            <Card className="bg-black/40 backdrop-blur-xl border-white/[0.05] rounded-3xl overflow-x-auto no-scrollbar shadow-2xl">
                                <CardHeader className="border-b border-white/[0.05] bg-white/[0.01] px-6 py-5">
                                    <CardTitle className="flex items-center gap-3 text-lg font-semibold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                        <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                                            <Activity className="w-4 h-4 text-yellow-400" />
                                        </div>
                                        Resource Usage
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 grid grid-cols-2 gap-4">
                                    <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/5 flex flex-col items-center justify-center space-y-3">
                                        <div className="p-3 rounded-full bg-blue-500/10">
                                            <HardDrive className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div className="text-2xl font-bold text-white">{usage.disk}</div>
                                        <div className="text-xs text-white/40 uppercase tracking-widest font-semibold">Disk Used</div>
                                    </div>
                                    <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/5 flex flex-col items-center justify-center space-y-3">
                                        <div className="p-3 rounded-full bg-yellow-500/10">
                                            <Zap className="w-5 h-5 text-yellow-400" />
                                        </div>
                                        <div className="text-2xl font-bold text-white">{usage.bandwidth}</div>
                                        <div className="text-xs text-white/40 uppercase tracking-widest font-semibold">Bandwidth Used</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </motion.div>

                {/* Right: Summary */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-6"
                >
                    <Card className="bg-black/40 backdrop-blur-xl border-white/[0.05] rounded-3xl overflow-x-auto no-scrollbar shadow-2xl sticky top-24">
                        <CardHeader className="border-b border-white/[0.05] bg-white/[0.01] px-6 py-5">
                            <CardTitle className="flex items-center gap-3 text-lg font-semibold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                    <Database className="w-4 h-4 text-purple-400" />
                                </div>
                                Package Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="text-xl font-bold text-white bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                                {hostingDetails?.package?.name || "Standard Plan"}
                            </div>
                            
                            <div className="space-y-3.5">
                                {[
                                    { label: "Price", value: `฿${parseFloat(service.price || 0).toFixed(2)} / ${service.billingCycle === "yearly" ? "Year" : "Month"}` },
                                    { label: "Next Due", value: fmtDate(service.nextDueDate) },
                                    { label: "Disk Space", value: service.disk || `${hostingDetails?.package?.diskSpace || "-"} MB` },
                                    { label: "Status", value: service.status, isStatus: true },
                                ].map(({ label, value, isStatus }) => (
                                    <div key={label} className="flex justify-between items-center text-sm">
                                        <span className="text-white/50 font-medium">{label}</span>
                                        {isStatus ? (
                                            <Badge variant="outline" className={`border ${getStatusStyle(String(value))} capitalize`}>{value}</Badge>
                                        ) : (
                                            <span className="text-white/90 font-medium">{value}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <Separator className="bg-white/5" />
                            
                            <div className="space-y-3 pt-2">
                                <Button
                                    onClick={oneClickLogin}
                                    disabled={isPending}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-blue-500/25 rounded-xl h-11 transition-all"
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    เปิด DirectAdmin
                                </Button>
                                {hostingDetails?.panelUrl && (
                                    <Button variant="outline" asChild className="w-full border-white/10 hover:bg-white/10 bg-black/20 text-white/80 h-11 rounded-xl">
                                        <a href={hostingDetails.panelUrl} target="_blank" rel="noreferrer">
                                            <Globe className="w-4 h-4 mr-2 opacity-70" />
                                            ไปที่ Panel โดยตรง
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}

function CopyBtn({ value }: { value: string }) {
    const [copied, setCopied] = useState(false)
    const handle = () => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        toast.success("Copied!")
        setTimeout(() => setCopied(false), 2000)
    }
    return (
        <button onClick={handle} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all focus:outline-none">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
    )
}
