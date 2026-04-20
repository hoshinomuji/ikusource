"use client"

import { Server, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "@/components/translation-provider"

export function Navbar({ logoUrl = "", storeName = "Ikuzen Studio" }: { logoUrl?: string; storeName?: string }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { t } = useTranslation()

  const NAV_LINKS = [
    { name: t("features"), href: "#features" },
    { name: t("pricing"), href: "#pricing" },
    { name: t("aboutUs"), href: "/about" },
  ]

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 flex justify-center ${isScrolled ? "pt-4" : "pt-6"
        }`}
    >
      <div
        className={`
        w-full max-w-6xl mx-4 rounded-full border transition-all duration-300 px-6
        ${isScrolled ? "bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border-black/10 dark:border-white/10 shadow-2xl py-3" : "bg-transparent border-transparent py-4"}
      `}
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <Link href="/" className="justify-self-start flex items-center gap-2 font-bold text-xl tracking-tight text-neutral-900 dark:text-white group">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="h-8 w-8 object-contain" />
            ) : (
              <div className="w-9 h-9 bg-black/5 dark:bg-white/10 group-hover:bg-black/10 dark:group-hover:bg-white/20 transition-colors text-neutral-900 dark:text-white rounded-full flex items-center justify-center border border-black/10 dark:border-white/10 backdrop-blur-sm">
                <Server className="w-5 h-5" />
              </div>
            )}
            <span className="font-heading">{storeName}</span>
          </Link>

          <div className="hidden md:inline-flex w-fit shrink-0 items-center justify-self-center bg-black/5 dark:bg-white/5 rounded-full px-1.5 py-1.5 border border-black/5 dark:border-white/5 backdrop-blur-sm">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-6 py-2.5 rounded-full text-base font-medium text-neutral-600 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-300"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center justify-self-end gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full px-5 font-medium"
              >
                {t("login")}
              </Button>
            </Link>
            <Link href="/register">
              <Button className="rounded-full px-6 bg-primary text-primary-foreground hover:bg-primary/90 font-bold border-0 shadow-lg shadow-primary/20 transition-all duration-300">
                {t("getStarted")}
              </Button>
            </Link>
          </div>

          <div className="md:hidden col-start-3 justify-self-end flex items-center gap-2">
            <button className="p-2 text-neutral-900 dark:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="absolute top-24 left-4 right-4 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 space-y-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-lg font-medium text-zinc-300 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <hr className="border-white/10" />
              <Link
                href="/login"
                className="block text-lg font-medium text-zinc-300 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                เข้าสู่ระบบ
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full mt-4 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl h-12">เริ่มต้นใช้งาน</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
