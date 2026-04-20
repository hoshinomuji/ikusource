"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-[#1a1a1a] border border-neutral-200 dark:border-white/10 opacity-50">
                <Sun className="h-4 w-4 text-muted-foreground" />
            </div>
        )
    }

    const isDark = theme === "dark"

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-white/10 shadow-sm transition-colors hover:bg-neutral-50 dark:hover:bg-[#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary overflow-hidden"
            aria-label="Toggle theme"
        >
            {/* Hover Glow Effect */}
            <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-[-50%] bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.05)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,transparent_70%)] rounded-full blur-md" />
            </div>

            {/* Icons container with reliable Framer Motion AnimatePresence */}
            <div className="relative z-10 w-full h-full flex items-center justify-center">
                <AnimatePresence mode="wait" initial={false}>
                    {isDark ? (
                        <motion.div
                            key="moon"
                            initial={{ y: -20, opacity: 0, rotate: -90 }}
                            animate={{ y: 0, opacity: 1, rotate: 0 }}
                            exit={{ y: 20, opacity: 0, rotate: 90 }}
                            transition={{ duration: 0.3, ease: "backOut" }}
                            className="absolute"
                        >
                            <Moon className="h-4 w-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] fill-white/20" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="sun"
                            initial={{ y: -20, opacity: 0, rotate: -90 }}
                            animate={{ y: 0, opacity: 1, rotate: 0 }}
                            exit={{ y: 20, opacity: 0, rotate: 90 }}
                            transition={{ duration: 0.3, ease: "backOut" }}
                            className="absolute"
                        >
                            <Sun className="h-4 w-4 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] fill-amber-500/20" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </button>
    )
}
