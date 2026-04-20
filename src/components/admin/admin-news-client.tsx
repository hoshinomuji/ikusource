"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, Plus, Edit, Trash2, Megaphone, Check, AlertTriangle, Info, Bell, Search, Mail, Filter } from "lucide-react"
import { toast } from "sonner"
import { createNews, updateNews, deleteNews } from "@/app/actions/news"
import { useTransition } from "react"
import { useRouter } from "next/navigation"

interface NewsItem {
    id: number
    title: string
    content: string
    type: string
    sendEmail?: boolean | null
    publishedAt: Date
    createdAt: Date
    updatedAt: Date
}

export function AdminNewsClient({ news = [] }: { news: NewsItem[] }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [searchQuery, setSearchQuery] = useState("")

    // Dialog states
    const [showDialog, setShowDialog] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [currentNewsId, setCurrentNewsId] = useState<number | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [newsToDelete, setNewsToDelete] = useState<NewsItem | null>(null)

    // Form states
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [type, setType] = useState("info")
    const [sendEmail, setSendEmail] = useState(false)

    const resetForm = () => {
        setTitle("")
        setContent("")
        setType("info")
        setSendEmail(false)
        setIsEditing(false)
        setCurrentNewsId(null)
    }

    const handleEditClick = (item: NewsItem) => {
        setTitle(item.title)
        setContent(item.content)
        setType(item.type)
        setSendEmail(false) // Default to false when editing to avoid accidental re-send
        setCurrentNewsId(item.id)
        setIsEditing(true)
        setShowDialog(true)
    }

    const handleDeleteClick = (item: NewsItem) => {
        setNewsToDelete(item)
        setDeleteDialogOpen(true)
    }

    const handleSubmit = async () => {
        if (!title || !content) {
            toast.error("Please fill in all fields")
            return
        }

        startTransition(async () => {
            let result
            if (isEditing && currentNewsId) {
                result = await updateNews(currentNewsId, { title, content, type })
            } else {
                result = await createNews({ title, content, type, sendEmail })
            }

            if (result.success) {
                toast.success(isEditing ? "Updated successfully" : "Created successfully")
                setShowDialog(false)
                resetForm()
                router.refresh()
            } else {
                toast.error(result.error || "An error occurred")
            }
        })
    }

    const handleDeleteConfirm = async () => {
        if (!newsToDelete) return

        startTransition(async () => {
            const result = await deleteNews(newsToDelete.id)
            if (result.success) {
                toast.success("Deleted successfully")
                setDeleteDialogOpen(false)
                setNewsToDelete(null)
                router.refresh()
            } else {
                toast.error(result.error || "Delete failed")
            }
        })
    }

    const filteredNews = news.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'success': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            case 'warning': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
            case 'error': return 'text-red-400 bg-red-500/10 border-red-500/20'
            default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'success': return <Check className="w-3 h-3" />
            case 'warning': return <AlertTriangle className="w-3 h-3" />
            case 'error': return <Info className="w-3 h-3" />
            default: return <Megaphone className="w-3 h-3" />
        }
    }

    return (
        <div className="relative z-10 space-y-8">
            {/* Modern Aurora Background */}
            <div className="fixed top-[-20%] right-[-10%] w-full max-w-[600px] h-[600px] bg-orange-500/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-30 animate-pulse" />
            <div className="fixed bottom-[-20%] left-[-10%] w-full max-w-[500px] h-[500px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-20" />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2"
                    >
                        Announcements
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground"
                    >
                        Manage news, updates, and system notifications.
                    </motion.p>
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <Button
                        onClick={() => {
                            resetForm()
                            setShowDialog(true)
                        }}
                        className="h-10 px-6 rounded-full bg-white text-black hover:bg-white/90 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create New
                    </Button>
                </motion.div>
            </div>

            {/* Content Section */}
            <div className="space-y-6">
                {/* Search & Filter Bar */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search announcements..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 rounded-full bg-white/5 border-white/10 text-white focus:bg-white/10 transition-all"
                        />
                    </div>
                </div>

                {/* News List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid gap-4"
                >
                    {filteredNews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-[#111]/40 border border-white/[0.03]">
                            <Megaphone className="h-16 w-16 text-muted-foreground/20 mb-4" />
                            <p className="text-muted-foreground">No announcements found</p>
                        </div>
                    ) : (
                        filteredNews.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * i }}
                                className="group relative overflow-x-auto no-scrollbar rounded-2xl bg-[#111]/60 backdrop-blur-md border border-white/[0.03] p-5 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.08]"
                            >
                                <div className="flex flex-col md:flex-row md:items-start gap-4">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="outline" className={`${getTypeColor(item.type)} border px-2 py-0.5 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5`}>
                                                {getTypeIcon(item.type)}
                                                {item.type}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <div className="w-1 h-1 rounded-full bg-white/20" />
                                                {new Date(item.publishedAt).toLocaleDateString('en-US', {
                                                    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                            {item.sendEmail && (
                                                <Badge variant="outline" className="border-blue-500/20 text-blue-400 bg-blue-500/10 text-[10px] px-1.5 h-5 flex items-center gap-1">
                                                    <Mail className="h-3 w-3" /> Email Sent
                                                </Badge>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors mb-1">
                                                {item.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground/80 line-clamp-2">
                                                {item.content}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 md:opacity-0 md:translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditClick(item)}
                                            className="h-8 w-8 p-0 rounded-full hover:bg-white/10 hover:text-white"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteClick(item)}
                                            className="h-8 w-8 p-0 rounded-full hover:bg-red-500/20 hover:text-red-400 text-muted-foreground"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </motion.div>
            </div>

            {/* Create/Edit Modal */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl bg-[#111] border-white/10 text-white rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Edit Announcement" : "New Announcement"}</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Create or modify system-wide announcements.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Title</Label>
                            <Input
                                placeholder="Enter title..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                    <SelectItem value="info">Info</SelectItem>
                                    <SelectItem value="success">Success</SelectItem>
                                    <SelectItem value="warning">Warning</SelectItem>
                                    <SelectItem value="error">Error/Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Content</Label>
                            <Textarea
                                placeholder="Details..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="min-h-[150px] bg-white/5 border-white/10 text-white resize-none"
                            />
                        </div>

                        {!isEditing && (
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                <div className="space-y-1">
                                    <Label className="flex items-center gap-2 text-white">
                                        <Mail className="h-4 w-4" />
                                        Send Email Notification
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Send to all subscribed users (may take time).
                                    </p>
                                </div>
                                <Switch
                                    checked={sendEmail}
                                    onCheckedChange={setSendEmail}
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowDialog(false)} className="hover:bg-white/10 hover:text-white text-muted-foreground">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isPending}
                            className="bg-white text-black hover:bg-white/90"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-md bg-[#111] border-white/10 text-white rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-400">
                            <Trash2 className="h-5 w-5" />
                            Confirm Delete
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Are you sure you want to delete "{newsToDelete?.title}"?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} className="hover:bg-white/10 hover:text-white text-muted-foreground">
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}
