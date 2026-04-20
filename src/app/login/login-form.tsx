"use client"

import { useActionState, useState, useEffect, Suspense } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginInput } from "@/lib/auth-schema"
import { login, verifyLogin2FAAction } from "@/app/actions/auth"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2, Mail, Lock, ArrowLeft, Eye, EyeOff, Zap, ShieldCheck, Globe } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"

function OAuthErrorHandler() {
    const searchParams = useSearchParams()

    useEffect(() => {
        const error = searchParams.get("error")
        const details = searchParams.get("details")
        const customMessage = searchParams.get("message")

        if (error) {
            let message = customMessage ? decodeURIComponent(customMessage) : ""

            if (!message) {
                const errorMessages: Record<string, string> = {
                    oauth_cancelled: "การเข้าสู่ระบบถูกยกเลิก",
                    oauth_failed: "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองอีกครั้ง",
                    token_exchange_failed: "เกิดข้อผิดพลาดในการยืนยันตัวตน",
                    user_info_failed: "ไม่สามารถดึงข้อมูลผู้ใช้ได้",
                    no_email: "ไม่พบอีเมลในบัญชี OAuth",
                    oauth_error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
                    network_error: "เกิดข้อผิดพลาดในการเชื่อมต่อ",
                    database_error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
                }
                message = errorMessages[error] || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ"
            }

            toast.error(message, {
                duration: 10000,
                description: details && !customMessage ? `รายละเอียด: ${details}` : undefined,
            })
        }
    }, [searchParams])

    return null
}

function LoginForm({ googleClientId, discordClientId }: { googleClientId?: string, discordClientId?: string }) {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(login, {})
    const [verifyState, verifyAction, isVerifying] = useActionState(verifyLogin2FAAction, {})
    const [showPassword, setShowPassword] = useState(false)
    const [requires2FA, setRequires2FA] = useState(false)

    useEffect(() => {
        router.prefetch("/")
    }, [router])

    useEffect(() => {
        if (state?.requires2FA) {
            setRequires2FA(true)
            toast.info("กรุณายืนยันตัวตน 2 ขั้นตอน (2FA)")
        }
    }, [state])

    const handleGoHome = () => {
        try {
            router.push("/")
            setTimeout(() => {
                if (typeof window !== "undefined" && window.location.pathname !== "/") {
                    window.location.assign("/")
                }
            }, 250)
        } catch {
            if (typeof window !== "undefined") {
                window.location.assign("/")
            }
        }
    }

    const form = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    return (
        <div className="min-h-screen w-full flex bg-black text-white selection:bg-white/20">
            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center p-6 sm:p-8 lg:p-16 xl:p-24 relative z-10 border-r border-white/5">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md mx-auto space-y-8"
                >
                    {/* Header */}
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={handleGoHome}
                            className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-all duration-200 mb-6 group"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            กลับหน้าหลัก
                        </button>
                        <div className="space-y-2">
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                                {requires2FA ? "ยืนยันตัวตน" : "ยินดีต้อนรับกลับ"}
                            </h1>
                            <p className="text-zinc-400 text-base leading-relaxed">
                                {requires2FA ? "กรุณากรอกรหัส 2FA 6 หลักจากแอป Authenticator" : "เข้าสู่ระบบเพื่อจัดการ Cloud Server ของคุณ"}
                            </p>
                        </div>
                    </div>

                    {/* Form Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="space-y-6"
                    >
                        <AnimatePresence mode="wait">
                            {requires2FA ? (
                                <motion.form
                                    key="2fa-form"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    action={verifyAction}
                                    className="space-y-6"
                                >
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="p-4 rounded-full bg-white/5 text-white mb-2 border border-white/10">
                                            <ShieldCheck className="h-10 w-10" />
                                        </div>

                                        <div className="space-y-2 text-center">
                                            <label className="text-sm font-medium leading-none text-zinc-300">
                                                รหัสยืนยัน (TOTP)
                                            </label>
                                            <div className="flex justify-center">
                                                <InputOTP maxLength={6} name="code">
                                                    <InputOTPGroup className="gap-2">
                                                        {[0, 1, 2, 3, 4, 5].map((index) => (
                                                            <InputOTPSlot 
                                                                key={index} 
                                                                index={index} 
                                                                className="h-12 w-12 rounded-md border border-white/10 bg-zinc-900/50 text-white" 
                                                            />
                                                        ))}
                                                    </InputOTPGroup>
                                                </InputOTP>
                                            </div>
                                        </div>
                                    </div>

                                    {verifyState?.error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center justify-center gap-2 font-medium text-center"
                                        >
                                            <span>{verifyState.error}</span>
                                        </motion.div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full h-12 text-base font-bold rounded-lg bg-white text-black hover:bg-zinc-200 transition-all duration-300"
                                        disabled={isVerifying}
                                    >
                                        {isVerifying ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                กำลังตรวจสอบ...
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck className="mr-2 h-5 w-5" />
                                                ยืนยันรหัส
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full text-zinc-400 hover:text-white"
                                        onClick={() => setRequires2FA(false)}
                                    >
                                        กลับไปหน้าเข้าสู่ระบบ
                                    </Button>
                                </motion.form>
                            ) : (
                                <motion.div
                                    key="login-form"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                >
                                    <Form {...form}>
                                        <form action={formAction} className="space-y-5">
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-zinc-300 font-medium text-sm">อีเมล</FormLabel>
                                                        <FormControl>
                                                            <div className="relative group">
                                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-white transition-colors duration-200 z-10" />
                                                                <Input
                                                                    placeholder="name@example.com"
                                                                    className="pl-12 h-12 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-white/30 focus:ring-0 rounded-lg transition-all duration-200"
                                                                    {...field}
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage className="text-red-400" />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="password"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <div className="flex items-center justify-between">
                                                            <FormLabel className="text-zinc-300 font-medium text-sm">รหัสผ่าน</FormLabel>
                                                        </div>
                                                        <FormControl>
                                                            <div className="relative group">
                                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-white transition-colors duration-200 z-10" />
                                                                <Input
                                                                    type={showPassword ? "text" : "password"}
                                                                    placeholder="••••••••"
                                                                    className="pl-12 pr-12 h-12 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-white/30 focus:ring-0 rounded-lg transition-all duration-200"
                                                                    {...field}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowPassword(!showPassword)}
                                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors focus:outline-none z-10"
                                                                >
                                                                    {showPassword ? (
                                                                        <EyeOff className="h-5 w-5" />
                                                                    ) : (
                                                                        <Eye className="h-5 w-5" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage className="text-red-400" />
                                                    </FormItem>
                                                )}
                                            />

                                            {state?.error && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-3 font-medium"
                                                >
                                                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500" />
                                                    {state.error}
                                                </motion.div>
                                            )}

                                            {/* Forgot password link */}
                                            <div className="flex justify-end">
                                                <Link
                                                    href="/forgot-password"
                                                    className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                                                >
                                                    ลืมรหัสผ่าน?
                                                </Link>
                                            </div>

                                            <Button
                                                type="submit"
                                                className="w-full h-12 text-base font-bold rounded-full bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-white/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-300"
                                                disabled={isPending}
                                            >
                                                {isPending ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                        กำลังเข้าสู่ระบบ...
                                                    </>
                                                ) : (
                                                    <>
                                                        เข้าสู่ระบบ
                                                    </>
                                                )}
                                            </Button>
                                        </form>
                                    </Form>

                                    <div className="relative py-4">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t border-white/10" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-black px-4 text-zinc-500 font-semibold">
                                                หรือเข้าสู่ระบบด้วย
                                            </span>
                                        </div>
                                    </div>

                                    {/* OAuth Buttons */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full h-12 rounded-lg border border-white/10 bg-zinc-900/30 text-white hover:bg-white/5 hover:text-white font-semibold"
                                            onClick={() => {
                                                window.location.href = "/api/auth/google/start"
                                            }}
                                        >
                                            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                                                <path
                                                    fill="currentColor"
                                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                />
                                                <path
                                                    fill="currentColor"
                                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                />
                                                <path
                                                    fill="currentColor"
                                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                />
                                                <path
                                                    fill="currentColor"
                                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                />
                                            </svg>
                                            Google
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full h-12 rounded-lg border border-white/10 bg-zinc-900/30 text-white hover:bg-white/5 hover:text-white font-semibold"
                                            onClick={() => {
                                                window.location.href = "/api/auth/discord/start"
                                            }}
                                        >
                                            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                                            </svg>
                                            Discord
                                        </Button>
                                    </div>

                                    <div className="text-center pt-2">
                                        <p className="text-zinc-400">
                                            ยังไม่มีบัญชี?{" "}
                                            <Link href="/register" className="font-bold text-white hover:underline transition-colors">
                                                สมัครสมาชิก
                                            </Link>
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            </div>

            {/* Right Side - Visuals */}
            <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-black">
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-45 scale-105"
                  style={{ backgroundImage: 'url("/images/world-blackground.jpg")', filter: "brightness(1.35) contrast(1.25)" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/75" />

                {/* Content */}
                <div className="relative h-full flex flex-col justify-center p-12 xl:p-20 text-white z-10">
                    <div className="space-y-12 max-w-lg mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="space-y-6"
                        >
                            <h2 className="text-5xl xl:text-6xl font-bold leading-tight tracking-tighter">
                                ENTERPRISE
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-white">
                                    CLOUD
                                </span>
                            </h2>
                            <p className="text-xl text-zinc-300 leading-relaxed">
                                High-performance cloud infrastructure for mission-critical applications.
                            </p>
                        </motion.div>

                        {/* Feature Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="p-6 rounded-xl bg-zinc-900/50 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-300"
                            >
                                <Zap className="h-8 w-8 text-white mb-4" />
                                <h3 className="font-bold text-lg mb-1">NVMe Storage</h3>
                                <p className="text-sm text-zinc-300">
                                    Ultra-fast read/write speeds
                                </p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                                className="p-6 rounded-xl bg-zinc-900/50 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-300"
                            >
                                <Globe className="h-8 w-8 text-white mb-4" />
                                <h3 className="font-bold text-lg mb-1">Global Edge</h3>
                                <p className="text-sm text-zinc-300">
                                    Deployed worldwide
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function LoginFormClient({ googleClientId, discordClientId }: { googleClientId?: string, discordClientId?: string }) {
    return (
        <Suspense fallback={null}>
            <OAuthErrorHandler />
            <LoginForm googleClientId={googleClientId} discordClientId={discordClientId} />
        </Suspense>
    )
}
