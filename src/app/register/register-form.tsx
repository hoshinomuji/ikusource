"use client"

import { useActionState, useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema, type RegisterInput } from "@/lib/auth-schema"
import { register } from "@/app/actions/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2, Mail, Lock, User, ArrowLeft, Phone, Eye, EyeOff, Check, ShieldCheck, Rocket, Globe, Sparkles, Send } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

export default function RegisterPage() {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(register, {})
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordStrength, setPasswordStrength] = useState(0)


    const form = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
        },
    })



    const calculateStrength = (password: string) => {
        let strength = 0
        if (password.length >= 8) strength += 25
        if (password.match(/[A-Z]/)) strength += 25
        if (password.match(/[0-9]/)) strength += 25
        if (password.match(/[^A-Za-z0-9]/)) strength += 25
        setPasswordStrength(strength)
    }

    const getStrengthColor = (strength: number) => {
        if (strength <= 25) return "bg-red-500"
        if (strength <= 50) return "bg-orange-500"
        if (strength <= 75) return "bg-yellow-500"
        return "bg-green-500"
    }

    const getStrengthText = (strength: number) => {
        if (strength <= 25) return "Weak"
        if (strength <= 50) return "Fair"
        if (strength <= 75) return "Good"
        return "Strong"
    }

    useEffect(() => {
        router.prefetch("/")
    }, [router])

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

    return (
        <div className="min-h-screen w-full flex bg-black text-white selection:bg-white/20">
            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center p-6 sm:p-8 lg:p-16 xl:p-24 relative z-10 border-r border-white/5 overflow-y-auto">
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
                                สร้างบัญชีใหม่
                            </h1>
                            <p className="text-zinc-400 text-base leading-relaxed">
                                เริ่มต้นใช้งาน Cloud Server ประสิทธิภาพสูง
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
                        <Form {...form}>
                            <form action={formAction} className="space-y-5">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-zinc-300 font-medium text-sm">ชื่อ-นามสกุล</FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-white transition-colors duration-200 z-10" />
                                                    <Input
                                                        placeholder="John Doe"
                                                        className="pl-12 h-12 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-white/30 focus:ring-0 rounded-lg transition-all duration-200"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-red-400" />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-2">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-zinc-300 font-medium text-sm">อีเมล</FormLabel>
                                                <FormControl>
                                                    <div className="flex gap-2">
                                                        <div className="relative group flex-1">
                                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-white transition-colors duration-200 z-10" />
                                                            <Input
                                                                placeholder="name@example.com"
                                                                className="pl-12 h-12 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-white/30 focus:ring-0 rounded-lg transition-all duration-200"
                                                                {...field}
                                                            />
                                                        </div>
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-red-400" />
                                            </FormItem>
                                        )}
                                    />

                                </div>

                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-zinc-300 font-medium text-sm">เบอร์โทรศัพท์</FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-white transition-colors duration-200 z-10" />
                                                    <Input
                                                        placeholder="0812345678"
                                                        className="pl-12 h-12 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-white/30 focus:ring-0 rounded-lg transition-all duration-200"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-red-400" />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-zinc-300 font-medium text-sm">รหัสผ่าน</FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-white transition-colors duration-200 z-10" />
                                                        <Input
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="••••••••"
                                                            className="pl-12 pr-12 h-12 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-white/30 focus:ring-0 rounded-lg transition-all duration-200"
                                                            {...field}
                                                            onChange={(e) => {
                                                                field.onChange(e)
                                                                calculateStrength(e.target.value)
                                                            }}
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

                                    <FormField
                                        control={form.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-zinc-300 font-medium text-sm">ยืนยันรหัสผ่าน</FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-white transition-colors duration-200 z-10" />
                                                        <Input
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            placeholder="••••••••"
                                                            className="pl-12 pr-12 h-12 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-white/30 focus:ring-0 rounded-lg transition-all duration-200"
                                                            {...field}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors focus:outline-none z-10"
                                                        >
                                                            {showConfirmPassword ? (
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
                                </div>

                                {/* Password Strength Indicator */}
                                {form.watch("password") && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-3 bg-zinc-900/30 p-5 rounded-lg border border-white/5"
                                    >
                                        <div className="flex items-center justify-between text-xs">
                                            <span className={`font-bold ${passwordStrength > 50 ? "text-green-500" : passwordStrength > 25 ? "text-orange-500" : "text-red-500"}`}>
                                                ความปลอดภัย: {getStrengthText(passwordStrength) === "Weak" ? "อ่อนแอ" : getStrengthText(passwordStrength) === "Fair" ? "ปานกลาง" : getStrengthText(passwordStrength) === "Good" ? "ดี" : "แข็งแกร่ง"}
                                            </span>
                                            <span className="text-zinc-400 font-mono">{passwordStrength}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${passwordStrength}%` }}
                                                className={`h-full ${getStrengthColor(passwordStrength)} rounded-full`}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                                            <div className="flex items-center gap-2">
                                                {form.watch("password").length >= 8 ? (
                                                    <Check className="h-3 w-3 text-green-500" />
                                                ) : (
                                                    <div className="h-3 w-3 rounded-full border border-zinc-600" />
                                                )}
                                                <span>8+ ตัวอักษร</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {form.watch("password").match(/[A-Z]/) ? (
                                                    <Check className="h-3 w-3 text-green-500" />
                                                ) : (
                                                    <div className="h-3 w-3 rounded-full border border-zinc-600" />
                                                )}
                                                <span>ตัวพิมพ์ใหญ่</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {form.watch("password").match(/[0-9]/) ? (
                                                    <Check className="h-3 w-3 text-green-500" />
                                                ) : (
                                                    <div className="h-3 w-3 rounded-full border border-zinc-600" />
                                                )}
                                                <span>ตัวเลข</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {form.watch("password").match(/[^A-Za-z0-9]/) ? (
                                                    <Check className="h-3 w-3 text-green-500" />
                                                ) : (
                                                    <div className="h-3 w-3 rounded-full border border-zinc-600" />
                                                )}
                                                <span>อักขระพิเศษ</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

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

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base font-bold rounded-full bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-white/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-300"
                                    disabled={isPending}
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            กำลังสร้างบัญชี...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-5 w-5" />
                                            สร้างบัญชี
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </motion.div>

                    <div className="text-center">
                        <p className="text-zinc-400">
                            มีบัญชีอยู่แล้ว?{" "}
                            <Link href="/login" className="font-bold text-white hover:underline transition-colors">
                                เข้าสู่ระบบ
                            </Link>
                        </p>
                    </div>
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
                                JOIN THE
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-white">
                                    FUTURE
                                </span>
                            </h2>
                            <p className="text-xl text-zinc-300 leading-relaxed">
                                Scalable, secure, and ready for your next big idea.
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
                                <Rocket className="h-8 w-8 text-white mb-4" />
                                <h3 className="font-bold text-lg mb-1">Instant Setup</h3>
                                <p className="text-sm text-zinc-300">
                                    Deploy in seconds
                                </p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                                className="p-6 rounded-xl bg-zinc-900/50 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-300"
                            >
                                <ShieldCheck className="h-8 w-8 text-white mb-4" />
                                <h3 className="font-bold text-lg mb-1">DDoS Protection</h3>
                                <p className="text-sm text-zinc-300">
                                    Always-on security
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
