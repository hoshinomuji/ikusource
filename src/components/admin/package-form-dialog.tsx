"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { createHostingPackage, fetchDirectAdminPackages, updateHostingPackage } from "@/app/actions/admin-hosting"
import { toast } from "sonner"
import { Loader2, Infinity, Package, ArrowRight, RefreshCw } from "lucide-react"

interface HostingPackage {
    id: number
    name: string
    description: string | null
    categoryId: number | null
    configId?: number | null
    directAdminPackageName: string | null
    diskSpace: string | number
    bandwidth: string | number
    domains: string | number
    subdomains: string | number
    emailAccounts: string | number
    databases: string | number
    ftpAccounts: string | number
    price: string
    billingCycle: string | null
    isActive: boolean
}

interface HostingCategory {
    id: number
    name: string
    description: string | null
    icon: string | null
    displayOrder: number
    isActive: boolean
}

export function PackageFormDialog({
    package: pkg,
    configs = [],
    categories = [],
    onClose,
}: {
    package: HostingPackage | null
    configs?: Array<{ id: number; serverIp: string; isActive: boolean }>
    categories?: HostingCategory[]
    onClose: () => void
}) {
    const [isPending, startTransition] = useTransition()
    const [isFetchingDaPackages, startFetchDaPackages] = useTransition()
    const [selectedConfigId, setSelectedConfigId] = useState<string>(pkg?.configId?.toString() || configs[0]?.id?.toString() || "")
    const [daPackages, setDaPackages] = useState<string[]>([])
    const hasAutoFetched = useRef(false)
    const lastFetchedConfigId = useRef<number | null>(null)
    const [formData, setFormData] = useState({
        name: pkg?.name || "",
        description: pkg?.description || "",
        categoryId: pkg?.categoryId?.toString() || "",
        directAdminPackageName: pkg?.directAdminPackageName || "",
        diskSpace: (() => {
            if (!pkg?.diskSpace || pkg.diskSpace === "unlimited") return ""
            const value = typeof pkg.diskSpace === "string" ? parseFloat(pkg.diskSpace) : pkg.diskSpace
            return value >= 1000 ? (value / 1000).toString() : value.toString()
        })(),
        bandwidth: (() => {
            if (!pkg?.bandwidth || pkg.bandwidth === "unlimited") return ""
            const value = typeof pkg.bandwidth === "string" ? parseFloat(pkg.bandwidth) : pkg.bandwidth
            return value >= 1000 ? (value / 1000).toString() : value.toString()
        })(),
        domains: pkg?.domains?.toString() || "1",
        subdomains: pkg?.subdomains?.toString() || "0",
        emailAccounts: pkg?.emailAccounts?.toString() || "0",
        databases: pkg?.databases?.toString() || "0",
        ftpAccounts: pkg?.ftpAccounts?.toString() || "0",
        price: pkg?.price || "",
        billingCycle: pkg?.billingCycle || "monthly",
        isActive: pkg?.isActive ?? true,
        // Unlimited flags
        diskSpaceUnlimited: pkg?.diskSpace === "unlimited",
        bandwidthUnlimited: pkg?.bandwidth === "unlimited",
        domainsUnlimited: pkg?.domains === "unlimited",
        subdomainsUnlimited: pkg?.subdomains === "unlimited",
        emailAccountsUnlimited: pkg?.emailAccounts === "unlimited",
        databasesUnlimited: pkg?.databases === "unlimited",
        ftpAccountsUnlimited: pkg?.ftpAccounts === "unlimited",
        // Unit selection
        diskSpaceUnit: pkg?.diskSpace && typeof pkg.diskSpace === "string" && pkg.diskSpace !== "unlimited"
            ? (parseFloat(pkg.diskSpace) >= 1000 ? "GB" : "MB")
            : "MB",
        bandwidthUnit: pkg?.bandwidth && typeof pkg.bandwidth === "string" && pkg.bandwidth !== "unlimited"
            ? (parseFloat(pkg.bandwidth) >= 1000 ? "GB" : "MB")
            : "MB",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        startTransition(async () => {
            const form = new FormData()

            // Convert to MB if GB is selected
            let diskSpaceValue = formData.diskSpace
            if (!formData.diskSpaceUnlimited && formData.diskSpaceUnit === "GB" && formData.diskSpace) {
                diskSpaceValue = (parseFloat(formData.diskSpace.toString()) * 1000).toString()
            }

            let bandwidthValue = formData.bandwidth
            if (!formData.bandwidthUnlimited && formData.bandwidthUnit === "GB" && formData.bandwidth) {
                bandwidthValue = (parseFloat(formData.bandwidth.toString()) * 1000).toString()
            }

            // Handle unlimited values
            const submitData = {
                ...formData,
                diskSpace: formData.diskSpaceUnlimited ? "unlimited" : diskSpaceValue,
                bandwidth: formData.bandwidthUnlimited ? "unlimited" : bandwidthValue,
                domains: formData.domainsUnlimited ? "unlimited" : formData.domains,
                subdomains: formData.subdomainsUnlimited ? "unlimited" : formData.subdomains,
                emailAccounts: formData.emailAccountsUnlimited ? "unlimited" : formData.emailAccounts,
                databases: formData.databasesUnlimited ? "unlimited" : formData.databases,
                ftpAccounts: formData.ftpAccountsUnlimited ? "unlimited" : formData.ftpAccounts,
            }

            Object.entries(submitData).forEach(([key, value]) => {
                // Skip unlimited flags and unit selections
                if (key.endsWith("Unlimited") || key.endsWith("Unit")) return

                // configId Will be computed from category, not needed from form
                if (key === "configId") return

                form.append(key, value.toString())
            })

            if (pkg) {
                form.append("id", pkg.id.toString())
            }

            const result = pkg
                ? await updateHostingPackage(form)
                : await createHostingPackage(form)

            if (result.success) {
                toast.success(result.message || "บันทึกแพ็คเกจสำเร็จ")
                onClose()
                window.location.reload()
            } else {
                toast.error(result.error || "ไม่สามารถบันทึกแพ็คเกจได้")
            }
        })
    }

    const fetchDaPackages = (configId?: number, silent = false) => {
        startFetchDaPackages(async () => {
            const resolvedConfigId = Number.isFinite(configId as number)
                ? configId
                : (selectedConfigId ? Number.parseInt(selectedConfigId, 10) : undefined)
            if (Number.isFinite(resolvedConfigId as number)) {
                lastFetchedConfigId.current = resolvedConfigId as number
            }
            const result = await fetchDirectAdminPackages(Number.isFinite(resolvedConfigId as number) ? resolvedConfigId : undefined)

            if (!result.success) {
                if (!silent) {
                    toast.error(result.error || "Failed to fetch DirectAdmin packages")
                }
                return
            }

            const names = (result.data || []).map((item) => item.name).filter(Boolean)
            setDaPackages(names)
            if (!silent) {
                if (names.length === 0) {
                    toast.error("DirectAdmin API connected but returned 0 packages")
                } else {
                    toast.success(`Loaded ${names.length} package(s) from DirectAdmin`)
                }
            }
        })
    }

    const handleFetchDaPackages = () => fetchDaPackages()

    useEffect(() => {
        if (!configs.length || hasAutoFetched.current) return
        hasAutoFetched.current = true
        const cfgId = selectedConfigId ? Number.parseInt(selectedConfigId, 10) : configs[0]?.id
        fetchDaPackages(Number.isFinite(cfgId as number) ? cfgId : undefined, true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [configs.length])

    useEffect(() => {
        if (!selectedConfigId || !hasAutoFetched.current) return
        const cfgId = Number.parseInt(selectedConfigId, 10)
        if (!Number.isFinite(cfgId)) return
        if (lastFetchedConfigId.current === cfgId) return
        fetchDaPackages(cfgId, true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedConfigId])

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent
                onOpenAutoFocus={(e) => e.preventDefault()}
                className="max-w-2xl bg-zinc-900/95 backdrop-blur-xl border-white/[0.06] text-white rounded-2xl max-h-[85vh] overflow-y-auto w-[95%] sm:w-full p-6 shadow-2xl"
            >
                <DialogHeader className="mb-4 pr-10">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 min-w-0">
                        <span className="min-w-0 break-words">{pkg ? "Edit Hosting Package" : "Create New Package"}</span>
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground mt-1.5">
                        {pkg
                            ? "Modify existing configuration and server limits."
                            : "Set up a new hosting package and its limits. Server will be chosen based on category."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-muted-foreground">
                                Package Display Name
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                required
                                placeholder="e.g. Starter Pack"
                                className="bg-white/[0.04] border-white/[0.06] text-white focus:border-white/30 focus:ring-2 focus:ring-white/10 h-11"
                            />
                        </div>

                        {categories.length > 0 && (
                            <div className="space-y-2">
                                <Label htmlFor="categoryId" className="text-muted-foreground">
                                    Category
                                </Label>
                                <Select
                                    value={formData.categoryId}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, categoryId: value })
                                    }
                                >
                                    <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white h-11 focus:ring-2 focus:ring-white/10">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-white/[0.06] text-white rounded-xl">
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id.toString()} className="focus:bg-white/10 focus:text-white cursor-pointer py-2.5">
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2 sm:col-span-2">
                            <Label
                                htmlFor="directAdminPackageName"
                                className="text-muted-foreground"
                            >
                                DirectAdmin Package Name
                            </Label>
                            <Input
                                id="directAdminPackageName"
                                value={formData.directAdminPackageName}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        directAdminPackageName: e.target.value,
                                    })
                                }
                                required
                                placeholder="e.g. starter, business, professional"
                                className="bg-white/[0.04] border-white/[0.06] text-white focus:border-white/30 focus:ring-2 focus:ring-white/10 h-11"
                            />
                            <div className="flex flex-col sm:flex-row gap-2 mt-2">
                                {configs.length > 0 && (
                                    <Select value={selectedConfigId} onValueChange={setSelectedConfigId}>
                                        <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white h-10 sm:w-[240px] focus:ring-2 focus:ring-white/10">
                                            <SelectValue placeholder="Choose DirectAdmin server" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/[0.06] text-white rounded-xl">
                                            {configs.map((config) => (
                                                <SelectItem key={config.id} value={config.id.toString()} className="focus:bg-white/10 focus:text-white cursor-pointer py-2.5">
                                                    {config.serverIp}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleFetchDaPackages}
                                    disabled={isFetchingDaPackages}
                                    className="h-10"
                                >
                                    {isFetchingDaPackages ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                    )}
                                    Fetch from DirectAdmin
                                </Button>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Choose from DirectAdmin packages (API)</Label>
                                <Select
                                    value={formData.directAdminPackageName || undefined}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            directAdminPackageName: value,
                                        })
                                    }
                                    disabled={isFetchingDaPackages || daPackages.length === 0}
                                >
                                    <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white h-10 focus:ring-2 focus:ring-white/10">
                                        <SelectValue
                                            placeholder={
                                                isFetchingDaPackages
                                                    ? "Loading packages from API..."
                                                    : daPackages.length > 0
                                                        ? "Select package from DirectAdmin"
                                                        : "No package from API yet (click Fetch)"
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-white/[0.06] text-white rounded-xl">
                                        {daPackages.map((name) => (
                                            <SelectItem key={name} value={name} className="focus:bg-white/10 focus:text-white cursor-pointer py-2.5">
                                                {name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-xs text-muted-foreground/60">
                                This MUST exactly match the package name you created in your DirectAdmin panel.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-muted-foreground">
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            placeholder="Describe what's included in this package..."
                            className="bg-white/[0.04] border-white/[0.06] text-white focus:border-white/30 focus:ring-2 focus:ring-white/10 min-h-[100px] resize-none"
                        />
                    </div>

                    {/* Resources Limits Section */}
                    <div className="pt-2 border-t border-white/[0.06]">
                        <h4 className="text-sm font-semibold text-white mb-4 mt-2">Resource Limits</h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                            {/* Disk Space */}
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="diskSpace" className="text-white font-medium">
                                        Disk Space
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={formData.diskSpaceUnit}
                                            onValueChange={(value) => {
                                                const currentValue = formData.diskSpace === "unlimited" || !formData.diskSpace ? 0 : parseFloat(formData.diskSpace.toString())
                                                let newValue = ""
                                                if (formData.diskSpaceUnit === "GB" && value === "MB") newValue = (currentValue * 1000).toString()
                                                else if (formData.diskSpaceUnit === "MB" && value === "GB") newValue = (currentValue / 1000).toString()
                                                else newValue = formData.diskSpace === "unlimited" ? "" : formData.diskSpace.toString()

                                                setFormData({ ...formData, diskSpaceUnit: value as "MB" | "GB", diskSpace: newValue })
                                            }}
                                            disabled={formData.diskSpaceUnlimited}
                                        >
                                            <SelectTrigger className="w-16 h-8 text-xs bg-white/[0.04] border-white/[0.06] text-white focus:ring-2 focus:ring-white/10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/[0.06] text-white">
                                                <SelectItem value="MB" className="focus:bg-white/10">MB</SelectItem>
                                                <SelectItem value="GB" className="focus:bg-white/10">GB</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData({
                                                    ...formData,
                                                    diskSpaceUnlimited: !formData.diskSpaceUnlimited,
                                                    diskSpace: !formData.diskSpaceUnlimited ? "unlimited" : formData.diskSpace === "unlimited" ? "" : formData.diskSpace,
                                                })
                                            }}
                                            className={`relative flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 ${formData.diskSpaceUnlimited
                                                ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                                : "bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] hover:text-white border border-white/[0.06]"
                                                }`}
                                            title="Unlimited"
                                        >
                                            <Infinity className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <Input
                                        id="diskSpace"
                                        type="number"
                                        step={formData.diskSpaceUnit === "GB" ? "0.1" : "1"}
                                        value={formData.diskSpace === "unlimited" ? "" : formData.diskSpace}
                                        onChange={(e) =>
                                            setFormData({ ...formData, diskSpace: e.target.value, diskSpaceUnlimited: false })
                                        }
                                        required={!formData.diskSpaceUnlimited}
                                        disabled={formData.diskSpaceUnlimited}
                                        min="1"
                                        placeholder={formData.diskSpaceUnlimited ? "Unlimited" : `Value in ${formData.diskSpaceUnit}`}
                                        className={`bg-white/[0.04] border-white/[0.06] text-white focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all ${formData.diskSpaceUnlimited
                                            ? "opacity-40 cursor-not-allowed border-transparent bg-transparent pl-0 text-white/50"
                                            : ""
                                            }`}
                                    />
                                    {formData.diskSpaceUnlimited && <div className="text-xs text-white/40 mt-1">Unlimited enabled</div>}
                                </div>
                            </div>

                            {/* Bandwidth */}
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="bandwidth" className="text-white font-medium">
                                        Bandwidth
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={formData.bandwidthUnit}
                                            onValueChange={(value) => {
                                                const currentValue = formData.bandwidth === "unlimited" || !formData.bandwidth ? 0 : parseFloat(formData.bandwidth.toString())
                                                let newValue = ""
                                                if (formData.bandwidthUnit === "GB" && value === "MB") newValue = (currentValue * 1000).toString()
                                                else if (formData.bandwidthUnit === "MB" && value === "GB") newValue = (currentValue / 1000).toString()
                                                else newValue = formData.bandwidth === "unlimited" ? "" : formData.bandwidth.toString()

                                                setFormData({ ...formData, bandwidthUnit: value as "MB" | "GB", bandwidth: newValue })
                                            }}
                                            disabled={formData.bandwidthUnlimited}
                                        >
                                            <SelectTrigger className="w-16 h-8 text-xs bg-white/[0.04] border-white/[0.06] text-white focus:ring-2 focus:ring-white/10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/[0.06] text-white">
                                                <SelectItem value="MB" className="focus:bg-white/10">MB</SelectItem>
                                                <SelectItem value="GB" className="focus:bg-white/10">GB</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData({
                                                    ...formData,
                                                    bandwidthUnlimited: !formData.bandwidthUnlimited,
                                                    bandwidth: !formData.bandwidthUnlimited ? "unlimited" : formData.bandwidth === "unlimited" ? "" : formData.bandwidth,
                                                })
                                            }}
                                            className={`relative flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 ${formData.bandwidthUnlimited
                                                ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                                : "bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] hover:text-white border border-white/[0.06]"
                                                }`}
                                            title="Unlimited"
                                        >
                                            <Infinity className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <Input
                                        id="bandwidth"
                                        type="number"
                                        step={formData.bandwidthUnit === "GB" ? "0.1" : "1"}
                                        value={formData.bandwidth === "unlimited" ? "" : formData.bandwidth}
                                        onChange={(e) =>
                                            setFormData({ ...formData, bandwidth: e.target.value, bandwidthUnlimited: false })
                                        }
                                        required={!formData.bandwidthUnlimited}
                                        disabled={formData.bandwidthUnlimited}
                                        min="1"
                                        placeholder={formData.bandwidthUnlimited ? "Unlimited" : `Value in ${formData.bandwidthUnit}`}
                                        className={`bg-white/[0.04] border-white/[0.06] text-white focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all ${formData.bandwidthUnlimited
                                            ? "opacity-40 cursor-not-allowed border-transparent bg-transparent pl-0 text-white/50"
                                            : ""
                                            }`}
                                    />
                                    {formData.bandwidthUnlimited && <div className="text-xs text-white/40 mt-1">Unlimited enabled</div>}
                                </div>
                            </div>
                        </div>

                        {/* Account Limits */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {/* Domains */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="domains" className="text-muted-foreground text-xs uppercase tracking-wider">Domains</Label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, domainsUnlimited: !p.domainsUnlimited, domains: !p.domainsUnlimited ? "unlimited" : p.domains === "unlimited" ? "1" : p.domains }))}
                                        className={`h-6 w-6 rounded flex items-center justify-center transition-all ${formData.domainsUnlimited ? "bg-white text-black" : "bg-white/[0.06] text-muted-foreground hover:text-white"}`}
                                    >
                                        <Infinity className="h-3 w-3" />
                                    </button>
                                </div>
                                <Input
                                    id="domains" type="number"
                                    value={formData.domains === "unlimited" ? "" : formData.domains}
                                    onChange={(e) => setFormData({ ...formData, domains: e.target.value, domainsUnlimited: false })}
                                    disabled={formData.domainsUnlimited} min="0" placeholder={formData.domainsUnlimited ? "∞" : "1"}
                                    className={`bg-white/[0.04] border-white/[0.06] text-white h-10 ${formData.domainsUnlimited ? "opacity-30 border-transparent bg-transparent pl-1" : "focus:border-white/30 focus:ring-2 focus:ring-white/10"}`}
                                />
                            </div>

                            {/* Subdomains */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="subdomains" className="text-muted-foreground text-xs uppercase tracking-wider">Subdomains</Label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, subdomainsUnlimited: !p.subdomainsUnlimited, subdomains: !p.subdomainsUnlimited ? "unlimited" : p.subdomains === "unlimited" ? "0" : p.subdomains }))}
                                        className={`h-6 w-6 rounded flex items-center justify-center transition-all ${formData.subdomainsUnlimited ? "bg-white text-black" : "bg-white/[0.06] text-muted-foreground hover:text-white"}`}
                                    >
                                        <Infinity className="h-3 w-3" />
                                    </button>
                                </div>
                                <Input
                                    id="subdomains" type="number"
                                    value={formData.subdomains === "unlimited" ? "" : formData.subdomains}
                                    onChange={(e) => setFormData({ ...formData, subdomains: e.target.value, subdomainsUnlimited: false })}
                                    disabled={formData.subdomainsUnlimited} min="0" placeholder={formData.subdomainsUnlimited ? "∞" : "0"}
                                    className={`bg-white/[0.04] border-white/[0.06] text-white h-10 ${formData.subdomainsUnlimited ? "opacity-30 border-transparent bg-transparent pl-1" : "focus:border-white/30 focus:ring-2 focus:ring-white/10"}`}
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="emailAccounts" className="text-muted-foreground text-xs uppercase tracking-wider">Emails</Label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, emailAccountsUnlimited: !p.emailAccountsUnlimited, emailAccounts: !p.emailAccountsUnlimited ? "unlimited" : p.emailAccounts === "unlimited" ? "0" : p.emailAccounts }))}
                                        className={`h-6 w-6 rounded flex items-center justify-center transition-all ${formData.emailAccountsUnlimited ? "bg-white text-black" : "bg-white/[0.06] text-muted-foreground hover:text-white"}`}
                                    >
                                        <Infinity className="h-3 w-3" />
                                    </button>
                                </div>
                                <Input
                                    id="emailAccounts" type="number"
                                    value={formData.emailAccounts === "unlimited" ? "" : formData.emailAccounts}
                                    onChange={(e) => setFormData({ ...formData, emailAccounts: e.target.value, emailAccountsUnlimited: false })}
                                    disabled={formData.emailAccountsUnlimited} min="0" placeholder={formData.emailAccountsUnlimited ? "∞" : "0"}
                                    className={`bg-white/[0.04] border-white/[0.06] text-white h-10 ${formData.emailAccountsUnlimited ? "opacity-30 border-transparent bg-transparent pl-1" : "focus:border-white/30 focus:ring-2 focus:ring-white/10"}`}
                                />
                            </div>

                            {/* Databases */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="databases" className="text-muted-foreground text-xs uppercase tracking-wider">MySQL</Label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, databasesUnlimited: !p.databasesUnlimited, databases: !p.databasesUnlimited ? "unlimited" : p.databases === "unlimited" ? "0" : p.databases }))}
                                        className={`h-6 w-6 rounded flex items-center justify-center transition-all ${formData.databasesUnlimited ? "bg-white text-black" : "bg-white/[0.06] text-muted-foreground hover:text-white"}`}
                                    >
                                        <Infinity className="h-3 w-3" />
                                    </button>
                                </div>
                                <Input
                                    id="databases" type="number"
                                    value={formData.databases === "unlimited" ? "" : formData.databases}
                                    onChange={(e) => setFormData({ ...formData, databases: e.target.value, databasesUnlimited: false })}
                                    disabled={formData.databasesUnlimited} min="0" placeholder={formData.databasesUnlimited ? "∞" : "0"}
                                    className={`bg-white/[0.04] border-white/[0.06] text-white h-10 ${formData.databasesUnlimited ? "opacity-30 border-transparent bg-transparent pl-1" : "focus:border-white/30 focus:ring-2 focus:ring-white/10"}`}
                                />
                            </div>

                            {/* FTP */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="ftpAccounts" className="text-muted-foreground text-xs uppercase tracking-wider">FTP</Label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, ftpAccountsUnlimited: !p.ftpAccountsUnlimited, ftpAccounts: !p.ftpAccountsUnlimited ? "unlimited" : p.ftpAccounts === "unlimited" ? "0" : p.ftpAccounts }))}
                                        className={`h-6 w-6 rounded flex items-center justify-center transition-all ${formData.ftpAccountsUnlimited ? "bg-white text-black" : "bg-white/[0.06] text-muted-foreground hover:text-white"}`}
                                    >
                                        <Infinity className="h-3 w-3" />
                                    </button>
                                </div>
                                <Input
                                    id="ftpAccounts" type="number"
                                    value={formData.ftpAccounts === "unlimited" ? "" : formData.ftpAccounts}
                                    onChange={(e) => setFormData({ ...formData, ftpAccounts: e.target.value, ftpAccountsUnlimited: false })}
                                    disabled={formData.ftpAccountsUnlimited} min="0" placeholder={formData.ftpAccountsUnlimited ? "∞" : "0"}
                                    className={`bg-white/[0.04] border-white/[0.06] text-white h-10 ${formData.ftpAccountsUnlimited ? "opacity-30 border-transparent bg-transparent pl-1" : "focus:border-white/30 focus:ring-2 focus:ring-white/10"}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing & Visibility */}
                    <div className="pt-2 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="price" className="text-muted-foreground font-medium">
                                Base Price (THB)
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                required
                                min="0"
                                placeholder="0.00"
                                className="bg-white/[0.04] border-white/[0.06] text-white focus:border-white/30 focus:ring-2 focus:ring-white/10 h-11 text-lg font-mono"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="billingCycle" className="text-muted-foreground font-medium">
                                Default Billing Cycle
                            </Label>
                            <Select
                                value={formData.billingCycle}
                                onValueChange={(value) => setFormData({ ...formData, billingCycle: value })}
                            >
                                <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white h-11 focus:ring-2 focus:ring-white/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/[0.06] text-white rounded-xl">
                                    <SelectItem value="monthly" className="focus:bg-white/10 focus:text-white cursor-pointer py-2.5">Monthly</SelectItem>
                                    <SelectItem value="yearly" className="focus:bg-white/10 focus:text-white cursor-pointer py-2.5">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Active Switch */}
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/[0.06]">
                        <div className="space-y-1">
                            <Label htmlFor="isActive" className="text-white font-medium">
                                Visibility Status
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Allow users to see and purchase this package on the storefront.
                            </p>
                        </div>
                        <Switch
                            id="isActive"
                            checked={formData.isActive}
                            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                    </div>

                    <DialogFooter className="pt-6 mt-6 border-t border-white/[0.06] gap-3 sm:gap-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="hover:bg-white/10 hover:text-white text-muted-foreground h-11 px-6 rounded-xl"
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="bg-white text-black hover:bg-white/90 h-11 px-8 rounded-xl font-medium shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                pkg ? "Save Changes" : "Create Package"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
