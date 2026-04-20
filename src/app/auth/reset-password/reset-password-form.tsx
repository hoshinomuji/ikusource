"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { resetPassword } from "@/app/actions/reset-password"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Lock, ArrowLeft, CheckCircle2, Eye, EyeOff, ShieldCheck, Key } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"

export default function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!token) {
            toast.error("ลิงก์ไม่ถูกต้อง")
            return
        }

        if (password.length < 6) {
            toast.error("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร")
            return
        }

        if (password !== confirmPassword) {
            toast.error("รหัสผ่านไม่ตรงกัน")
            return
        }

        setIsLoading(true)
        try {
            const result = await resetPassword(token, password)
            if (result.success) {
                setIsSuccess(true)
                toast.success("เปลี่ยนรหัสผ่านสำเร็จ")
                setTimeout(() => {
                    router.push("/login")
                }, 3000)
            } else {
                toast.error(result.error || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน")
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ")
        } finally {
            setIsLoading(false)
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-black p-4 text-white">
                <div className="max-w-md w-full text-center space-y-6 bg-zinc-900/50 p-8 rounded-2xl border border-white/10">
                    <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                        <Lock className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold">ลิงก์ไม่ถูกต้อง</h1>
                        <p className="text-zinc-400">ลิงก์สำหรับรีเซ็ตรหัสผ่านไม่ถูกต้อง หรือคุณอาจมาผิดทาง</p>
                    </div>
                    <Button asChild variant="default" className="w-full bg-white text-black hover:bg-zinc-200 font-bold">
                        <Link href="/login">กลับหน้าเข้าสู่ระบบ</Link>
                    </Button>
                </div>
            </div>
        )
    }

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
                        {isSuccess ? null : (
                            <Link
                                href="/login"
                                className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-all duration-200 mb-6 group"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                                ยกเลิก
                            </Link>
                        )}
                        <div className="space-y-2">
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                                {isSuccess ? "เสร็จเรียบร้อย" : "ตั้งรหัสผ่านใหม่"}
                            </h1>
                            <p className="text-zinc-400 text-base leading-relaxed">
                                {isSuccess ? "รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว" : "กรุณากำหนดรหัสผ่านใหม่เพื่อเข้าใช้งาน"}
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
                        {isSuccess ? (
                            <div className="text-center py-8 space-y-6 bg-zinc-900/30 rounded-xl border border-white/5 p-8">
                                <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white">เปลี่ยนรหัสผ่านสำเร็จ</h3>
                                    <p className="text-zinc-400">
                                        กำลังพากลับไปหน้าเข้าสู่ระบบ...
                                    </p>
                                </div>
                                <Button asChild className="w-full h-12 rounded-lg bg-white text-black hover:bg-zinc-200 font-bold mt-4">
                                    <Link href="/login">เข้าสู่ระบบทันที</Link>
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-zinc-300 font-medium text-sm">รหัสผ่านใหม่</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-white transition-colors duration-200 z-10" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                                            className="pl-12 pr-12 h-12 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-white/30 focus:ring-0 rounded-lg transition-all duration-200"
                                            required
                                            minLength={6}
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
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-zinc-300 font-medium text-sm">ยืนยันรหัสผ่านใหม่</Label>
                                    <div className="relative group">
                                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-white transition-colors duration-200 z-10" />
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                                            className="pl-12 h-12 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-white/30 focus:ring-0 rounded-lg transition-all duration-200"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base font-bold rounded-lg bg-white text-black hover:bg-zinc-200 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            กำลังดำเนินการ...
                                        </>
                                    ) : (
                                        "เปลี่ยนรหัสผ่าน"
                                    )}
                                </Button>
                            </form>
                        )}
                    </motion.div>
                </motion.div>
            </div>

            {/* Right Side - Visuals */}
            <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-black">
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105"
                  style={{ backgroundImage: 'url("/images/world-blackground.jpg")' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-80" />

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
                                NEW
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-white">
                                    BEGINNING
                                </span>
                            </h2>
                            <p className="text-xl text-zinc-400 leading-relaxed font-light">
                                Secure your account with a strong password and get back in action.
                            </p>
                        </motion.div>

                        {/* Feature Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-300"
                            >
                                <Key className="h-8 w-8 text-white mb-4" />
                                <h3 className="font-bold text-lg mb-1">Secure</h3>
                                <p className="text-sm text-zinc-400">
                                    Strong encryption
                                </p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                                className="p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-300"
                            >
                                <Lock className="h-8 w-8 text-white mb-4" />
                                <h3 className="font-bold text-lg mb-1">Protected</h3>
                                <p className="text-sm text-zinc-400">
                                    Account safety
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
