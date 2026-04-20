"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Wallet, MoreHorizontal, Shield, Mail, User, Key, Trash2, UsersIcon, Check, X } from "lucide-react"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { updateUserRole, addPoints, changeUserPassword, deleteUser } from "@/app/actions/admin"
import { toast } from "sonner"

interface User {
    id: number
    name: string
    email: string
    role: string
    createdAt: Date
    walletBalance: number
}

export function AdminUsersClient({ users }: { users: User[] }) {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [pointsAmount, setPointsAmount] = useState("")
    const [pointsType, setPointsType] = useState<"add" | "deduct">("add")
    const [passwordUser, setPasswordUser] = useState<User | null>(null)
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [userToDelete, setUserToDelete] = useState<User | null>(null)

    // Filter users
    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Handlers (kept same as before)
    const handleUpdateRole = async (userId: number, newRole: string) => {
        const result = await updateUserRole(userId, newRole)
        if (result.success) {
            toast.success("Updated user role successfully")
            window.location.reload()
        } else {
            toast.error(result.error || "Failed to update role")
        }
    }

    const handleAddPoints = async () => {
        if (!selectedUser || !pointsAmount) {
            toast.error("Please enter an amount")
            return
        }
        const amount = parseFloat(pointsAmount)
        if (isNaN(amount) || amount <= 0) {
            toast.error("Invalid amount")
            return
        }
        const result = await addPoints(
            selectedUser.id,
            pointsType === "add" ? amount : -amount,
            pointsType === "add" ? "bonus" : "deduction",
            pointsType === "add" ? "Admin bonus" : "Admin deduction"
        )
        if (result.success) {
            toast.success("Wallet updated successfully")
            setPointsAmount("")
            setSelectedUser(null)
            window.location.reload()
        } else {
            toast.error(result.error || "Failed to update wallet")
        }
    }

    const handleChangePassword = async () => {
        if (!passwordUser) return
        if (!newPassword || !confirmPassword) {
            toast.error("Please fill all fields")
            return
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match")
            return
        }
        const result = await changeUserPassword(passwordUser.id, newPassword)
        if (result.success) {
            toast.success("Password changed successfully")
            setPasswordUser(null)
            setNewPassword("")
            setConfirmPassword("")
        } else {
            toast.error(result.error || "Failed to change password")
        }
    }

    const handleDeleteUser = async () => {
        if (!userToDelete) return
        const result = await deleteUser(userToDelete.id)
        if (result.success) {
            toast.success("User deleted successfully")
            setUserToDelete(null)
            window.location.reload()
        } else {
            toast.error(result.error || "Failed to delete user")
        }
    }

    return (
        <div className="relative z-10 space-y-8">
            {/* Modern Aurora Background */}
            <div className="fixed top-[-20%] right-[-10%] w-full max-w-[600px] h-[600px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-30 animate-pulse" />
            <div className="fixed bottom-[-20%] left-[-10%] w-full max-w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-20" />

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2"
                    >
                        User Management
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground"
                    >
                        Manage system accounts, permissions, and balances.
                    </motion.p>
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-3"
                >
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 w-full sm:w-[250px] rounded-full bg-white/5 border-white/10 text-white focus:bg-white/10 transition-all"
                        />
                    </div>
                </motion.div>
            </div>

            {/* Users Table Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="rounded-3xl bg-[#111]/60 backdrop-blur-md border border-white/[0.03] overflow-x-auto no-scrollbar">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-white/[0.05]">
                                <TableHead className="w-full sm:w-[300px] text-muted-foreground font-medium pl-6">User</TableHead>
                                <TableHead className="text-muted-foreground font-medium">Role</TableHead>
                                <TableHead className="text-muted-foreground font-medium">Wallet</TableHead>
                                <TableHead className="text-muted-foreground font-medium">Joined</TableHead>
                                <TableHead className="text-right text-muted-foreground font-medium pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <UsersIcon className="h-8 w-8 opacity-20" />
                                            <p>No users found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user, index) => (
                                    <TableRow
                                        key={user.id}
                                        className="border-white/[0.05] hover:bg-white/[0.02] transition-colors group"
                                    >
                                        <TableCell className="pl-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center text-sm font-bold text-white ring-2 ring-[#111] group-hover:ring-primary/50 transition-all">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-white group-hover:text-primary transition-colors">{user.name}</span>
                                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={user.role}
                                                onValueChange={(value) => handleUpdateRole(user.id, value)}
                                            >
                                                <SelectTrigger className="h-8 w-[120px] text-xs bg-white/5 border-white/10 text-white rounded-lg focus:ring-0 focus:ring-offset-0">
                                                    <div className="flex items-center gap-2">
                                                        {user.role === 'admin' ? <Shield className="h-3 w-3 text-red-400" /> : <User className="h-3 w-3 text-blue-400" />}
                                                        <SelectValue />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                                    <SelectItem value="user">User</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                    <SelectItem value="suspended" className="text-red-400">Suspended</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-mono text-sm flex items-center gap-1 text-emerald-400">
                                                <span className="text-muted-foreground">฿</span>
                                                {user.walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {format(new Date(user.createdAt), "d MMM yyyy", { locale: th })}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10 text-white w-48">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => setSelectedUser(user)} className="focus:bg-white/10 cursor-pointer">
                                                        <Wallet className="mr-2 h-4 w-4" /> Manage Wallet
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setPasswordUser(user)} className="focus:bg-white/10 cursor-pointer">
                                                        <Key className="mr-2 h-4 w-4" /> Reset Password
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-white/10" />
                                                    <DropdownMenuItem
                                                        onClick={() => setUserToDelete(user)}
                                                        className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete User
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </motion.div>

            {/* Wallet Dialog */}
            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <DialogContent className="bg-[#111] border-white/10 text-white rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Manage Wallet</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Update wallet balance for <span className="font-semibold text-white">{selectedUser?.name}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="flex items-center justify-between p-4 border border-white/10 rounded-xl bg-white/5">
                            <span className="text-sm font-medium text-muted-foreground">Current Balance</span>
                            <span className="text-2xl font-bold text-emerald-400">฿{selectedUser?.walletBalance.toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Action</Label>
                                <Select value={pointsType} onValueChange={(v: "add" | "deduct") => setPointsType(v)}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                        <SelectItem value="add">Add Funds</SelectItem>
                                        <SelectItem value="deduct">Deduct Funds</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Amount (THB)</Label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={pointsAmount}
                                    onChange={(e) => setPointsAmount(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSelectedUser(null)} className="hover:bg-white/10 hover:text-white text-muted-foreground">Cancel</Button>
                        <Button onClick={handleAddPoints} className="bg-white text-black hover:bg-white/90">Confirm</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Password Dialog */}
            <Dialog open={!!passwordUser} onOpenChange={(open) => !open && setPasswordUser(null)}>
                <DialogContent className="bg-[#111] border-white/10 text-white rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Set a new password for <span className="font-semibold text-white">{passwordUser?.name}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">New Password</Label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Confirm Password</Label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setPasswordUser(null)} className="hover:bg-white/10 hover:text-white text-muted-foreground">Cancel</Button>
                        <Button onClick={handleChangePassword} className="bg-white text-black hover:bg-white/90">Update Password</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <DialogContent className="bg-[#111] border-white/10 text-white rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-red-500">Delete User</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Are you sure you want to delete <span className="font-semibold text-white">{userToDelete?.name}</span>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setUserToDelete(null)} className="hover:bg-white/10 hover:text-white text-muted-foreground">Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteUser}>Delete User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
