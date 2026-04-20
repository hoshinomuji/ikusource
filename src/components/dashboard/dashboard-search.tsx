"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    Search,
    LayoutDashboard,
    Server,
    LifeBuoy,
    LogOut,
    ShoppingBag
} from "lucide-react"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/actions/logout"

export function DashboardSearch({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    const router = useRouter()
    const [open, setOpen] = React.useState(false)
    const [isMac, setIsMac] = React.useState(false)

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const ua = window.navigator.userAgent || ""
        const platform = (window.navigator as any).platform || ""
        const macLike = /Mac|iPhone|iPad|iPod/i.test(platform || ua)
        setIsMac(macLike)
    }, [])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    return (
        <>
            <div className={className} {...props}>
                <Button
                    variant="outline"
                    className="relative h-10 w-full justify-start rounded-full bg-black/10 dark:bg-white/5 border border-white/10 text-sm font-normal text-muted-foreground shadow-none hover:bg-white/10 hover:text-foreground md:w-72 lg:w-80 pl-4 pr-10 transition-colors"
                    onClick={() => setOpen(true)}
                >
                    <Search className="mr-2 h-4 w-4 opacity-70" />
                    <span className="hidden lg:inline-flex">Search...</span>
                    <span className="inline-flex lg:hidden">Search...</span>
                    <kbd className="pointer-events-none absolute right-[0.55rem] top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 font-mono text-[10px] font-medium opacity-100 sm:flex">
                        {isMac ? (
                            <>
                                <span className="text-xs">⌘</span>K
                            </>
                        ) : (
                            <>
                                <span className="text-[10px]">Ctrl</span>K
                            </>
                        )}
                    </kbd>
                </Button>
            </div>

            <CommandDialog open={open} onOpenChange={setOpen} className="rounded-2xl border-border/60 shadow-2xl max-w-xl">
                <CommandInput placeholder="พิมพ์เพื่อค้นหาเมนู หรือบริการ..." className="rounded-t-2xl" />
                <CommandList>
                    <CommandEmpty>ไม่พบผลลัพธ์</CommandEmpty>
                    <CommandGroup heading="เมนูหลัก">
                        <CommandItem
                            onSelect={() => runCommand(() => router.push("/dashboard"))}
                        >
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>แดชบอร์ด</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => router.push("/dashboard/hosting"))}
                        >
                            <Server className="mr-2 h-4 w-4" />
                            <span>โฮสติ้งของฉัน</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => router.push("/dashboard/hosting/order"))}
                        >
                            <ShoppingBag className="mr-2 h-4 w-4" />
                            <span>สั่งซื้อบริการ</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => router.push("/dashboard/wallet"))}
                        >
                            <CreditCard className="mr-2 h-4 w-4" />
                            <span>เติมเงิน / กระเป๋าเงิน</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="การตั้งค่า">
                        <CommandItem
                            onSelect={() => runCommand(() => router.push("/dashboard/profile"))}
                        >
                            <User className="mr-2 h-4 w-4" />
                            <span>โปรไฟล์</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => router.push("/dashboard/security"))}
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            <span>ความปลอดภัย</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => router.push("/contact"))}
                        >
                            <LifeBuoy className="mr-2 h-4 w-4" />
                            <span>ติดต่อสอบถาม</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => logout())}
                            className="text-red-500 aria-selected:text-red-500"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>ออกจากระบบ</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    )
}
