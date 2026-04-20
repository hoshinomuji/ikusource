"use client"

import { useState } from "react"
import Link from "next/link"
import { requestPasswordReset } from "@/app/actions/reset-password"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Mail, ArrowLeft, Send, ShieldCheck, Lock } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSent, setIsSent] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!email) {
            toast.error("กรุณาระบุอีเมล")
            return
        }

        setIsLoading(true)
        try {
            const result = await requestPasswordReset(email)
            if (result.success) {
                setIsSent(true)
                toast.success("ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลเรียบร้อยแล้ว")
            } else {
                toast.error(result.error || "เกิดข้อผิดพลาดในการส่งอีเมล")
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ")
        } finally {
            setIsLoading(false)
        }
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
                        <Link
                            href="/login"
                            className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-all duration-200 mb-6 group"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            กลับหน้าเข้าสู่ระบบ
                        </Link>
                        <div className="space-y-2">
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                                ลืมรหัสผ่าน?
                            </h1>
                            <p className="text-zinc-400 text-base leading-relaxed">
                                ไม่ต้องกังวล เราจะส่งขั้นตอนการตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณ
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
                        {isSent ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8 space-y-6 bg-zinc-900/30 rounded-xl border border-white/5 p-8"
                            >
                                <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                                    <Send className="w-8 h-8" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white">ตรวจสอบอีเมลของคุณ</h3>
                                    <p className="text-zinc-400">
                                        เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปที่<br />
                                        <span className="font-medium text-white">{email}</span>
                                    </p>
                                </div>
                                <div className="pt-4 space-y-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsSent(false)}
                                        className="w-full h-12 rounded-lg border-white/10 text-white hover:bg-white/5 hover:text-white"
                                    >
                                        ลองระบุอีเมลอื่น
                                    </Button>
                                    <p className="text-sm text-zinc-500">
                                        ไม่ได้รับอีเมล? <span className="text-white cursor-pointer hover:underline font-medium" onClick={handleSubmit}>ส่งอีกครั้ง</span>
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-zinc-300 font-medium text-sm">อีเมล</Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-white transition-colors duration-200 z-10" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@example.com"
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
                                        "ส่งลิงก์รีเซ็ตรหัสผ่าน"
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
                                SECURE
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-white">
                                    ACCESS
                                </span>
                            </h2>
                            <p className="text-xl text-zinc-400 leading-relaxed font-light">
                                Recover your account securely and get back to managing your infrastructure.
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
                                <Lock className="h-8 w-8 text-white mb-4" />
                                <h3 className="font-bold text-lg mb-1">Encrypted</h3>
                                <p className="text-sm text-zinc-400">
                                    End-to-end security
                                </p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                                className="p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-300"
                            >
                                <ShieldCheck className="h-8 w-8 text-white mb-4" />
                                <h3 className="font-bold text-lg mb-1">Verified</h3>
                                <p className="text-sm text-zinc-400">
                                    Secure verification
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

