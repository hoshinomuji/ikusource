"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { generate2FASecret, enable2FA, disable2FA } from "@/app/actions/auth-2fa"
import { QRCodeSVG } from "qrcode.react"
import { Shield, ShieldCheck, KeyRound, Smartphone, Lock } from "lucide-react"
import { motion } from "framer-motion"

export function TwoFactorSetup({
    user,
}: {
    user: {
        id: number
        email: string
        twoFactorEnabled: boolean
    }
}) {
    const [isPending, startTransition] = useTransition()
    const [secret, setSecret] = useState<string | null>(null)
    const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null)
    const [code, setCode] = useState("")

    const enabled = !!user.twoFactorEnabled

    const canEnable = useMemo(() => {
        return !!secret && code.trim().length === 6
    }, [secret, code])

    useEffect(() => {
        setSecret(null)
        setOtpauthUrl(null)
        setCode("")
    }, [enabled])

    const onGenerate = () => {
        startTransition(async () => {
            const res = await generate2FASecret(user.id)
            if (!res.success || !res.secret || !res.otpauthUrl) {
                toast.error(res.error || "Failed to generate secret")
                return
            }
            setSecret(res.secret)
            setOtpauthUrl(res.otpauthUrl)
            toast.success("2FA secret generated")
        })
    }

    const onEnable = () => {
        if (!secret) return
        startTransition(async () => {
            const res = await enable2FA(user.id, code.trim(), secret)
            if (res?.success) {
                toast.success("2FA enabled successfully")
                window.location.reload()
            } else {
                toast.error(res?.error || "Invalid code")
            }
        })
    }

    const onDisable = () => {
        if (!confirm("Are you sure you want to disable 2FA? This will reduce your account security.")) return
        startTransition(async () => {
            const res = await disable2FA(user.id)
            if (res?.success) {
                toast.success("2FA disabled")
                window.location.reload()
            } else {
                toast.error(res?.error || "Failed to disable 2FA")
            }
        })
    }

    return (
        <div className="relative z-10 space-y-10 max-w-full max-w-[1400px]">
            {/* Modern Aurora Background */}
            <div className="fixed top-[-20%] right-[-10%] w-full max-w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-30 animate-pulse" />
            <div className="fixed bottom-[-20%] left-[-10%] w-full max-w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-20" />

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2"
                    >
                        Security Center
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground"
                    >
                        Protect your account with Two-Factor Authentication.
                    </motion.p>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="relative overflow-x-auto no-scrollbar rounded-3xl bg-[#111]/60 backdrop-blur-md border border-white/[0.03] p-8">
                    <div className="flex items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">Two-Factor Authentication</h2>
                                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                            </div>
                        </div>
                        <Badge variant={enabled ? "default" : "secondary"} className={`font-medium px-3 py-1 text-sm ${enabled ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/20' : 'bg-white/10 text-muted-foreground hover:bg-white/20'}`}>
                            {enabled ? "Enabled" : "Disabled"}
                        </Badge>
                    </div>

                    <div className="space-y-6">
                        {enabled ? (
                            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
                                <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                                    <ShieldCheck className="h-8 w-8 text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-1">Your account is secure</h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    2FA is currently enabled for <span className="text-white font-medium">{user.email}</span>
                                </p>
                                <Button variant="destructive" onClick={onDisable} disabled={isPending} className="rounded-full px-6">
                                    {isPending ? "Processing..." : "Disable 2FA"}
                                </Button>
                            </div>
                        ) : (
                            <>
                                {!otpauthUrl ? (
                                    <div className="text-center py-8">
                                        <div className="mx-auto h-20 w-20 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6">
                                            <Lock className="h-10 w-10 text-cyan-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-white mb-2">Secure your account</h3>
                                        <p className="text-muted-foreground max-w-md mx-auto mb-8">
                                            Two-factor authentication adds an extra layer of security to your account by requiring more than just a password to log in.
                                        </p>
                                        <Button onClick={onGenerate} disabled={isPending} className="rounded-full bg-white text-black hover:bg-white/90 font-bold px-8 h-12">
                                            {isPending ? "Generating..." : "Setup 2FA"}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid gap-8 lg:grid-cols-2">
                                        <div className="space-y-6">
                                            <div className="flex items-start gap-4">
                                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">1</div>
                                                <div>
                                                    <h3 className="text-white font-medium mb-1">Scan QR Code</h3>
                                                    <p className="text-sm text-muted-foreground mb-4">
                                                        Use your authenticator app (Google Authenticator, Authy, etc.) to scan the QR code.
                                                    </p>
                                                    <div className="rounded-2xl bg-white p-4 inline-block">
                                                        <QRCodeSVG value={otpauthUrl} size={180} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-4">
                                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">2</div>
                                                <div>
                                                    <h3 className="text-white font-medium mb-1">Or Enter Code Manually</h3>
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        If you can't scan the QR code, enter this text code into your app.
                                                    </p>
                                                    <div className="rounded-xl bg-black/30 border border-white/10 p-3 font-mono text-sm text-center tracking-wider text-cyan-400 select-all">
                                                        {secret}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-start gap-4">
                                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">3</div>
                                                <div className="w-full">
                                                    <h3 className="text-white font-medium mb-1">Verify Code</h3>
                                                    <p className="text-sm text-muted-foreground mb-4">
                                                        Enter the 6-digit code from your authenticator app to enable 2FA.
                                                    </p>

                                                    <div className="space-y-4 max-w-sm">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="code" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Verification Code</Label>
                                                            <div className="relative">
                                                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                <Input
                                                                    id="code"
                                                                    value={code}
                                                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                                    inputMode="numeric"
                                                                    placeholder="000 000"
                                                                    maxLength={6}
                                                                    className="pl-10 rounded-xl border-white/10 bg-white/5 focus:border-cyan-500/50 focus:ring-0 text-white font-mono text-lg tracking-widest text-center h-12"
                                                                />
                                                            </div>
                                                        </div>
                                                        <Button onClick={onEnable} disabled={!canEnable || isPending} className="w-full rounded-full bg-white text-black hover:bg-white/90 font-bold h-12">
                                                            {isPending ? "Verifying..." : "Enable 2FA"}
                                                        </Button>
                                                        <Button onClick={() => { setSecret(null); setOtpauthUrl(null) }} variant="ghost" className="w-full rounded-full text-muted-foreground hover:text-white">
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
