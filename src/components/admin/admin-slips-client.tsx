"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileImage, Trash2, Loader2, CreditCard, Receipt, Search, Download } from "lucide-react"
import { toast } from "sonner"
import { deleteSlipVerification } from "@/app/actions/admin-slips"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
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

interface SlipVerification {
    id: number
    userId: number
    userName: string | null
    userEmail: string | null
    fileHash: string
    fileName: string
    fileSize: number
    amount: string
    rdcwResponse: string | null
    referenceId: string | null
    createdAt: Date
}

export function AdminSlipsClient({ slips }: { slips: SlipVerification[] }) {
    const [isPending, startTransition] = useTransition()
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    const handleDelete = (slipId: number) => {
        setDeletingId(slipId)
        startTransition(async () => {
            const result = await deleteSlipVerification(slipId)
            if (result.success) {
                toast.success(result.message || "Slip deleted successfully")
                // In a real app, router.refresh() would be better than reload, 
                // but we'll stick to what was there or improve it if possible.
                window.location.reload()
            } else {
                toast.error(result.error || "Failed to delete slip")
                setDeletingId(null)
            }
        })
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    }

    const totalAmount = slips.reduce((sum, slip) => sum + parseFloat(slip.amount || "0"), 0)

    const filteredSlips = slips.filter(slip =>
        (slip.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (slip.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (slip.referenceId?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    )

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
                        Payment Slips
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground"
                    >
                        Verify and manage payment transfer slips.
                    </motion.p>
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-end gap-1"
                >
                    <div className="text-3xl font-bold text-white">
                        ฿{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-cyan-400 font-medium">Total Verified Amount</div>
                </motion.div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by user, email, or ref ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 rounded-full bg-white/5 border-white/10 text-white focus:bg-white/10 transition-all"
                    />
                </div>
            </div>

            {/* Slips List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid gap-4"
            >
                {filteredSlips.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-[#111]/40 border border-white/[0.03]">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Receipt className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                        <p className="text-muted-foreground">No payment slips found</p>
                    </div>
                ) : (
                    filteredSlips.map((slip, i) => (
                        <motion.div
                            key={slip.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * i }}
                            className="group relative overflow-x-auto no-scrollbar rounded-2xl bg-[#111]/60 backdrop-blur-md border border-white/[0.03] p-5 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.08]"
                        >
                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                                {/* Icon */}
                                <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0">
                                    <FileImage className="h-6 w-6 text-cyan-400" />
                                </div>

                                {/* Main Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-semibold text-white group-hover:text-primary transition-colors truncate">
                                            {slip.userName || "Unknown User"}
                                        </h3>
                                        <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/10 text-xs px-2 py-0.5">
                                            ฿{parseFloat(slip.amount).toLocaleString()}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <span>{slip.userEmail}</span>
                                        </span>
                                        <span className="hidden sm:inline text-white/10">•</span>
                                        <span className="font-mono text-white/50">{slip.fileName}</span>
                                        <span className="hidden sm:inline text-white/10">•</span>
                                        <span>{formatFileSize(slip.fileSize)}</span>
                                    </div>
                                </div>

                                {/* Meta Info */}
                                <div className="flex flex-col items-end gap-1 w-full sm:min-w-[120px] sm:w-auto">
                                    <div className="text-sm text-white font-medium">
                                        {format(new Date(slip.createdAt), "d MMM yyyy", { locale: th })}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {format(new Date(slip.createdAt), "HH:mm", { locale: th })}
                                    </div>
                                    {slip.referenceId && (
                                        <div className="text-[10px] text-cyan-400/80 font-mono mt-1">
                                            Ref: {slip.referenceId}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 border-l border-white/10 pl-4 ml-2 md:pl-6 md:ml-4">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled={isPending && deletingId === slip.id}
                                                className="h-9 w-9 rounded-full text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                            >
                                                {isPending && deletingId === slip.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-[#111] border-white/10 text-white rounded-2xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-red-400">Delete Slip Record?</AlertDialogTitle>
                                                <AlertDialogDescription className="text-muted-foreground">
                                                    This will remove the verification record. The user's wallet balance will NOT be affected.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10 rounded-xl">Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(slip.id)}
                                                    className="bg-red-600 hover:bg-red-700 text-white border-0 rounded-xl"
                                                >
                                                    Delete Record
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </motion.div>
        </div>
    )
}
