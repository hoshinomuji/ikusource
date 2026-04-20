"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Building2, Smartphone, Receipt, Wallet, ArrowUpRight, ArrowDownLeft, Clock, Upload, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { redeemTrueMoneyVoucher, verifySlip } from "@/app/actions/wallet"

function toAmount(value: unknown) {
    if (typeof value === "number") return value
    if (typeof value === "string") {
        const parsed = Number(value.replace(/,/g, ""))
        return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
}

function fmtMoney(v: unknown) {
    const amount = toAmount(v)
    if (!Number.isFinite(amount)) return "0.00"
    return new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}

function fmtDate(v: unknown) {
    if (!v) return "-"
    const d = new Date(v as any)
    if (Number.isNaN(d.getTime())) return "-"
    return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d)
}

export function WalletClient({
    balance,
    transactions,
    defaultPhone,
    truemoneyEnabled,
    accountName,
    bankName,
    bankAccount,
}: {
    balance: number
    transactions: any[]
    defaultPhone?: string
    truemoneyEnabled?: boolean
    accountName?: string
    bankName?: string
    bankAccount?: string
}) {
    const router = useRouter()
    const [localBalance, setLocalBalance] = useState(balance)
    const [voucherLink, setVoucherLink] = useState("")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [selectedFilePreviewUrl, setSelectedFilePreviewUrl] = useState<string | null>(null)
    const [selectedFileAt, setSelectedFileAt] = useState<Date | null>(null)
    const [isPending, startTransition] = useTransition()
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
        if (!selectedFile) {
            setSelectedFilePreviewUrl(null)
            return
        }
        const objectUrl = URL.createObjectURL(selectedFile)
        setSelectedFilePreviewUrl(objectUrl)
        return () => URL.revokeObjectURL(objectUrl)
    }, [selectedFile])

    const handleTrueMoneySubmit = () => {
        if (!voucherLink.trim()) {
            toast.error("กรุณากรอกลิงก์ซอง TrueMoney")
            return
        }

        startTransition(async () => {
            const result = await redeemTrueMoneyVoucher(voucherLink.trim())
            if (result.success) {
                toast.success(result.message || "เติมเงินผ่าน TrueMoney สำเร็จ")
                setVoucherLink("")
                router.refresh()
            } else {
                toast.error(result.message || "ไม่สามารถเติมเงินผ่าน TrueMoney ได้")
            }
        })
    }

    const handleBankSlipSubmit = () => {
        if (!selectedFile) {
            toast.error("กรุณาเลือกไฟล์สลิป")
            return
        }

        startTransition(async () => {
            const formData = new FormData()
            formData.append("file", selectedFile)

            const result = await verifySlip(formData)
            if (result.success) {
                toast.success(result.message || "ตรวจสอบสลิปสำเร็จ")
                if (typeof result.newBalance === "number") {
                    setLocalBalance(result.newBalance)
                }
                setSelectedFile(null)
                setSelectedFileAt(null)
                if (fileInputRef.current) fileInputRef.current.value = ""
                router.refresh()
            } else {
                toast.error(result.message || "ไม่สามารถตรวจสอบสลิปได้")
            }
        })
    }

    return (
        <div className="relative z-10 space-y-10 max-w-full max-w-[1400px]">
            <div className="fixed top-[-20%] right-[-10%] w-full max-w-[600px] h-[600px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-30 animate-pulse" />
            <div className="fixed bottom-[-20%] left-[-10%] w-full max-w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-20" />

            <div>
                <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
                    Topup
                </motion.h1>
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-muted-foreground">
                    เลือกช่องทางเติมเงินและตรวจสอบประวัติรายการ
                </motion.p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-1 relative overflow-x-auto no-scrollbar rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 p-8 shadow-2xl shadow-indigo-500/10"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-20">
                        <Wallet className="w-24 h-24 text-white" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <p className="text-sm font-medium text-white/60 mb-1 uppercase tracking-wider">Current Balance</p>
                            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">฿{fmtMoney(localBalance)}</h2>
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/10">
                            <div className="flex items-center gap-2 text-sm text-white/60">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                                Wallet Active
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
                    <div className="rounded-2xl bg-[#111]/60 backdrop-blur-md border border-white/[0.03] p-5">
                        <h3 className="text-lg font-semibold text-white mb-4">เลือกช่องทางเติมเงิน</h3>

                        <Tabs defaultValue="banking" className="gap-4">
                            <TabsList className="bg-black/30 border border-white/10 p-1">
                                <TabsTrigger value="banking" className="data-[state=active]:bg-white/10">
                                    <Building2 className="h-4 w-4 mr-1" />
                                    Banking
                                </TabsTrigger>
                                <TabsTrigger value="truemoney" className="data-[state=active]:bg-white/10">
                                    <Smartphone className="h-4 w-4 mr-1" />
                                    TrueMoney Wallet
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="banking" className="space-y-4">
                                <div className="space-y-2 text-sm text-muted-foreground bg-black/20 p-4 rounded-xl border border-white/5 font-mono">
                                    <div className="flex justify-between">
                                        <span>Bank:</span>
                                        <span className="text-white">{bankName || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Account:</span>
                                        <span className="text-white">{bankAccount || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Name:</span>
                                        <span className="text-white">{accountName || "-"}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-white">อัปโหลดสลิปโอนเงิน</Label>
                                    <Input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] || null
                                            setSelectedFile(file)
                                            setSelectedFileAt(file ? new Date() : null)
                                        }}
                                        className="bg-black/20 border-white/10 text-white file:text-white"
                                    />
                                    {selectedFile && (
                                        <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                                            <p className="text-xs text-muted-foreground">ไฟล์: <span className="text-white">{selectedFile.name}</span></p>
                                            <p className="text-xs text-muted-foreground">เวลาอัปโหลด: <span className="text-white">{selectedFileAt ? fmtDate(selectedFileAt) : "-"}</span></p>
                                            {selectedFilePreviewUrl && (
                                                <img
                                                    src={selectedFilePreviewUrl}
                                                    alt="Slip preview"
                                                    className="w-full max-h-72 object-contain rounded-lg border border-white/10 bg-black/30"
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-xl border border-dashed border-white/20 bg-black/20 p-3 space-y-2">
                                    <p className="text-sm font-medium text-white">ตัวอย่างสลิปที่แนะนำ</p>
                                    <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-3 text-xs text-muted-foreground space-y-1">
                                        <p>1. ชื่อผู้รับต้องเป็นบัญชีที่ตั้งไว้ในระบบ</p>
                                        <p>2. จำนวนเงินและวันเวลาต้องอ่านได้ชัดเจน</p>
                                        <p>3. ไม่ครอปจนตัดข้อมูลสำคัญ</p>
                                    </div>
                                </div>

                                <Button onClick={handleBankSlipSubmit} disabled={isPending || !selectedFile} className="w-full">
                                    {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                    ตรวจสอบสลิปและเติมเงิน
                                </Button>
                            </TabsContent>

                            <TabsContent value="truemoney" className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">สถานะระบบ</span>
                                    <Badge
                                        variant="default"
                                        className={truemoneyEnabled ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-0" : "bg-zinc-500/20 text-zinc-300 border-0"}
                                    >
                                        {truemoneyEnabled ? "พร้อมใช้งาน" : "ปิดใช้งาน"}
                                    </Badge>
                                </div>

                                <div className="p-3 bg-black/20 rounded-xl border border-white/5 flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">เบอร์รับซอง</span>
                                    <span className="text-sm font-mono text-white">{defaultPhone || "-"}</span>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-white">ลิงก์ซองของขวัญ TrueMoney</Label>
                                    <Input
                                        value={voucherLink}
                                        onChange={(e) => setVoucherLink(e.target.value)}
                                        placeholder="https://gift.truemoney.com/campaign/?v=..."
                                        className="bg-black/20 border-white/10 text-white"
                                        disabled={!truemoneyEnabled}
                                    />
                                </div>

                                <Button onClick={handleTrueMoneySubmit} disabled={isPending || !truemoneyEnabled} className="w-full">
                                    {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Smartphone className="h-4 w-4 mr-2" />}
                                    เติมเงินด้วย TrueMoney
                                </Button>
                            </TabsContent>
                        </Tabs>
                    </div>
                </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-muted-foreground" />
                        Transaction History
                    </h3>
                </div>

                <div className="space-y-3">
                    {transactions.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center bg-white/[0.02]">
                            <div className="mx-auto h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                <Receipt className="h-6 w-6 text-muted-foreground opacity-50" />
                            </div>
                            <p className="text-sm text-muted-foreground">No transactions found.</p>
                        </div>
                    ) : (
                        transactions.map((t, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * i }}
                                key={t.id}
                                className="group relative overflow-x-auto no-scrollbar rounded-2xl bg-[#111]/40 backdrop-blur-sm border border-white/[0.03] p-4 transition-all duration-300 hover:bg-white/[0.05]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border ${toAmount(t.amount) > 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"}`}>
                                        {toAmount(t.amount) > 0 ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-medium text-white truncate">{t.type}</p>
                                            <p className={`font-mono font-bold ${toAmount(t.amount) > 0 ? "text-emerald-400" : "text-white"}`}>
                                                {toAmount(t.amount) > 0 ? "+" : ""}
                                                {fmtMoney(t.amount)}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <p>{t.description || "No description"}</p>
                                            <div className="flex items-center gap-1 opacity-70">
                                                <Clock className="w-3 h-3" />
                                                {fmtDate(t.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    )
}
