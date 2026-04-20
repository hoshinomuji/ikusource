"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Settings,
    Clock,
    Loader2,
    Check,
    Zap,
    AlertTriangle,
    Wallet,
    CreditCard,
    Globe,
    Image as ImageIcon,
    MessageSquare,
    Sparkles,
    Copy,
    Info,
    Mail,
    Hash,
    User,
    Lock,
    ShieldCheck,
    Server,
    ChevronRight,
} from "lucide-react"
import { useEffect } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { saveCronSettings, savePaymentSettings, saveWebsiteSettings, saveLandingPageSettings, saveDiscordSettings, saveOAuthSettings, saveEmailSettings, testDiscordWebhook, testEmailSettings } from "@/app/actions/settings"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CronSettings {
    cronSecret: string | null
    autoSuspendEnabled: boolean
    suspendGraceDays: number
    checkIntervalMinutes?: number
}

interface PaymentSettings {
    truemoneyDefaultPhone: string
    truemoneyEnabled: boolean
    slipVerifyReceiverNameTh: string
    slipVerifyReceiverNameEn: string
    bankName: string
    bankAccountNumber: string
}

interface WebsiteSettings {
    logoUrl: string
    storeName: string
    websiteTitle: string
    description: string
}

interface LandingPageSettings {
    selectedPackage1: number | null
    selectedPackage2: number | null
    selectedPackage3: number | null
    selectedPackage4: number | null
    comparisonTableCategoryId: number | null
}


interface DiscordSettings {
    webhookUrl: string
    notifyRegister: boolean
    notifyTopup: boolean
    notifyOrder: boolean
}

interface OAuthSettings {
    googleClientId: string
    googleClientSecret: string
    discordClientId: string
    discordClientSecret: string
}

interface EmailSettings {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPass: string
    smtpFrom: string
    smtpSenderName: string
    smtpSecure: boolean
}

// Common styles
const inputClass = "h-11 rounded-xl bg-[#111]/80 border-white/5 text-white focus:bg-white/10 transition-all shadow-inner"
const selectTriggerClass = "h-11 w-full rounded-xl border border-white/5 bg-[#111]/80 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all shadow-inner hover:bg-white/5"
const selectContentClass = "bg-[#111]/95 border-white/5 text-white backdrop-blur-xl"
const selectItemClass = "text-white/80 focus:bg-white/10 focus:text-white cursor-pointer"

export function AdminSettingsClient({
    cronSettings,
    paymentSettings,
    websiteSettings,
    landingPageSettings,
    discordSettings,
    oauthSettings,
    emailSettings,
    packages,
    categories,
}: {
    cronSettings: CronSettings
    paymentSettings: PaymentSettings
    websiteSettings: WebsiteSettings
    landingPageSettings: LandingPageSettings
    discordSettings: DiscordSettings
    oauthSettings: OAuthSettings
    emailSettings: EmailSettings
    packages: any[]
    categories: any[]
}) {
    const [origin, setOrigin] = useState((process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, ""))

    useEffect(() => {
        if (typeof window !== "undefined") {
            setOrigin(window.location.origin)
        }
    }, [])

    // Cron settings state
    const [autoSuspendEnabled, setAutoSuspendEnabled] = useState(cronSettings?.autoSuspendEnabled || false)
    const [suspendGraceDays, setSuspendGraceDays] = useState(cronSettings?.suspendGraceDays?.toString() || "0")
    const [checkIntervalMinutes, setCheckIntervalMinutes] = useState(cronSettings?.checkIntervalMinutes?.toString() || "60")
    const [isSavingCron, setIsSavingCron] = useState(false)

    // Email settings state
    const [smtpHost, setSmtpHost] = useState(emailSettings?.smtpHost || "")
    const [smtpPort, setSmtpPort] = useState(emailSettings?.smtpPort?.toString() || "587")
    const [smtpUser, setSmtpUser] = useState(emailSettings?.smtpUser || "")
    const [smtpPass, setSmtpPass] = useState(emailSettings?.smtpPass || "")
    const [smtpFrom, setSmtpFrom] = useState(emailSettings?.smtpFrom || "")
    const [smtpSenderName, setSmtpSenderName] = useState(emailSettings?.smtpSenderName || "")
    const [smtpSecure, setSmtpSecure] = useState(emailSettings?.smtpSecure || false)
    const [testEmail, setTestEmail] = useState("")
    const [isTestingEmail, setIsTestingEmail] = useState(false)
    const [isSavingEmail, setIsSavingEmail] = useState(false)

    // Payment settings state
    const [truemoneyEnabled, setTruemoneyEnabled] = useState(paymentSettings?.truemoneyEnabled || false)
    const [truemoneyPhone, setTruemoneyPhone] = useState(paymentSettings?.truemoneyDefaultPhone || "")
    const [slipVerifyReceiverNameTh, setSlipVerifyReceiverNameTh] = useState(paymentSettings?.slipVerifyReceiverNameTh || "")
    const [slipVerifyReceiverNameEn, setSlipVerifyReceiverNameEn] = useState(paymentSettings?.slipVerifyReceiverNameEn || "")
    const [bankName, setBankName] = useState(paymentSettings?.bankName || "")
    const [bankAccountNumber, setBankAccountNumber] = useState(paymentSettings?.bankAccountNumber || "")
    const [isSavingPayment, setIsSavingPayment] = useState(false)

    // Website settings state
    const [logoUrl, setLogoUrl] = useState(websiteSettings?.logoUrl || "")
    const [storeName, setStoreName] = useState(websiteSettings?.storeName || "")
    const [websiteTitle, setWebsiteTitle] = useState(websiteSettings?.websiteTitle || "")
    const [websiteDescription, setWebsiteDescription] = useState(websiteSettings?.description || "")
    const [isSavingWebsite, setIsSavingWebsite] = useState(false)

    // Landing page settings state
    const [selectedPackage1, setSelectedPackage1] = useState<string>(landingPageSettings?.selectedPackage1?.toString() || "none")
    const [selectedPackage2, setSelectedPackage2] = useState<string>(landingPageSettings?.selectedPackage2?.toString() || "none")
    const [selectedPackage3, setSelectedPackage3] = useState<string>(landingPageSettings?.selectedPackage3?.toString() || "none")
    const [selectedPackage4, setSelectedPackage4] = useState<string>(landingPageSettings?.selectedPackage4?.toString() || "none")
    const [comparisonTableCategoryId, setComparisonTableCategoryId] = useState<string>(landingPageSettings?.comparisonTableCategoryId?.toString() || "none")
    const [isSavingLanding, setIsSavingLanding] = useState(false)

    // OAuth settings state
    const [googleClientId, setGoogleClientId] = useState(oauthSettings?.googleClientId || "")
    const [googleClientSecret, setGoogleClientSecret] = useState(oauthSettings?.googleClientSecret || "")
    const [discordClientId, setDiscordClientId] = useState(oauthSettings?.discordClientId || "")
    const [discordClientSecret, setDiscordClientSecret] = useState(oauthSettings?.discordClientSecret || "")
    const [isSavingOAuth, setIsSavingOAuth] = useState(false)

    // Discord settings state
    const [discordWebhookUrl, setDiscordWebhookUrl] = useState(discordSettings?.webhookUrl || "")
    const [discordNotifyRegister, setDiscordNotifyRegister] = useState(discordSettings?.notifyRegister || false)
    const [discordNotifyTopup, setDiscordNotifyTopup] = useState(discordSettings?.notifyTopup || false)
    const [discordNotifyOrder, setDiscordNotifyOrder] = useState(discordSettings?.notifyOrder || false)
    const [isTestingWebhook, setIsTestingWebhook] = useState(false)
    const [isSavingDiscord, setIsSavingDiscord] = useState(false)

    // SaveButton component
    const SaveButton = ({ onClick, isLoading, gradient }: { onClick: () => void; isLoading: boolean; gradient: string }) => (
        <Button
            onClick={onClick}
            disabled={isLoading}
            className={`rounded-xl h-12 bg-gradient-to-r ${gradient} text-white hover:opacity-90 shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50 w-full md:w-auto px-8 font-medium hover:scale-105 active:scale-95`}
        >
            {isLoading ? (
                <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    กำลังบันทึก...
                </>
            ) : (
                <>
                    <Check className="h-5 w-5 mr-2" />
                    บันทึก
                </>
            )}
        </Button>
    )

    const handleTestEmail = async () => {
        if (!testEmail) {
            toast.error("กรุณากรอกอีเมลสำหรับทดสอบ")
            return
        }

        setIsTestingEmail(true)
        try {
            const result = await testEmailSettings(testEmail)
            if (result.success) {
                toast.success("ส่งอีเมลทดสอบสำเร็จ กรุณาตรวจสอบกล่องจดหมาย")
            } else {
                toast.error(result.error || "ไม่สามารถส่งอีเมลทดสอบได้")
            }
        } catch {
            toast.error("เกิดข้อผิดพลาดในการส่งอีเมลทดสอบ")
        } finally {
            setIsTestingEmail(false)
        }
    }

    const handleSaveEmailSettings = async () => {
        setIsSavingEmail(true)
        try {
            const result = await saveEmailSettings({
                smtpHost,
                smtpPort: parseInt(smtpPort) || 587,
                smtpUser,
                smtpPass,
                smtpFrom,
                smtpSenderName,
                smtpSecure,
            })
            if (result.success) toast.success("บันทึกการตั้งค่าอีเมลสำเร็จ")
            else toast.error(result.error || "ไม่สามารถบันทึกได้")
        } catch {
            toast.error("เกิดข้อผิดพลาด")
        } finally {
            setIsSavingEmail(false)
        }
    }

    const handleSavePaymentSettings = async () => {
        setIsSavingPayment(true)
        try {
            const result = await savePaymentSettings({
                truemoneyDefaultPhone: truemoneyPhone,
                truemoneyEnabled,
                slipVerifyReceiverNameTh,
                slipVerifyReceiverNameEn,
                bankName,
                bankAccountNumber,
            })
            if (result.success) toast.success("บันทึกการตั้งค่าชำระเงินสำเร็จ")
            else toast.error(result.error || "ไม่สามารถบันทึกได้")
        } catch {
            toast.error("เกิดข้อผิดพลาด")
        } finally {
            setIsSavingPayment(false)
        }
    }

    const handleSaveWebsiteSettings = async () => {
        setIsSavingWebsite(true)
        try {
            const result = await saveWebsiteSettings({
                logoUrl,
                storeName,
                websiteTitle,
                description: websiteDescription,
            })
            if (result.success) toast.success("บันทึกการตั้งค่าเว็บไซต์สำเร็จ")
            else toast.error(result.error || "ไม่สามารถบันทึกได้")
        } catch {
            toast.error("เกิดข้อผิดพลาด")
        } finally {
            setIsSavingWebsite(false)
        }
    }

    const handleSaveLandingPageSettings = async () => {
        setIsSavingLanding(true)
        try {
            const result = await saveLandingPageSettings({
                selectedPackage1: selectedPackage1 === "none" ? null : parseInt(selectedPackage1),
                selectedPackage2: selectedPackage2 === "none" ? null : parseInt(selectedPackage2),
                selectedPackage3: selectedPackage3 === "none" ? null : parseInt(selectedPackage3),
                selectedPackage4: selectedPackage4 === "none" ? null : parseInt(selectedPackage4),
                comparisonTableCategoryId: comparisonTableCategoryId === "none" ? null : parseInt(comparisonTableCategoryId),
            })
            if (result.success) toast.success("บันทึกการตั้งค่า Landing Page สำเร็จ")
            else toast.error(result.error || "ไม่สามารถบันทึกได้")
        } catch {
            toast.error("เกิดข้อผิดพลาด")
        } finally {
            setIsSavingLanding(false)
        }
    }

    const handleSaveOAuthSettings = async () => {
        setIsSavingOAuth(true)
        try {
            const result = await saveOAuthSettings({
                googleClientId,
                googleClientSecret,
                discordClientId,
                discordClientSecret,
            })
            if (result.success) toast.success("บันทึกการตั้งค่า OAuth สำเร็จ")
            else toast.error(result.error || "ไม่สามารถบันทึกได้")
        } catch {
            toast.error("เกิดข้อผิดพลาด")
        } finally {
            setIsSavingOAuth(false)
        }
    }

    const handleTestWebhook = async () => {
        if (!discordWebhookUrl) {
            toast.error("กรุณากรอก Discord Webhook URL")
            return
        }
        setIsTestingWebhook(true)
        try {
            const result = await testDiscordWebhook(discordWebhookUrl.trim())
            if (result.success) toast.success("ทดสอบการส่ง Discord Webhook สำเร็จ")
            else toast.error(result.error || "ไม่สามารถส่ง Discord Webhook ได้")
        } catch {
            toast.error("เกิดข้อผิดพลาดในการทดสอบ Discord Webhook")
        } finally {
            setIsTestingWebhook(false)
        }
    }

    const handleSaveDiscordSettings = async () => {
        setIsSavingDiscord(true)
        try {
            const result = await saveDiscordSettings({
                webhookUrl: discordWebhookUrl,
                notifyRegister: discordNotifyRegister,
                notifyTopup: discordNotifyTopup,
                notifyOrder: discordNotifyOrder,
            })
            if (result.success) toast.success("บันทึกการตั้งค่า Discord สำเร็จ")
            else toast.error(result.error || "ไม่สามารถบันทึกได้")
        } catch {
            toast.error("เกิดข้อผิดพลาด")
        } finally {
            setIsSavingDiscord(false)
        }
    }

    const handleSaveCronSettings = async () => {
        setIsSavingCron(true)
        try {
            const result = await saveCronSettings({
                autoSuspendEnabled,
                suspendGraceDays: parseInt(suspendGraceDays) || 0,
                checkIntervalMinutes: parseInt(checkIntervalMinutes) || 60,
            })
            if (result.success) toast.success("บันทึกการตั้งค่า Cron สำเร็จ")
            else toast.error(result.error || "ไม่สามารถบันทึกได้")
        } catch {
            toast.error("เกิดข้อผิดพลาด")
        } finally {
            setIsSavingCron(false)
        }
    }

    return (
        <div className="relative z-10 space-y-8 pb-10">
            {/* Modern Aurora Background */}
            <div className="fixed top-[-20%] right-[-10%] w-full max-w-[600px] h-[600px] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-30 animate-pulse" />
            <div className="fixed bottom-[-20%] left-[-10%] w-full max-w-[500px] h-[500px] bg-pink-500/10 blur-[100px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-20" />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2"
                    >
                        System Settings
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground"
                    >
                        Configure global system parameters and integrations.
                    </motion.p>
                </div>
            </div>

            <div className="grid gap-8">
                {/* Website Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card className="group relative overflow-x-auto rounded-3xl no-scrollbar bg-[#111]/60 backdrop-blur-md border border-white/[0.03] shadow-2xl transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.08]">
                        <CardHeader className="bg-white/[0.02] p-6">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: 5 }}
                                    className="p-3.5 rounded-xl bg-gradient-to-br from-sky-500/20 via-blue-500/20 to-sky-500/20 border border-sky-500/40 shadow-lg shadow-sky-500/20"
                                >
                                    <Globe className="h-6 w-6 text-sky-500" />
                                </motion.div>
                                <div className="flex-1">
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent mb-1.5">
                                        Website Information
                                    </CardTitle>
                                    <CardDescription className="text-sm text-muted-foreground/80">
                                        Brand identity and metadata settings.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold text-white/80">Logo URL</Label>
                                    <Input
                                        value={logoUrl}
                                        onChange={(e) => setLogoUrl(e.target.value)}
                                        className={inputClass}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold text-white/80">Store Name</Label>
                                    <Input
                                        value={storeName}
                                        onChange={(e) => setStoreName(e.target.value)}
                                        className={inputClass}
                                        placeholder="My Hosting"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                <Label className="text-sm font-semibold text-white/80">Website Title (SEO)</Label>
                                <Input
                                    value={websiteTitle}
                                    onChange={(e) => setWebsiteTitle(e.target.value)}
                                    className={inputClass}
                                    placeholder="Best Cloud Hosting..."
                                />
                            </div>
                            <div className="space-y-2.5">
                                <Label className="text-sm font-semibold text-white/80">Description (SEO)</Label>
                                <Input
                                    value={websiteDescription}
                                    onChange={(e) => setWebsiteDescription(e.target.value)}
                                    className={inputClass}
                                    placeholder="Affordable hosting solutions..."
                                />
                            </div>
                            <div className="flex justify-end pt-2">
                                <SaveButton onClick={handleSaveWebsiteSettings} isLoading={isSavingWebsite} gradient="from-sky-500 to-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Landing Page Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    <Card className="group relative overflow-x-auto rounded-3xl no-scrollbar bg-[#111]/60 backdrop-blur-md border border-white/[0.03] shadow-2xl transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.08]">
                        <CardHeader className="bg-white/[0.02] p-6">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: 5 }}
                                    className="p-3.5 rounded-xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-500/20 border border-purple-500/40 shadow-lg shadow-purple-500/20"
                                >
                                    <Sparkles className="h-6 w-6 text-purple-500" />
                                </motion.div>
                                <div className="flex-1">
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1.5">
                                        Landing Page
                                    </CardTitle>
                                    <CardDescription className="text-sm text-muted-foreground/80">
                                        Configure featured packages and comparison tables.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            <div className="space-y-4">
                                <Label className="text-white/80 text-base font-semibold">Featured Packages (Select 4)</Label>
                                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                                    {[
                                        { val: selectedPackage1, set: setSelectedPackage1, label: "Slot 1" },
                                        { val: selectedPackage2, set: setSelectedPackage2, label: "Slot 2" },
                                        { val: selectedPackage3, set: setSelectedPackage3, label: "Slot 3" },
                                        { val: selectedPackage4, set: setSelectedPackage4, label: "Slot 4" }
                                    ].map((slot, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <Label className="text-xs font-medium text-white/50 uppercase tracking-wider">{slot.label}</Label>
                                            <Select value={slot.val} onValueChange={slot.set}>
                                                <SelectTrigger className={selectTriggerClass}>
                                                    <SelectValue placeholder="None" />
                                                </SelectTrigger>
                                                <SelectContent className={selectContentClass}>
                                                    <SelectItem className={selectItemClass} value="none">None</SelectItem>
                                                    {packages.map((pkg) => (
                                                        <SelectItem className={selectItemClass} key={pkg.id} value={pkg.id.toString()}>
                                                            {pkg.name} ({parseFloat(pkg.price).toFixed(0)}฿)
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3 pt-6">
                                <Label className="text-white/80 text-base font-semibold">Comparison Table Category</Label>
                                <Select value={comparisonTableCategoryId} onValueChange={setComparisonTableCategoryId}>
                                    <SelectTrigger className={selectTriggerClass}>
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent className={selectContentClass}>
                                        <SelectItem className={selectItemClass} value="none">None</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem className={selectItemClass} key={cat.id} value={cat.id.toString()}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-end pt-2">
                                <SaveButton onClick={handleSaveLandingPageSettings} isLoading={isSavingLanding} gradient="from-purple-500 to-pink-600" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Payment Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                >
                    <Card className="group relative overflow-x-auto rounded-3xl no-scrollbar bg-[#111]/60 backdrop-blur-md border border-white/[0.03] shadow-2xl transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.08]">
                        <CardHeader className="bg-white/[0.02] p-6">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: 5 }}
                                    className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-500/40 shadow-lg shadow-emerald-500/20"
                                >
                                    <Wallet className="h-6 w-6 text-emerald-500" />
                                </motion.div>
                                <div className="flex-1">
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-1.5">
                                        Payment Gateway
                                    </CardTitle>
                                    <CardDescription className="text-sm text-muted-foreground/80">
                                        TrueMoney and Bank Transfer configuration.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            <div className="p-5 bg-[#111]/80 rounded-2xl border border-white/[0.05] flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-white font-medium">Enable TrueMoney Gift (Angpao)</Label>
                                    <p className="text-xs text-white/50">Allow users to top-up via TrueMoney links.</p>
                                </div>
                                <Switch checked={truemoneyEnabled} onCheckedChange={setTruemoneyEnabled} />
                            </div>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold text-white/80">Default Phone Number</Label>
                                    <Input value={truemoneyPhone} onChange={(e) => setTruemoneyPhone(e.target.value)} className={inputClass} placeholder="08xxxxxxxx" disabled={!truemoneyEnabled} />
                                </div>
                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold text-white/80">Bank Name</Label>
                                    <Input value={bankName} onChange={(e) => setBankName(e.target.value)} className={inputClass} placeholder="KBank" />
                                </div>
                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold text-white/80">Account Number</Label>
                                    <Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} className={inputClass} placeholder="xxx-x-xxxxx-x" />
                                </div>
                            </div>
                            <div className="space-y-4 pt-4">
                                <Label className="text-base font-semibold text-white/90">Slip Verification API</Label>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2.5">
                                        <Label className="text-sm font-semibold text-white/80">Receiver Name (TH)</Label>
                                        <Input value={slipVerifyReceiverNameTh} onChange={(e) => setSlipVerifyReceiverNameTh(e.target.value)} className={inputClass} placeholder="Thai Name" />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label className="text-sm font-semibold text-white/80">Receiver Name (EN)</Label>
                                        <Input value={slipVerifyReceiverNameEn} onChange={(e) => setSlipVerifyReceiverNameEn(e.target.value)} className={inputClass} placeholder="English Name" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <SaveButton onClick={handleSavePaymentSettings} isLoading={isSavingPayment} gradient="from-emerald-500 to-teal-600" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Email Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                >
                    <Card className="group relative overflow-x-auto rounded-3xl no-scrollbar bg-[#111]/60 backdrop-blur-md border border-white/[0.03] shadow-2xl transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.08]">
                        <CardHeader className="bg-white/[0.02] p-6">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: 5 }}
                                    className="p-3.5 rounded-xl bg-gradient-to-br from-slate-500/20 via-blue-500/20 to-slate-500/20 border border-slate-500/40 shadow-lg shadow-slate-500/20"
                                >
                                    <Mail className="h-6 w-6 text-slate-500" />
                                </motion.div>
                                <div className="flex-1">
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-600 to-blue-600 bg-clip-text text-transparent mb-1.5">
                                        SMTP Email
                                    </CardTitle>
                                    <CardDescription className="text-sm text-muted-foreground/80">
                                        Mail server configuration for system notifications.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold text-white/80">SMTP Host</Label>
                                    <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className={inputClass} placeholder="smtp.example.com" />
                                </div>
                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold text-white/80">Port</Label>
                                    <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} className={inputClass} placeholder="587" />
                                </div>
                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold text-white/80">Username</Label>
                                    <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className={inputClass} placeholder="user@example.com" />
                                </div>
                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold text-white/80">Password</Label>
                                    <Input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} className={inputClass} placeholder="••••••••" />
                                </div>
                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold text-white/80">Sender Name</Label>
                                    <Input value={smtpSenderName} onChange={(e) => setSmtpSenderName(e.target.value)} className={inputClass} placeholder="My Hosting" />
                                </div>
                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold text-white/80">Sender Email</Label>
                                    <Input value={smtpFrom} onChange={(e) => setSmtpFrom(e.target.value)} className={inputClass} placeholder="noreply@example.com" />
                                </div>
                            </div>
                            <div className="p-5 bg-[#111]/80 rounded-2xl border border-white/[0.05] flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-white font-medium">Secure Connection (SSL/TLS)</Label>
                                    <p className="text-xs text-white/50">Recommended for port 465.</p>
                                </div>
                                <Switch checked={smtpSecure} onCheckedChange={setSmtpSecure} />
                            </div>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
                                <div className="flex gap-2 w-full md:w-auto">
                                    <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className={`${inputClass} w-full md:w-64`} placeholder="test@email.com" />
                                    <Button variant="outline" onClick={handleTestEmail} disabled={isTestingEmail} className="h-11 rounded-xl border-white/5 hover:bg-white/5">
                                        {isTestingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
                                    </Button>
                                </div>
                                <SaveButton onClick={handleSaveEmailSettings} isLoading={isSavingEmail} gradient="from-slate-500 to-zinc-600" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* OAuth Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                >
                    <Card className="group relative overflow-x-auto rounded-3xl no-scrollbar bg-[#111]/60 backdrop-blur-md border border-white/[0.03] shadow-2xl transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.08]">
                        <CardHeader className="bg-white/[0.02] p-6">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: 5 }}
                                    className="p-3.5 rounded-xl bg-gradient-to-br from-orange-500/20 via-red-500/20 to-orange-500/20 border border-orange-500/40 shadow-lg shadow-orange-500/20"
                                >
                                    <Lock className="h-6 w-6 text-orange-500" />
                                </motion.div>
                                <div className="flex-1">
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-1.5">
                                        OAuth Login
                                    </CardTitle>
                                    <CardDescription className="text-sm text-muted-foreground/80">
                                        Google and Discord authentication credentials.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8 p-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">Google Login</h3>
                                <div className="grid gap-5">
                                    <div className="space-y-2">
                                        <Label className="text-white/80 text-sm">Client ID</Label>
                                        <Input value={googleClientId} onChange={(e) => setGoogleClientId(e.target.value)} className={inputClass} placeholder="..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white/80 text-sm">Client Secret</Label>
                                        <Input type="password" value={googleClientSecret} onChange={(e) => setGoogleClientSecret(e.target.value)} className={inputClass} placeholder="..." />
                                    </div>
                                    <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex items-center gap-3">
                                        <div className="flex-1 font-mono text-xs text-white/70 break-all">{origin}/api/auth/google/callback</div>
                                        <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(`${origin}/api/auth/google/callback`); toast.success("Copied!"); }} className="h-8 w-8 hover:bg-white/10"><Copy className="h-3.5 w-3.5" /></Button>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">Discord Login</h3>
                                <div className="grid gap-5">
                                    <div className="space-y-2">
                                        <Label className="text-white/80 text-sm">Client ID</Label>
                                        <Input value={discordClientId} onChange={(e) => setDiscordClientId(e.target.value)} className={inputClass} placeholder="..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white/80 text-sm">Client Secret</Label>
                                        <Input type="password" value={discordClientSecret} onChange={(e) => setDiscordClientSecret(e.target.value)} className={inputClass} placeholder="..." />
                                    </div>
                                    <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex items-center gap-3">
                                        <div className="flex-1 font-mono text-xs text-white/70 break-all">{origin}/api/auth/discord/callback</div>
                                        <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(`${origin}/api/auth/discord/callback`); toast.success("Copied!"); }} className="h-8 w-8 hover:bg-white/10"><Copy className="h-3.5 w-3.5" /></Button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <SaveButton onClick={handleSaveOAuthSettings} isLoading={isSavingOAuth} gradient="from-orange-500 to-red-600" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Discord Notification Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                >
                    <Card className="group relative overflow-x-auto rounded-3xl no-scrollbar bg-[#111]/60 backdrop-blur-md border border-white/[0.03] shadow-2xl transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.08]">
                        <CardHeader className="bg-white/[0.02] p-6">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: 5 }}
                                    className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-indigo-500/20 border border-indigo-500/40 shadow-lg shadow-indigo-500/20"
                                >
                                    <MessageSquare className="h-6 w-6 text-indigo-500" />
                                </motion.div>
                                <div className="flex-1">
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1.5">
                                        Discord Webhook
                                    </CardTitle>
                                    <CardDescription className="text-sm text-muted-foreground/80">
                                        Send real-time notifications to your Discord server.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            <div className="space-y-2.5">
                                <Label className="text-sm font-semibold text-white/80">Webhook URL</Label>
                                <Input value={discordWebhookUrl} onChange={(e) => setDiscordWebhookUrl(e.target.value)} className={inputClass} placeholder="https://discord.com/api/webhooks/..." />
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="p-4 bg-[#111]/80 rounded-2xl border border-white/[0.05] flex items-center justify-between">
                                    <span className="text-sm font-medium text-white/90">New User</span>
                                    <Switch checked={discordNotifyRegister} onCheckedChange={setDiscordNotifyRegister} />
                                </div>
                                <div className="p-4 bg-[#111]/80 rounded-2xl border border-white/[0.05] flex items-center justify-between">
                                    <span className="text-sm font-medium text-white/90">Top-up</span>
                                    <Switch checked={discordNotifyTopup} onCheckedChange={setDiscordNotifyTopup} />
                                </div>
                                <div className="p-4 bg-[#111]/80 rounded-2xl border border-white/[0.05] flex items-center justify-between">
                                    <span className="text-sm font-medium text-white/90">New Order</span>
                                    <Switch checked={discordNotifyOrder} onCheckedChange={setDiscordNotifyOrder} />
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-4">
                                <Button variant="ghost" onClick={handleTestWebhook} disabled={isTestingWebhook} className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">
                                    {isTestingWebhook ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <SendIcon className="w-4 h-4 mr-2" />}
                                    Test Webhook
                                </Button>
                                <SaveButton onClick={handleSaveDiscordSettings} isLoading={isSavingDiscord} gradient="from-indigo-500 to-purple-600" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Cron Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                >
                    <Card className="group relative overflow-x-auto rounded-3xl no-scrollbar bg-[#111]/60 backdrop-blur-md border border-white/[0.03] shadow-2xl transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.08]">
                        <CardHeader className="bg-white/[0.02] p-6">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: 5 }}
                                    className="p-3.5 rounded-xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/40 shadow-lg shadow-amber-500/20"
                                >
                                    <Clock className="h-6 w-6 text-amber-500" />
                                </motion.div>
                                <div className="flex-1">
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-1.5">
                                        Automation (Cron)
                                    </CardTitle>
                                    <CardDescription className="text-sm text-muted-foreground/80">
                                        Manage background tasks and auto-suspension rules.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            <div className="space-y-2.5">
                                <Label className="text-sm font-semibold text-white/80">Cron Secret Key</Label>
                                <div className="relative">
                                    <Input value={cronSettings?.cronSecret || ""} disabled className={`${inputClass} opacity-60`} />
                                    <Button size="icon" variant="ghost" className="absolute right-1 top-1 h-9 w-9 text-white/50 hover:text-white" onClick={() => { navigator.clipboard.writeText(cronSettings?.cronSecret || ""); toast.success("Copied!"); }}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="p-5 bg-[#111]/80 rounded-2xl border border-white/[0.05] flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-white font-medium">Auto-Suspend Expired Services</Label>
                                    <p className="text-xs text-white/50">Automatically suspend services after grace period.</p>
                                </div>
                                <Switch checked={autoSuspendEnabled} onCheckedChange={setAutoSuspendEnabled} />
                            </div>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold text-white/80">Grace Period (Days)</Label>
                                    <Input type="number" value={suspendGraceDays} onChange={(e) => setSuspendGraceDays(e.target.value)} className={inputClass} disabled={!autoSuspendEnabled} />
                                </div>
                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold text-white/80">Check Interval (Minutes)</Label>
                                    <Input type="number" value={checkIntervalMinutes} onChange={(e) => setCheckIntervalMinutes(e.target.value)} className={inputClass} disabled={!autoSuspendEnabled} />
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <SaveButton onClick={handleSaveCronSettings} isLoading={isSavingCron} gradient="from-amber-500 to-orange-600" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}

function SendIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
        </svg>
    )
}
