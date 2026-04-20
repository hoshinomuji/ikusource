"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { PackageFormDialog } from "@/components/admin/package-form-dialog"
import { deleteHostingPackage } from "@/app/actions/admin-hosting"
import { applyTemplateToPackages, createTemplateFromPackage } from "@/app/actions/directadmin-tools"
import { motion } from "framer-motion"
import { Search, Plus, Trash2, Loader2, Package, Server, Database, HardDrive, Edit, Info, Zap } from "lucide-react"
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

export function AdminHostingPackagesClient({
    packages,
    configs,
    categories,
    templates = [],
}: {
    packages: any[]
    configs: any[]
    categories: any[]
    templates?: any[]
}) {
    const [q, setQ] = useState("")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<any | null>(null)
    const [isPending, startTransition] = useTransition()
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase()
        if (!query) return packages
        return packages.filter((p) => {
            const hay = [p?.name, p?.directAdminPackageName, p?.price, p?.billingCycle, p?.configName]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
            return hay.includes(query)
        })
    }, [packages, q])

    const onDelete = (id: number) => {
        setDeletingId(id)
        startTransition(async () => {
            const res = await deleteHostingPackage(id)
            if (res?.success) {
                toast.success(res.message || "ลบแพ็คเกจสำเร็จ")
                window.location.reload()
            } else {
                toast.error(res?.error || "ลบแพ็คเกจไม่สำเร็จ")
                setDeletingId(null)
            }
        })
    }

    const onCreateTemplate = (pkgId: number, pkgName: string) => {
        const templateName = window.prompt("Template name", `${pkgName} Template`)
        if (!templateName) return
        startTransition(async () => {
            const res = await createTemplateFromPackage(pkgId, templateName)
            if (!res.success) {
                toast.error(res.error || "Failed to create template")
                return
            }
            toast.success("Template created")
            window.location.reload()
        })
    }

    const onApplyTemplate = (pkgId: number) => {
        if (!templates.length) {
            toast.error("No templates available")
            return
        }
        const options = templates.map((t) => `${t.id}: ${t.name}`).join("\n")
        const input = window.prompt(`Choose template id:\n${options}`, String(templates[0].id))
        if (!input) return
        const templateId = Number.parseInt(input)
        if (!Number.isFinite(templateId)) {
            toast.error("Invalid template id")
            return
        }

        startTransition(async () => {
            const res = await applyTemplateToPackages(templateId, [pkgId])
            if (!res.success) {
                toast.error(res.error || "Failed to apply template")
                return
            }
            toast.success("Template applied")
            window.location.reload()
        })
    }

    return (
        <div className="relative z-10 space-y-8">
            {/* Modern Aurora Background */}
            <div className="fixed top-[-20%] right-[-10%] w-full max-w-[600px] h-[600px] bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-30 animate-pulse" />
            <div className="fixed bottom-[-20%] left-[-10%] w-full max-w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-20" />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2"
                    >
                        Hosting Packages
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground"
                    >
                        Manage pricing and features for hosting plans.
                    </motion.p>
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-end gap-3"
                >
                    <Button
                        onClick={() => {
                            setEditing(null)
                            setDialogOpen(true)
                        }}
                        className="h-10 px-6 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700 font-medium shadow-lg shadow-blue-900/20 border-0"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Package
                    </Button>
                </motion.div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search packages..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className="pl-9 h-10 rounded-full bg-white/5 border-white/10 text-white focus:bg-white/10 transition-all"
                    />
                </div>
            </div>

            {/* Packages Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
                {filtered.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 rounded-3xl bg-[#111]/40 border border-white/[0.03]">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Package className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                        <p className="text-muted-foreground">No hosting packages found</p>
                    </div>
                ) : (
                    filtered.map((p, i) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * i }}
                            className="group relative overflow-x-auto rounded-3xl no-scrollbar bg-[#111]/60 backdrop-blur-md border border-white/[0.03] p-6 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.08]"
                        >
                            {/* Card Content */}
                            <div className="flex flex-col h-full">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 group-hover:scale-110 transition-transform duration-300">
                                        <Zap className="h-6 w-6 text-cyan-400" />
                                    </div>
                                    <Badge variant={p.isActive ? "default" : "secondary"} className={p.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : ""}>
                                        {p.isActive ? "Active" : "Disabled"}
                                    </Badge>
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-xl font-bold text-white mb-1">{p.name}</h3>
                                    <p className="text-sm text-cyan-400 font-mono">{p.directAdminPackageName || "No DA Package"}</p>
                                </div>

                                <div className="space-y-3 mb-6 flex-1">
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <HardDrive className="w-4 h-4 text-white/40" />
                                        <span>{p.diskSpace === "unlimited" || !p.diskSpace ? "Unlimited" : `${p.diskSpace} MB`} Storage</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <Server className="w-4 h-4 text-white/40" />
                                        <span>{p.bandwidth === "unlimited" || !p.bandwidth ? "Unlimited" : `${p.bandwidth} MB`} Bandwidth</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <Database className="w-4 h-4 text-white/40" />
                                        <span>{p.databases === "unlimited" ? "Unlimited" : p.databases} Databases</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div>
                                        <span className="text-lg font-bold text-white">{p.price}</span>
                                        <span className="text-xs text-muted-foreground ml-1">/{p.billingCycle}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="rounded-full text-xs"
                                            onClick={() => onCreateTemplate(p.id, p.name)}
                                        >
                                            Save Template
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="rounded-full text-xs"
                                            onClick={() => onApplyTemplate(p.id)}
                                        >
                                            Apply Template
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setEditing(p)
                                                setDialogOpen(true)
                                            }}
                                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-white hover:bg-white/10"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={isPending && deletingId === p.id}
                                                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                                                >
                                                    {isPending && deletingId === p.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-[#111] border-white/10 text-white rounded-2xl">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-red-400">Delete Package?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-muted-foreground">
                                                        This will permanently delete the hosting package. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10 rounded-xl">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => onDelete(p.id)}
                                                        className="bg-red-600 hover:bg-red-700 text-white border-0 rounded-xl"
                                                    >
                                                        Delete Package
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </motion.div>

            {dialogOpen ? (
                <PackageFormDialog
                    package={editing}
                    configs={configs}
                    categories={categories}
                    onClose={() => setDialogOpen(false)}
                />
            ) : null}
        </div>
    )
}
