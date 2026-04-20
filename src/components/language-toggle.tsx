"use client"

import * as React from "react"
import { Languages } from "lucide-react"
import { useTranslation } from "@/components/translation-provider"
import { motion, AnimatePresence } from "framer-motion"

export function LanguageToggle() {
    const { locale, setLocale } = useTranslation()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="relative flex h-9 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-[#1a1a1a] border border-neutral-200 dark:border-white/10 opacity-50">
                <Languages className="h-4 w-4 text-muted-foreground mr-1" />
                <span className="font-medium text-[10px] uppercase tracking-wider text-muted-foreground">TH</span>
            </div>
        )
    }

    const isEn = locale === "en"

    return (
        <button
            onClick={() => setLocale(isEn ? "th" : "en")}
            className="group relative flex h-9 w-14 items-center justify-center rounded-full bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-white/10 shadow-sm transition-colors hover:bg-neutral-50 dark:hover:bg-[#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary overflow-hidden"
            aria-label="Toggle language"
        >
            {/* Hover Glow Effect */}
            <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-[-50%] bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.05)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,transparent_70%)] rounded-full blur-md" />
            </div>

            {/* Content container with reliable Framer Motion AnimatePresence */}
            <div className="relative z-10 w-full h-full flex items-center justify-center gap-1">
                <Languages className="h-[14px] w-[14px] text-neutral-600 dark:text-neutral-300" />
                <div className="relative h-4 w-4 overflow-hidden flex items-center justify-center">
                    <AnimatePresence mode="wait" initial={false}>
                        {isEn ? (
                            <motion.div
                                key="en"
                                initial={{ y: -15, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 15, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "backOut" }}
                                className="absolute font-semibold text-[10px] uppercase tracking-wider text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                            >
                                EN
                            </motion.div>
                        ) : (
                            <motion.div
                                key="th"
                                initial={{ y: -15, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 15, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "backOut" }}
                                className="absolute font-semibold text-[10px] uppercase tracking-wider text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                            >
                                TH
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </button>
    )
}
