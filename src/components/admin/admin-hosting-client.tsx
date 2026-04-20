"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { deleteHostingOrder } from "@/app/actions/hosting"
import {
    bulkQueueDirectAdminAction,
    getDirectAdminAccountProfile,
    getDirectAdminAuditLogs,
    getDirectAdminQueueJobs,
    importHostingFromDirectAdmin,
    listDirectAdminAccounts,
    processDirectAdminQueue,
    syncHostingOrderFromDirectAdmin,
} from "@/app/actions/directadmin-tools"
import { motion } from "framer-motion"
import { Globe, Search, Server, Trash2, Loader2, User, ChevronRight, AlertCircle, CheckCircle2, Clock, XCircle, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

function statusVariant(status: string | null | undefined) {
    const s = (status || "").toLowerCase()
    if (s === "active" || s === "success") return { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle2 }
    if (s === "pending") return { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: Clock }
    if (s === "suspended" || s === "failed" || s === "cancelled" || s === "canceled") return { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: XCircle }
    return { color: "text-muted-foreground", bg: "bg-zinc-500/10", border: "border-zinc-500/20", icon: AlertCircle }
}

type ImportUser = { id: number; name: string; email: string }
type ImportPackage = { id: number; name: string; directAdminPackageName?: string | null }
type ImportConfig = { id: number; label: string; panelUrl: string }

export function AdminHostingClient({
    orders,
    usersForImport = [],
    packagesForImport = [],
    configsForImport = [],
}: {
    orders: any[]
    usersForImport?: ImportUser[]
    packagesForImport?: ImportPackage[]
    configsForImport?: ImportConfig[]
}) {
    const [q, setQ] = useState("")
    const [isPending, startTransition] = useTransition()
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [selected, setSelected] = useState<number[]>([])
    const [queueJobs, setQueueJobs] = useState<any[]>([])
    const [auditLogs, setAuditLogs] = useState<any[]>([])
    const [importConfigId, setImportConfigId] = useState<number>(configsForImport[0]?.id || 0)
    const [importSearch, setImportSearch] = useState("")
    const [importAccounts, setImportAccounts] = useState<Array<{ username: string }>>([])
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)
    const [isLoadingProfile, setIsLoadingProfile] = useState(false)
    const [importUsername, setImportUsername] = useState("")
    const [importDomain, setImportDomain] = useState("")
    const [importEmail, setImportEmail] = useState("")
    const [importPassword, setImportPassword] = useState("")
    const [importUserId, setImportUserId] = useState<number>(0)
    const [importPackageId, setImportPackageId] = useState<number>(0)
    const [importMatchedUserId, setImportMatchedUserId] = useState<number | null>(null)
    const [importMatchedPackageId, setImportMatchedPackageId] = useState<number | null>(null)
    const [importDetectedPackageName, setImportDetectedPackageName] = useState("")
    const [importStatus, setImportStatus] = useState<"active" | "pending" | "suspended" | "terminated">("active")
    const [importDueDate, setImportDueDate] = useState("")
    const [showImportAdvanced, setShowImportAdvanced] = useState(false)

    const matchedImportUser = useMemo(
        () => usersForImport.find((u) => u.id === importUserId) || null,
        [usersForImport, importUserId]
    )
    const matchedImportPackage = useMemo(
        () => packagesForImport.find((p) => p.id === importPackageId) || null,
        [packagesForImport, importPackageId]
    )
    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase()
        if (!query) return orders
        return orders.filter((o) => {
            const hay = [
                o?.domain,
                o?.userEmail,
                o?.userName,
                o?.packageName,
                o?.serviceName,
                o?.status,
                o?.directAdminUsername,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
            return hay.includes(query)
        })
    }, [orders, q])

    const onDelete = (orderId: number) => {
        setDeletingId(orderId)
        startTransition(async () => {
            const res = await deleteHostingOrder(orderId)
            if (res?.success) {
                toast.success("Delete successful")
                window.location.reload()
            } else {
                toast.error(res?.error || "ลบคำสั่งซื้อไม่สำเร็จ")
                setDeletingId(null)
            }
        })
    }

    const toggleSelected = (orderId: number, checked: boolean) => {
        setSelected((prev) => {
            if (checked) return [...new Set([...prev, orderId])]
            return prev.filter((id) => id !== orderId)
        })
    }

    const bulkAction = (action: "suspend" | "unsuspend") => {
        if (selected.length === 0) {
            toast.error("Select at least one order")
            return
        }
        startTransition(async () => {
            const res = await bulkQueueDirectAdminAction(action, selected)
            if (res.success) {
                toast.success(`Queued ${res.queued} jobs (${res.failed} failed)`)
            } else {
                toast.error(res.error || "Bulk action failed")
            }
        })
    }

    const syncSingle = (orderId: number) => {
        startTransition(async () => {
            const res = await syncHostingOrderFromDirectAdmin(orderId)
            if (res.success) {
                toast.success("Synced status")
                window.location.reload()
                return
            }
            toast.error(res.error || "Sync failed")
        })
    }

    const runQueue = () => {
        startTransition(async () => {
            const res = await processDirectAdminQueue(30)
            if (!res.success) {
                toast.error(res.error || "Queue processing failed")
                return
            }
            toast.success(`Queue done: ${res.succeeded} success, ${res.failed} failed`)
            window.location.reload()
        })
    }

    useEffect(() => {
        let mounted = true
        ; (async () => {
            const [jobsRes, logsRes] = await Promise.all([getDirectAdminQueueJobs(10), getDirectAdminAuditLogs(10)])
            if (!mounted) return
            if (jobsRes.success) setQueueJobs(jobsRes.data || [])
            if (logsRes.success) setAuditLogs(logsRes.data || [])
        })()
        return () => {
            mounted = false
        }
    }, [])

    const normalizeText = (value: string | null | undefined) => (value || "").trim().toLowerCase()

    const loadAccounts = async (showToast: boolean = true) => {
        if (!importConfigId) {
            toast.error("Select DirectAdmin config first")
            return
        }
        setIsLoadingAccounts(true)
        try {
            const res = await listDirectAdminAccounts(importConfigId, importSearch)
            if (!res.success) {
                toast.error(res.error || "Failed to load DirectAdmin accounts")
                return
            }
            setImportAccounts(res.data || [])
            if (!importUsername && (res.data || []).length > 0) {
                setImportUsername(res.data![0].username)
            }
            if (showToast) {
                toast.success(`Loaded ${(res.data || []).length} account(s)`)
            }
        } finally {
            setIsLoadingAccounts(false)
        }
    }

    const loadProfile = async (showToast: boolean = true) => {
        if (!importConfigId || !importUsername) {
            if (showToast) toast.error("Select config and account first")
            return
        }
        setIsLoadingProfile(true)
        try {
            const res = await getDirectAdminAccountProfile(importConfigId, importUsername)
            if (!res.success || !res.data) {
                toast.error(res.error || "Failed to fetch account profile")
                return
            }

            const profileDomain = res.data.domain || ""
            const profileEmail = res.data.email || ""
            const profilePackageName = res.data.packageName || ""

            setImportDomain(profileDomain)
            setImportEmail(profileEmail)
            setImportDetectedPackageName(profilePackageName)

            if (res.data.suspended === true) setImportStatus("suspended")
            if (res.data.suspended === false) setImportStatus("active")

            const matchedUser = usersForImport.find((u) => normalizeText(u.email) === normalizeText(profileEmail))
            if (matchedUser) {
                setImportUserId(matchedUser.id)
                setImportMatchedUserId(matchedUser.id)
            } else {
                setImportUserId(0)
                setImportMatchedUserId(null)
            }

            const packageFromDa = normalizeText(profilePackageName)
            const mappedPackage = packageFromDa
                ? packagesForImport.find((p) => {
                    const daName = normalizeText(p.directAdminPackageName)
                    const name = normalizeText(p.name)
                    return daName === packageFromDa || name === packageFromDa
                })
                : undefined

            if (mappedPackage) {
                setImportPackageId(mappedPackage.id)
                setImportMatchedPackageId(mappedPackage.id)
            } else {
                setImportPackageId(0)
                setImportMatchedPackageId(null)
            }

            if (!matchedUser || !mappedPackage) {
                setShowImportAdvanced(true)
            }

            if (showToast) {
                if (matchedUser && mappedPackage) {
                    toast.success("Fetched profile and auto-mapped user/package")
                } else {
                    toast.warning("Fetched profile, but some mapping was not found. Please select manually.")
                }
            }
        } finally {
            setIsLoadingProfile(false)
        }
    }

    const doImport = () => {
        if (!importConfigId || !importUsername) {
            toast.error("Please select DirectAdmin config and account")
            return
        }
        if (!importPassword) {
            toast.error("Please enter DirectAdmin password")
            return
        }
        if (!importUserId) {
            setShowImportAdvanced(true)
            toast.error("Cannot auto-map website user. Open Advanced and select user manually")
            return
        }
        if (!importPackageId) {
            setShowImportAdvanced(true)
            toast.error("Cannot auto-map package. Open Advanced and select package manually")
            return
        }
        startTransition(async () => {
            let domain = importDomain
            let email = importEmail

            if (!domain || !email) {
                const profileRes = await getDirectAdminAccountProfile(importConfigId, importUsername)
                if (!profileRes.success || !profileRes.data) {
                    toast.error(profileRes.error || "Failed to fetch account profile")
                    return
                }
                domain = profileRes.data.domain || ""
                email = profileRes.data.email || ""
                setImportDomain(domain)
                setImportEmail(email)
            }

            if (!domain || !email) {
                toast.error("Missing domain/email from DirectAdmin profile")
                return
            }

            const res = await importHostingFromDirectAdmin({
                configId: importConfigId,
                username: importUsername,
                domain,
                email,
                password: importPassword,
                targetUserId: importUserId,
                packageId: importPackageId,
                status: importStatus,
                nextDueDate: importDueDate || null,
            })
            if (!res.success) {
                toast.error(res.error || "Import failed")
                return
            }
            toast.success(res.message || "Import successful")
            window.location.reload()
        })
    }

    useEffect(() => {
        if (!importConfigId) return
        setImportAccounts([])
        setImportUsername("")
        setImportDomain("")
        setImportEmail("")
        setImportPassword("")
        setImportUserId(0)
        setImportPackageId(0)
        setImportMatchedUserId(null)
        setImportMatchedPackageId(null)
        setImportDetectedPackageName("")
        setShowImportAdvanced(false)
        loadAccounts(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [importConfigId])

    useEffect(() => {
        if (!importUsername || !importConfigId) {
            setImportDomain("")
            setImportEmail("")
            setImportUserId(0)
            setImportPackageId(0)
            setImportMatchedUserId(null)
            setImportMatchedPackageId(null)
            setImportDetectedPackageName("")
            return
        }
        loadProfile(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [importUsername, importConfigId])

    return (
        <div className="relative z-10 space-y-8">
            {/* Modern Aurora Background */}
            <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-30 animate-pulse" />
            <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-pink-500/10 blur-[100px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-20" />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2"
                    >
                        Hosting Services
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground"
                    >
                        Manage web hosting accounts and orders.
                    </motion.p>
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-end gap-1"
                >
                    <div className="text-3xl font-bold text-white">
                        {orders.length}
                    </div>
                    <div className="text-sm text-purple-400 font-medium">Total Active Services</div>
                </motion.div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search domains, users, packages..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className="pl-9 h-10 rounded-full bg-white/5 border-white/10 text-white focus:bg-white/10 transition-all"
                    />
                </div>
                <Button variant="outline" className="rounded-xl" onClick={() => bulkAction("suspend")} disabled={isPending || selected.length === 0}>
                    <ShieldAlert className="h-4 w-4 mr-2" />
                    Suspend Selected
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => bulkAction("unsuspend")} disabled={isPending || selected.length === 0}>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Unsuspend Selected
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={runQueue} disabled={isPending}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Queue
                </Button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-medium text-white">Import from DirectAdmin</h3>
                        <p className="text-xs text-muted-foreground">Sync old DirectAdmin account into website and map to user/package.</p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-8"
                        onClick={() => setShowImportAdvanced((v) => !v)}
                    >
                        {showImportAdvanced ? "Hide Advanced" : "Advanced"}
                    </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                    <div>
                        <label className="text-xs text-muted-foreground">DirectAdmin Config</label>
                        <select
                            className="mt-1 h-10 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm"
                            value={importConfigId}
                            onChange={(e) => setImportConfigId(Number(e.target.value))}
                        >
                            {configsForImport.map((c) => (
                                <option key={c.id} value={c.id}>
                                    #{c.id} {c.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    {showImportAdvanced && (
                        <>
                            <div>
                                <label className="text-xs text-muted-foreground">Search Account</label>
                                <Input value={importSearch} onChange={(e) => setImportSearch(e.target.value)} placeholder="username..." className="mt-1 h-10" />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button variant="outline" className="h-10" onClick={loadAccounts} disabled={isPending || isLoadingAccounts}>
                                    {isLoadingAccounts ? "Loading..." : "Load Accounts"}
                                </Button>
                                <Button variant="outline" className="h-10" onClick={loadProfile} disabled={isPending || isLoadingProfile || !importUsername}>
                                    {isLoadingProfile ? "Loading..." : "Load Profile"}
                                </Button>
                            </div>
                        </>
                    )}
</div>
                <div className="grid gap-3 md:grid-cols-4">
                    <div>
                        <label className="text-xs text-muted-foreground">DirectAdmin Username</label>
                        <select
                            className="mt-1 h-10 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm"
                            value={importUsername}
                            onChange={(e) => setImportUsername(e.target.value)}
                        >
                            <option value="">Select account</option>
                            {importAccounts.map((a) => (
                                <option key={a.username} value={a.username}>
                                    {a.username}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground">Domain</label>
                        <Input value={importDomain} readOnly placeholder={isLoadingProfile ? "Loading..." : "Auto from DirectAdmin"} className="mt-1 h-10 opacity-90" />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground">Email</label>
                        <Input value={importEmail} readOnly placeholder={isLoadingProfile ? "Loading..." : "Auto from DirectAdmin"} className="mt-1 h-10 opacity-90" />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground">DirectAdmin Password</label>
                        <Input type="text" value={importPassword} onChange={(e) => setImportPassword(e.target.value)} placeholder="required" className="mt-1 h-10" />
                        <p className="mt-1 text-[11px] text-muted-foreground">
                            {!importMatchedUserId || !importMatchedPackageId
                                ? "Auto mapping incomplete. Open Advanced to choose manually."
                                : "Auto mapping ready. You can import now."}
                        </p>
                    </div>
                </div>
                {showImportAdvanced && (
<div className="grid gap-3 md:grid-cols-4">
                    <div>
                        <label className="text-xs text-muted-foreground">Map to Website User</label>
                        {importMatchedUserId && matchedImportUser ? (
                            <Input
                                readOnly
                                className="mt-1 h-10 opacity-90"
                                value={"#" + matchedImportUser.id + " " + matchedImportUser.name + " (" + matchedImportUser.email + ")"}
                            />
                        ) : (
                            <select
                                className="mt-1 h-10 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm"
                                value={importUserId}
                                onChange={(e) => {
                                    const id = Number(e.target.value)
                                    setImportUserId(id)
                                    setImportMatchedUserId(null)
                                }}
                            >
                                <option value={0}>Select website user</option>
                                {usersForImport.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        #{u.id} {u.name} ({u.email})
                                    </option>
                                ))}
                            </select>
                        )}
                        <p className="mt-1 text-[11px] text-muted-foreground">
                            {importMatchedUserId ? "Auto-mapped by DirectAdmin email" : "Auto-map not found. Select user manually."}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground">Map Package</label>
                        {importMatchedPackageId && matchedImportPackage ? (
                            <Input
                                readOnly
                                className="mt-1 h-10 opacity-90"
                                value={"#" + matchedImportPackage.id + " " + matchedImportPackage.name}
                            />
                        ) : (
                            <select
                                className="mt-1 h-10 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm"
                                value={importPackageId}
                                onChange={(e) => {
                                    const id = Number(e.target.value)
                                    setImportPackageId(id)
                                    setImportMatchedPackageId(null)
                                }}
                            >
                                <option value={0}>Select package</option>
                                {packagesForImport.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        #{p.id} {p.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        <p className="mt-1 text-[11px] text-muted-foreground">
                            {importMatchedPackageId
                                ? "Auto-mapped by DirectAdmin package"
                                : importDetectedPackageName
                                    ? "DirectAdmin package: " + importDetectedPackageName + " (no exact match)"
                                    : "No package detected from DirectAdmin profile"}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground">Status</label>
                        <select
                            className="mt-1 h-10 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm"
                            value={importStatus}
                            onChange={(e) => setImportStatus(e.target.value as any)}
                        >
                            <option value="active">active</option>
                            <option value="pending">pending</option>
                            <option value="suspended">suspended</option>
                            <option value="terminated">terminated</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground">Next Due Date (optional)</label>
                        <Input type="datetime-local" value={importDueDate} onChange={(e) => setImportDueDate(e.target.value)} className="mt-1 h-10" />
                    </div>
                </div>
                )}
                <div className="flex justify-end">
                    <Button onClick={doImport} disabled={isPending} className="h-10">
                        {isPending ? "Importing..." : "Import Account"}
                    </Button>
                </div>
            </div>

            {/* Orders List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid gap-4"
            >
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 grid md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-sm text-muted-foreground mb-2">DirectAdmin Queue</h3>
                        <div className="space-y-1 text-xs">
                            {queueJobs.length === 0 ? <div className="text-muted-foreground">No queue jobs</div> : queueJobs.map((j) => (
                                <div key={j.id} className="flex items-center justify-between">
                                    <span>#{j.id} {j.action}</span>
                                    <span className="uppercase text-muted-foreground">{j.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm text-muted-foreground mb-2">DirectAdmin Audit Log</h3>
                        <div className="space-y-1 text-xs">
                            {auditLogs.length === 0 ? <div className="text-muted-foreground">No audit logs</div> : auditLogs.map((l) => (
                                <div key={l.id} className="flex items-center justify-between">
                                    <span>{l.action}</span>
                                    <span className={l.status === "success" ? "text-emerald-400" : "text-red-400"}>{l.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-[#111]/40 border border-white/[0.03]">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Server className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                        <p className="text-muted-foreground">No hosting orders found</p>
                    </div>
                ) : (
                    filtered.map((o, i) => {
                        const style = statusVariant(o.status)
                        const StatusIcon = style.icon
                        return (
                            <motion.div
                                key={o.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * i }}
                                className="group relative overflow-hidden rounded-2xl bg-[#111]/60 backdrop-blur-md border border-white/[0.03] p-5 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.08]"
                            >
                                <div className="flex flex-col md:flex-row md:items-center gap-6">
                                    {/* Icon */}
                                    <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0 group-hover:scale-110 transition-transform duration-300">
                                        <Globe className="h-6 w-6 text-purple-400" />
                                    </div>

                                    {/* Main Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-semibold text-white group-hover:text-primary transition-colors truncate text-lg">
                                                {o.domain || "No Domain"}
                                            </h3>
                                            <Badge variant="outline" className={`${style.bg} ${style.color} ${style.border} text-xs px-2 py-0.5 flex items-center gap-1.5`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {o.status || "Unknown"}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-white/40" />
                                                <span className="text-white/80">{o.userName}</span>
                                            </span>
                                            <span className="hidden sm:inline text-white/10">•</span>
                                            <span className="text-white/60">{o.userEmail}</span>
                                            <span className="hidden sm:inline text-white/10">•</span>
                                            <span className="text-purple-400/80 font-medium">{o.packageName || o.serviceName}</span>
                                        </div>
                                    </div>

                                    {/* Meta Info */}
                                    <div className="flex flex-col items-end gap-1 min-w-[140px]">
                                        <div className="text-sm text-white font-medium">
                                            {o.createdAt ? format(new Date(o.createdAt), "d MMM yyyy", { locale: th }) : "-"}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            ID: #{o.id}
                                        </div>
                                    </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 border-l border-white/10 pl-4 ml-2 md:pl-6 md:ml-4">
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(o.id)}
                                                onChange={(e) => toggleSelected(o.id, e.target.checked)}
                                                className="h-4 w-4 rounded border-white/20 bg-transparent"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 rounded-full text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                                                onClick={() => syncSingle(o.id)}
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={isPending && deletingId === o.id}
                                                    className="h-9 w-9 rounded-full text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                >
                                                    {isPending && deletingId === o.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-[#111] border-white/10 text-white rounded-2xl">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-red-400">Delete Hosting Service?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-muted-foreground">
                                                        This will permanently delete the hosting order and associated data. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10 rounded-xl">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => onDelete(o.id)}
                                                        className="bg-red-600 hover:bg-red-700 text-white border-0 rounded-xl"
                                                    >
                                                        Delete Service
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })
                )}
            </motion.div>
        </div>
    )
}
