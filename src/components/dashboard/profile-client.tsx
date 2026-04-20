"use client"

import { useActionState, useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { updateProfile, changePassword, type ProfileState } from "@/app/actions/profile"
import { updateUserNotificationSettings } from "@/app/actions/user-settings"
import { User, Lock, Bell, Shield } from "lucide-react"
import { motion } from "framer-motion"

const initialState: ProfileState = {}

export function ProfileClient({
    user,
    notificationSettings,
}: {
    user: {
        id: number
        firstName: string
        lastName: string
        email: string
        phone?: string
        address?: string
        bio?: string
        avatarUrl?: string | null
        createdAt: Date
    }
    notificationSettings: {
        emailNews: boolean
        emailServiceInfo: boolean
        emailExpiration: boolean
    }
}) {
    const [profileState, profileAction, profilePending] = useActionState(updateProfile, initialState)
    const [pwState, pwAction, pwPending] = useActionState(changePassword, initialState)
    const [notif, setNotif] = useState(notificationSettings)
    const [notifPending, startNotif] = useTransition()
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl || null)
    const [avatarUrlInput, setAvatarUrlInput] = useState(user.avatarUrl || "")
    const router = useRouter()

    useEffect(() => {
        if (profileState?.success) {
            toast.success("Profile updated successfully")
            router.refresh()
        }
        if (profileState?.error) toast.error(profileState.error)
    }, [profileState, router])

    useEffect(() => {
        setAvatarPreview(user.avatarUrl || null)
        setAvatarUrlInput(user.avatarUrl || "")
    }, [user.avatarUrl])

    useEffect(() => {
        if (pwState?.success) toast.success("Password updated successfully")
        if (pwState?.error) toast.error(pwState.error)
    }, [pwState])

    const saveNotif = (next: typeof notif) => {
        setNotif(next)
        startNotif(async () => {
            const res = await updateUserNotificationSettings(next)
            if (res?.success) toast.success("Notification settings updated")
            else toast.error(res?.error || "Failed to update settings")
        })
    }

    return (
        <div className="relative z-10 space-y-10 max-w-full max-w-[1400px]">
            {/* Modern Aurora Background */}
            <div className="fixed top-[-20%] right-[-10%] w-full max-w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-30 animate-pulse" />
            <div className="fixed bottom-[-20%] left-[-10%] w-full max-w-[500px] h-[500px] bg-rose-500/10 blur-[100px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-20" />

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2"
                    >
                        Account Settings
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground"
                    >
                        Manage your profile information and account security.
                    </motion.p>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 space-y-6"
                >
                    {/* Profile Card */}
                    <div className="relative overflow-x-auto no-scrollbar rounded-3xl bg-[#111]/60 backdrop-blur-md border border-white/[0.03] p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                                <User className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-semibold text-white">Personal Information</h2>
                        </div>

                        <form action={profileAction} className="space-y-6">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="relative h-24 w-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-x-auto no-scrollbar group">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="h-10 w-10 text-muted-foreground" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-white">{user.firstName} {user.lastName}</h3>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="avatarUrl" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avatar URL</Label>
                                <Input
                                    id="avatarUrl"
                                    name="avatarUrl"
                                    type="url"
                                    placeholder="https://example.com/avatar.jpg"
                                    value={avatarUrlInput}
                                    onChange={(event) => {
                                        const nextUrl = event.target.value
                                        setAvatarUrlInput(nextUrl)
                                        setAvatarPreview(nextUrl.trim() || null)
                                    }}
                                    className="rounded-xl border-white/10 bg-white/5 focus:border-indigo-500/50 focus:ring-0 text-white"
                                />
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">First Name</Label>
                                    <Input id="firstName" name="firstName" defaultValue={user.firstName} className="rounded-xl border-white/10 bg-white/5 focus:border-indigo-500/50 focus:ring-0 text-white" />
                                    {profileState?.fieldErrors?.firstName?.[0] ? (
                                        <p className="text-xs text-red-400">{profileState.fieldErrors.firstName[0]}</p>
                                    ) : null}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Name</Label>
                                    <Input id="lastName" name="lastName" defaultValue={user.lastName} className="rounded-xl border-white/10 bg-white/5 focus:border-indigo-500/50 focus:ring-0 text-white" />
                                    {profileState?.fieldErrors?.lastName?.[0] ? (
                                        <p className="text-xs text-red-400">{profileState.fieldErrors.lastName[0]}</p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Address</Label>
                                <Input id="email" name="email" type="email" defaultValue={user.email} className="rounded-xl border-white/10 bg-white/5 focus:border-indigo-500/50 focus:ring-0 text-white" />
                                {profileState?.fieldErrors?.email?.[0] ? (
                                    <p className="text-xs text-red-400">{profileState.fieldErrors.email[0]}</p>
                                ) : null}
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone Number</Label>
                                    <Input id="phone" name="phone" defaultValue={user.phone || ""} className="rounded-xl border-white/10 bg-white/5 focus:border-indigo-500/50 focus:ring-0 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Address</Label>
                                    <Input id="address" name="address" defaultValue={user.address || ""} className="rounded-xl border-white/10 bg-white/5 focus:border-indigo-500/50 focus:ring-0 text-white" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bio</Label>
                                <Textarea id="bio" name="bio" defaultValue={user.bio || ""} rows={4} className="rounded-xl border-white/10 bg-white/5 focus:border-indigo-500/50 focus:ring-0 text-white resize-none" />
                            </div>

                            <div className="pt-4">
                                <Button type="submit" disabled={profilePending} className="rounded-full bg-white text-black hover:bg-white/90 font-bold px-8 h-10">
                                    {profilePending ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-6"
                >
                    {/* Security Card */}
                    <div className="relative overflow-x-auto no-scrollbar rounded-3xl bg-[#111]/60 backdrop-blur-md border border-white/[0.03] p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-semibold text-white">Security</h2>
                        </div>

                        <form action={pwAction} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Password</Label>
                                <Input id="currentPassword" name="currentPassword" type="password" className="rounded-xl border-white/10 bg-white/5 focus:border-orange-500/50 focus:ring-0 text-white" />
                                {pwState?.fieldErrors?.currentPassword?.[0] ? (
                                    <p className="text-xs text-red-400">{pwState.fieldErrors.currentPassword[0]}</p>
                                ) : null}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New Password</Label>
                                <Input id="newPassword" name="newPassword" type="password" className="rounded-xl border-white/10 bg-white/5 focus:border-orange-500/50 focus:ring-0 text-white" />
                                {pwState?.fieldErrors?.newPassword?.[0] ? (
                                    <p className="text-xs text-red-400">{pwState.fieldErrors.newPassword[0]}</p>
                                ) : null}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Confirm Password</Label>
                                <Input id="confirmPassword" name="confirmPassword" type="password" className="rounded-xl border-white/10 bg-white/5 focus:border-orange-500/50 focus:ring-0 text-white" />
                                {pwState?.fieldErrors?.confirmPassword?.[0] ? (
                                    <p className="text-xs text-red-400">{pwState.fieldErrors.confirmPassword[0]}</p>
                                ) : null}
                            </div>
                            <Button type="submit" disabled={pwPending} variant="secondary" className="w-full rounded-xl bg-white/10 text-white hover:bg-white/20 border-0">
                                {pwPending ? "Updating..." : "Update Password"}
                            </Button>
                        </form>
                    </div>

                    {/* Notification Card */}
                    <div className="relative overflow-x-auto no-scrollbar rounded-3xl bg-[#111]/60 backdrop-blur-md border border-white/[0.03] p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                                <Bell className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-semibold text-white">Notifications</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-medium text-white">News & Updates</Label>
                                    <p className="text-xs text-muted-foreground">Receive platform news via email</p>
                                </div>
                                <Switch
                                    checked={notif.emailNews}
                                    disabled={notifPending}
                                    onCheckedChange={(checked) => saveNotif({ ...notif, emailNews: checked })}
                                    className="data-[state=checked]:bg-blue-500"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-medium text-white">Service Alerts</Label>
                                    <p className="text-xs text-muted-foreground">Get notified about your services</p>
                                </div>
                                <Switch
                                    checked={notif.emailServiceInfo}
                                    disabled={notifPending}
                                    onCheckedChange={(checked) => saveNotif({ ...notif, emailServiceInfo: checked })}
                                    className="data-[state=checked]:bg-blue-500"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-medium text-white">Expiration</Label>
                                    <p className="text-xs text-muted-foreground">Warnings before service expires</p>
                                </div>
                                <Switch
                                    checked={notif.emailExpiration}
                                    disabled={notifPending}
                                    onCheckedChange={(checked) => saveNotif({ ...notif, emailExpiration: checked })}
                                    className="data-[state=checked]:bg-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
