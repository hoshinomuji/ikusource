import Link from "next/link"
import { Package2, Users, ShoppingCart, Settings, LayoutDashboard, Database, Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
                <nav className="flex flex-col gap-4 px-2 py-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-lg font-semibold md:h-8 md:text-base px-4"
                    >
                        <Package2 className="h-6 w-6" />
                        <span className="sr-only">Behigh Shop</span>
                    </Link>
                    <div className="flex flex-col gap-1">
                        <Link
                            href="/admin"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </Link>
                        <Link
                            href="/admin/products"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                        >
                            <Database className="h-4 w-4" />
                            Products
                        </Link>
                        <Link
                            href="/admin/users"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                        >
                            <Users className="h-4 w-4" />
                            Users
                        </Link>
                        <Link
                            href="/admin/orders"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                        >
                            <ShoppingCart className="h-4 w-4" />
                            Orders
                        </Link>
                        <Link
                            href="/admin/settings"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                        >
                            <Settings className="h-4 w-4" />
                            Settings
                        </Link>
                    </div>
                </nav>
            </aside>
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button size="icon" variant="outline" className="sm:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="sm:max-w-xs">
                            <nav className="grid gap-6 text-lg font-medium">
                                <Link
                                    href="/admin"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <LayoutDashboard className="h-5 w-5" />
                                    Dashboard
                                </Link>
                                <Link
                                    href="/admin/products"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <Database className="h-5 w-5" />
                                    Products
                                </Link>
                                <Link
                                    href="/admin/users"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <Users className="h-5 w-5" />
                                    Users
                                </Link>
                            </nav>
                        </SheetContent>
                    </Sheet>
                    <div className="flex flex-1 items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                        {/* Search or User Nav here */}
                    </div>
                </header>
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
