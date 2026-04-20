"use client"

import { Facebook } from "lucide-react"
import { motion } from "framer-motion"

export function FacebookWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <Facebook className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-bold text-base">ติดตามเรา</h3>
            <p className="text-blue-100 text-xs truncate">อัพเดทข่าวสารและโปรโมชั่น</p>
          </div>
        </div>

        {/* Facebook Page Plugin */}
        <div className="p-3 bg-gray-50">
          <div className="relative w-full overflow-hidden rounded-xl bg-white shadow-sm">
            <iframe
              src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fyour-facebook-page&tabs=timeline&width=280&height=250&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true&appId"
              width="100%"
              height="250"
              style={{ border: "none", overflow: "hidden" }}
              scrolling="no"
              frameBorder="0"
              allowFullScreen={true}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              className="w-full"
              title="Facebook Page"
            />
          </div>
        </div>

        {/* Footer Link */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <a
            href="https://www.facebook.com/your-facebook-page"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5 transition-colors"
          >
            <Facebook className="h-3.5 w-3.5" />
            <span className="truncate">ไปที่หน้า Facebook</span>
          </a>
        </div>
      </div>
    </motion.div>
  )
}

