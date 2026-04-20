"use client"

import { HardDrive, Network, Globe, LayoutGrid, Mail, Database, FileCode, Server } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ReactNode } from "react"

interface HostingPackage {
    id: number
    name: string
    description: string | null
    price: string
    diskSpace: string
    bandwidth: string
    domains: string
    subdomains: string
    emailAccounts: string
    databases: string
    ftpAccounts: string
    billingCycle: string | null
}

interface ComparisonTableProps {
    packages: HostingPackage[]
}

const features = [
    { label: "พื้นที่จัดเก็บ (SSD)", key: "diskSpace", icon: HardDrive },
    { label: "แบนด์วิดท์ (Transfer)", key: "bandwidth", icon: Network },
    { label: "โดเมนที่รองรับ", key: "domains", icon: Globe },
    { label: "ซับโดเมน", key: "subdomains", icon: LayoutGrid },
    { label: "บัญชีอีเมล", key: "emailAccounts", icon: Mail },
    { label: "ฐานข้อมูล (MySQL)", key: "databases", icon: Database },
    { label: "บัญชี FTP", key: "ftpAccounts", icon: FileCode },
]

function isUnlimitedValue(value: unknown) {
    if (typeof value !== "string") return false
    const text = value.trim().toLowerCase()
    return text === "unlimited" || text === "ไม่จำกัด" || text === "∞"
}

export function ComparisonTable({ packages = [] }: ComparisonTableProps) {
    const displayPackages = packages || []
    if (displayPackages.length === 0) return null

    return (
        <section className="py-24 relative overflow-hidden bg-black/40">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
                    >
                        <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                            ตารางเปรียบเทียบสเปก
                        </span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-muted-foreground"
                    >
                        เลือกแพ็กเกจที่เหมาะกับงานของคุณ เปรียบเทียบรายละเอียดแบบชัดเจนก่อนตัดสินใจ
                    </motion.p>
                </div>

                <div className="relative isolate">
                    <div className="rounded-3xl border border-white/10 bg-[#0A0A0A]/60 backdrop-blur-xl overflow-hidden shadow-2xl ring-1 ring-white/5">
                        <div className="overflow-x-auto custom-scrollbar">
                            <div className="min-w-[900px]">
                                <div
                                    className="grid"
                                    style={{ gridTemplateColumns: `280px repeat(${displayPackages.length}, 1fr)` }}
                                >
                                    <div className="p-8 flex flex-col justify-end border-b border-white/5 bg-white/[0.02]">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Server className="w-5 h-5 text-primary" />
                                            </div>
                                            <span className="text-xl font-bold text-white">ฟีเจอร์ทั้งหมด</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground pl-[52px]">รายละเอียดเปรียบเทียบ</span>
                                    </div>

                                    {displayPackages.map((pkg, i) => (
                                        <div
                                            key={pkg.id}
                                            className={cn(
                                                "relative p-8 flex flex-col items-center justify-end text-center space-y-4 border-b border-white/5 transition-colors duration-300",
                                                i === 1 ? "bg-primary/5" : "bg-transparent",
                                            )}
                                        >
                                            <div className="space-y-1">
                                                <div className="text-lg font-bold text-white mb-2">{pkg.name}</div>
                                                <div className="flex items-baseline justify-center gap-1">
                                                    <span className="text-3xl font-bold bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
                                                        ฿{Number(pkg.price).toLocaleString("th-TH")}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground font-medium">/เดือน</span>
                                                </div>
                                            </div>

                                            <Link href="/register" className="w-full">
                                                <Button
                                                    size="sm"
                                                    className={cn(
                                                        "w-full rounded-full font-semibold transition-all duration-300 h-9",
                                                        i === 1
                                                            ? "bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
                                                            : "bg-white/10 hover:bg-white/15 text-white border border-white/5",
                                                    )}
                                                >
                                                    เลือกแพ็กเกจนี้
                                                </Button>
                                            </Link>
                                        </div>
                                    ))}

                                    {features.map((feature, idx) => (
                                        <motion.div
                                            key={feature.key}
                                            initial={{ opacity: 0 }}
                                            whileInView={{ opacity: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="contents group"
                                        >
                                            <div className="p-5 pl-8 flex items-center gap-3 font-medium text-gray-400 group-hover:text-white transition-colors border-b border-white/5 bg-white/[0.01] group-hover:bg-white/[0.03]">
                                                <feature.icon className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
                                                {feature.label}
                                            </div>

                                            {displayPackages.map((pkg, i) => {
                                                const value = (pkg as any)[feature.key] as ReactNode
                                                const isUnlimited = isUnlimitedValue(value)

                                                return (
                                                    <div
                                                        key={`${pkg.id}-${feature.key}`}
                                                        className={cn(
                                                            "p-5 flex items-center justify-center text-center border-b border-white/5 transition-colors duration-300 relative",
                                                            i === 1 ? "bg-primary/[0.03] group-hover:bg-primary/[0.06]" : "bg-transparent group-hover:bg-white/[0.02]",
                                                        )}
                                                    >
                                                        {i === 1 && <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-primary/5 to-transparent" />}
                                                        {i === 1 && <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-primary/5 to-transparent" />}

                                                        {isUnlimited ? (
                                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_-3px_rgba(var(--primary),0.3)]">
                                                                <span className="text-lg leading-none font-bold">∞</span>
                                                                <span className="text-xs font-semibold">ไม่จำกัด</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-300 font-medium group-hover:text-white transition-colors">{value}</span>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
