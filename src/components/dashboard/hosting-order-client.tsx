"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { createHostingOrder } from "@/app/actions/hosting"
import { precheckHostingDomain } from "@/app/actions/directadmin-tools"
import { 
    ArrowLeft, 
    ShoppingCart, 
    Package, 
    CheckCircle2, 
    AlertCircle, 
    Globe, 
    Mail, 
    Server, 
    HardDrive, 
    Cpu, 
    Database, 
    ShieldCheck, 
    Zap,
    Loader2
} from "lucide-react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

function fmtMoney(v: any) {
    const n = typeof v === "string" ? parseFloat(v) : Number(v)
    if (!Number.isFinite(n)) return "0.00"
    return n.toFixed(2)
}

export function HostingOrderClient({ package: pkg }: { package: any }) {
    const [isPending, startTransition] = useTransition()
    const [domain, setDomain] = useState("")
    const [email, setEmail] = useState("")
    const [checking, setChecking] = useState(false)
    const [domainStatus, setDomainStatus] = useState<"idle" | "success" | "error">("idle")
    const [domainMessage, setDomainMessage] = useState("")

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
        if (domainStatus !== "success") {
            toast.error("Please verify your domain first")
            return
        }

        startTransition(async () => {
            const form = new FormData()
            form.append("packageId", String(pkg?.id))
            form.append("domain", domain)
            form.append("email", email)

            const res = await createHostingOrder(form)
            if (res?.success) {
                toast.success(res.message || "Order created successfully!")
                // Add a small delay for user to read success message
                setTimeout(() => {
                    window.location.href = "/dashboard/services"
                }, 1000)
            } else {
                toast.error(res?.error || "Order failed")
            }
        })
    }

    const onPrecheck = async () => {
        if (!domain) {
            toast.error("Please enter a domain name")
            return
        }
        
        // Basic format check
        if (!domain.includes(".") || domain.includes(" ")) {
            setDomainStatus("error")
            setDomainMessage("Invalid domain format (e.g., example.com)")
            return
        }

        setChecking(true)
        setDomainStatus("idle")
        setDomainMessage("")
        
        try {
            const result = await precheckHostingDomain(domain)
            
            if (!result.success) {
                setDomainStatus("error")
                setDomainMessage(result.error || "Domain precheck failed")
                toast.error(result.error || "Domain precheck failed")
            } else {
                setDomainStatus("success")
                setDomainMessage(`Domain available: ${result.data?.normalizedDomain}`)
                setDomain(result.data?.normalizedDomain || domain)
                toast.success("Domain is valid and available")
            }
        } catch (error) {
            setDomainStatus("error")
            setDomainMessage("Failed to check domain")
        } finally {
            setChecking(false)
        }
    }

    // Input classes
    const inputClass = "h-12 rounded-xl bg-[#111]/80 border-white/10 text-white focus:bg-white/10 transition-all shadow-inner focus:ring-2 focus:ring-primary/20"
    const labelClass = "text-sm font-medium text-white/80"

    return (
        <div className="relative z-10 min-h-screen pb-20">
            {/* Background Effects */}
            <div className="fixed top-[10%] right-[-5%] w-full max-w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-screen" />
            <div className="fixed bottom-[10%] left-[-5%] w-full max-w-[600px] h-[600px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none -z-10 mix-blend-screen" />

            <div className="max-w-5xl mx-auto space-y-8 px-4 md:px-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-8">
                    <div className="space-y-1">
                        <Button asChild variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-white hover:bg-transparent -ml-2">
                            <Link href="/dashboard/hosting" className="flex items-center gap-1">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Packages
                            </Link>
                        </Button>
                        <motion.h1 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl md:text-4xl font-bold tracking-tight text-white"
                        >
                            Review & Checkout
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-muted-foreground"
                        >
                            Complete your hosting order configuration.
                        </motion.p>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Left Column: Configuration Form */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2 space-y-6"
                    >
                        <Card className="border-white/[0.05] bg-[#111]/60 backdrop-blur-xl shadow-2xl overflow-x-auto no-scrollbar rounded-3xl">
                            <CardHeader className="border-b border-white/[0.05] bg-white/[0.02] p-6">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Globe className="h-5 w-5 text-blue-400" />
                                    Domain Configuration
                                </CardTitle>
                                <CardDescription className="text-white/50">
                                    Enter the domain name you want to use with this hosting package.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="domain" className={labelClass}>Domain Name</Label>
                                        <div className="relative flex gap-3">
                                            <div className="relative flex-1">
                                                <Input
                                                    id="domain"
                                                    value={domain}
                                                    onChange={(e) => {
                                                        setDomain(e.target.value);
                                                        if (domainStatus !== "idle") setDomainStatus("idle");
                                                    }}
                                                    placeholder="example.com"
                                                    required
                                                    autoComplete="off"
                                                    className={`${inputClass} pl-11 ${domainStatus === "success" ? "border-emerald-500/50 focus:ring-emerald-500/20" : domainStatus === "error" ? "border-red-500/50 focus:ring-red-500/20" : ""}`}
                                                />
                                                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                                            </div>
                                            <Button 
                                                type="button" 
                                                onClick={onPrecheck} 
                                                disabled={checking || !domain}
                                                className="h-12 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 font-medium"
                                            >
                                                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                                            </Button>
                                        </div>
                                        
                                        {/* Status Messages */}
                                        {domainStatus === "success" && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }} 
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20"
                                            >
                                                <CheckCircle2 className="h-4 w-4" />
                                                {domainMessage}
                                            </motion.div>
                                        )}
                                        {domainStatus === "error" && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }} 
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20"
                                            >
                                                <AlertCircle className="h-4 w-4" />
                                                {domainMessage}
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className={labelClass}>Admin Email</Label>
                                        <div className="relative">
                                            <Input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="admin@example.com"
                                                required
                                                autoComplete="email"
                                                className={`${inputClass} pl-11`}
                                            />
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                                        </div>
                                        <p className="text-xs text-white/40 ml-1">
                                            System notifications and login details will be sent to this email.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Additional Info / Trust Badges */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-[#111]/40 border border-white/[0.03] p-4 rounded-2xl flex items-center gap-3 backdrop-blur-sm">
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                    <Zap className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-white">Instant Setup</h4>
                                    <p className="text-xs text-white/50">Ready in seconds</p>
                                </div>
                            </div>
                            <div className="bg-[#111]/40 border border-white/[0.03] p-4 rounded-2xl flex items-center gap-3 backdrop-blur-sm">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-white">Secure</h4>
                                    <p className="text-xs text-white/50">SSL included</p>
                                </div>
                            </div>
                            <div className="bg-[#111]/40 border border-white/[0.03] p-4 rounded-2xl flex items-center gap-3 backdrop-blur-sm">
                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                    <Server className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-white">99.9% Uptime</h4>
                                    <p className="text-xs text-white/50">Guaranteed reliability</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Order Summary */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-6"
                    >
                        <Card className="border-white/[0.05] bg-[#111]/60 backdrop-blur-xl shadow-2xl overflow-x-auto no-scrollbar rounded-3xl sticky top-24">
                            <CardHeader className="bg-gradient-to-br from-primary/10 to-transparent border-b border-white/[0.05] p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl font-bold text-white mb-1">{pkg?.name || "Standard Package"}</CardTitle>
                                        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
                                            {pkg?.billingCycle === "yearly" ? "Yearly Plan" : "Monthly Plan"}
                                        </Badge>
                                    </div>
                                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                        <Package className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {/* Specs Grid */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-white/70 uppercase tracking-wider">Package Specs</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                <HardDrive className="w-3 h-3" /> Disk Space
                                            </span>
                                            <p className="text-sm font-semibold text-white">{pkg?.diskSpace || "0"} MB</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                <Zap className="w-3 h-3" /> Bandwidth
                                            </span>
                                            <p className="text-sm font-semibold text-white">{pkg?.bandwidth || "0"} MB</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                <Globe className="w-3 h-3" /> Domains
                                            </span>
                                            <p className="text-sm font-semibold text-white">{pkg?.domains || "1"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                <Database className="w-3 h-3" /> Databases
                                            </span>
                                            <p className="text-sm font-semibold text-white">{pkg?.databases || "0"}</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="bg-white/10" />

                                {/* Pricing Breakdown */}
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span>฿{fmtMoney(pkg?.price)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Setup Fee</span>
                                        <span className="text-emerald-400">Free</span>
                                    </div>
                                    <Separator className="bg-white/10 my-2" />
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-base font-medium text-white">Total Due</span>
                                        <span className="text-2xl font-bold text-primary">฿{fmtMoney(pkg?.price)}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-6 pt-0">
                                <Button 
                                    onClick={onSubmit} 
                                    disabled={isPending || domainStatus !== "success" || !email}
                                    className="w-full h-12 rounded-xl text-base font-bold bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart className="mr-2 h-5 w-5" />
                                            Complete Order
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

