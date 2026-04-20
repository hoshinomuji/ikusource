"use client"

import { ArrowRight, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/app/actions/logout"

interface User {
    id: number
    name: string
    email: string
    role: string
}

export function AdminHeader({ user, onMenuClick }: { user: User; onMenuClick?: () => void }) {
    return (
        <div className="flex items-center gap-3">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full overflow-hidden ring-1 ring-white/10 hover:ring-white/30 transition-all">
                        <div className="h-full w-full bg-gradient-to-tr from-zinc-700 to-zinc-600 flex items-center justify-center text-[10px] font-bold text-white">
                            {user.name?.[0]?.toUpperCase() || "A"}
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl border-[#27272a] bg-[#09090b] shadow-xl p-1 text-white">
                    <DropdownMenuLabel className="font-normal px-2 py-2">
                        <div className="flex flex-col space-y-0.5">
                            <p className="text-sm font-medium leading-none text-white">{user.name}</p>
                            <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-1 bg-[#27272a]" />
                    <DropdownMenuItem asChild className="focus:bg-white/5 cursor-pointer rounded-lg">
                        <a href="/dashboard/profile">
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="focus:bg-white/5 cursor-pointer rounded-lg">
                        <a href="/dashboard">
                            <ArrowRight className="mr-2 h-4 w-4" />
                            <span>Client Area</span>
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1 bg-[#27272a]" />
                    <form action={logout} className="w-full">
                        <DropdownMenuItem asChild className="focus:bg-red-500/10 focus:text-red-500 cursor-pointer rounded-lg">
                            <button type="submit" className="w-full flex items-center text-red-400">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </button>
                        </DropdownMenuItem>
                    </form>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
