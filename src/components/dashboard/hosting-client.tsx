"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ShoppingCart, Package, Server, ShieldCheck, Cpu } from "lucide-react"
import { motion } from "framer-motion"

function fmtMoney(v: any) {
    const n = typeof v === "string" ? parseFloat(v) : Number(v)
    if (!Number.isFinite(n)) return "-"
    return n.toFixed(2)
}

export function HostingClient({
    categories,
    packages,
}: {
    categories: any[]
    packages: any[]
    hasServices?: boolean
    userServices?: any[]
}) {
    const [cat, setCat] = useState<number | "all">("all")

    const filtered = useMemo(() => {
        if (cat === "all") return packages
        return packages.filter((p) => p.categoryId === cat)
    }, [packages, cat])

    return (
        <div className="relative z-10 space-y-10 max-w-full max-w-[1400px]">
            {/* Modern Aurora Background */}
            <div className="fixed top-[-20%] right-[-10%] w-full max-w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-30 animate-pulse" />
            <div className="fixed bottom-[-20%] left-[-10%] w-full max-w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-20" />

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2"
                    >
                        Hosting Catalog
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground"
                    >
                        Select a package to deploy your new service.
                    </motion.p>
                </div>
            </div>

            {/* Category Filter */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-2"
            >
                <div className="p-1 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm flex flex-wrap gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCat("all")}
                        className={cn(
                            "rounded-full px-4 h-8 transition-all",
                            cat === "all" ? "bg-white text-black font-bold shadow-lg" : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                    >
                        All Packages
                    </Button>
                    {categories.map((c) => (
                        <Button
                            key={c.id}
                            variant="ghost"
                            size="sm"
                            onClick={() => setCat(c.id)}
                            className={cn(
                                "rounded-full px-4 h-8 transition-all",
                                cat === c.id ? "bg-white text-black font-bold shadow-lg" : "text-muted-foreground hover:text-white hover:bg-white/5"
                            )}
                        >
                            {c.name}
                        </Button>
                    ))}
                </div>
            </motion.div>

            {/* Packages Grid */}
            <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
                {filtered.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="mx-auto h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                            <Package className="h-10 w-10 text-muted-foreground opacity-50" />
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">No Packages Found</h3>
                        <p className="text-muted-foreground">Try selecting a different category.</p>
                    </div>
                ) : (
                    filtered.map((p, i) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            key={p.id}
                            className={cn(
                                "group relative flex flex-col justify-between overflow-x-auto no-scrollbar rounded-3xl bg-[#111]/60 backdrop-blur-md border border-white/[0.03] p-6 transition-all duration-300 hover:bg-white/[0.05] hover:-translate-y-1 hover:border-white/[0.08] hover:shadow-2xl hover:shadow-primary/5",
                                !p.isActive && "opacity-60 grayscale pointer-events-none"
                            )}
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <Server className="h-6 w-6 text-white" />
                                    </div>
                                    {!p.isActive && (
                                        <Badge variant="secondary" className="bg-white/5 text-muted-foreground">Out of Stock</Badge>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">{p.name}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-6 h-10">
                                    {p.description || "High performance hosting for your applications with dedicated resources."}
                                </p>

                                {/* Feature Pills (Fake data for visual if not present) */}
                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Cpu className="w-3.5 h-3.5 text-white/50" />
                                        <span>High Performance CPU</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <ShieldCheck className="w-3.5 h-3.5 text-white/50" />
                                        <span>DDoS Protection</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5 mt-auto">
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-sm text-muted-foreground">฿</span>
                                    <span className="text-3xl font-bold text-white tracking-tighter">{fmtMoney(p.price)}</span>
                                    <span className="text-xs text-muted-foreground/70 ml-1">/{p.billingCycle || "mo"}</span>
                                </div>

                                <Button asChild className="w-full rounded-xl bg-white text-black hover:bg-white/90 font-bold transition-all h-11" disabled={!p.isActive}>
                                    <Link href={`/dashboard/hosting/order?packageId=${p.id}`}>
                                        <ShoppingCart className="mr-2 h-4 w-4" />
                                        Order Now
                                    </Link>
                                </Button>
                            </div>
                        </motion.div>
                    ))
                )}
            </motion.div>
        </div>
    )
}
