"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Cookie, ShieldCheck } from "lucide-react"

import Link from "next/link"

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      setTimeout(() => setIsVisible(true), 2000)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted")
    setIsVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined")
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-[28rem] z-[100]"
        >
          {/* Main Container */}
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />

            <div className="relative bg-[#0a0a0a]/90 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
              <div className="flex flex-col gap-4">
                {/* Header with Icon */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
                    <Cookie className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-white flex items-center gap-2">
                      การตั้งค่าคุกกี้ <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      เราใช้คุกกี้เพื่อเพิ่มประสิทธิภาพและประสบการณ์ที่ดีในการใช้งานเว็บไซต์
                      ท่านสามารถศึกษารายละเอียดเพิ่มเติมได้ที่
                      <Link href="/cookie-policy" className="text-cyan-400 hover:text-cyan-300 underline mx-1 font-medium transition-colors">
                        นโยบายคุกกี้
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Button
                    onClick={handleDecline}
                    variant="outline"
                    className="w-full bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all rounded-xl h-11"
                  >
                    ปฏิเสธ
                  </Button>
                  <Button
                    onClick={handleAccept}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/20 border border-cyan-500/20 transition-all rounded-xl h-11"
                  >
                    ยอมรับทั้งหมด
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
