"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowRight, Terminal, Activity, ShieldCheck } from "lucide-react"
import Link from "next/link"

export function Hero({ userCount = 0 }: { userCount?: number }) {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden border-b border-border/40">
      {/* Background Ambience */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Copywriting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              เครือข่ายออนไลน์ทั่วโลก
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
              โครงสร้างพื้นฐานคลาวด์ <br />
              <span className="text-muted-foreground">ระดับองค์กร</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
              สร้างคลาวด์เซิร์ฟเวอร์ประสิทธิภาพสูงได้ในไม่กี่วินาที ขับเคลื่อนด้วย <strong>NVMe SSDs</strong>, <strong>10Gbps Uplinks</strong>, และป้องกันด้วย <strong>DDoS Mitigation</strong> ระดับองค์กร
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 rounded-lg text-base font-semibold bg-foreground text-background hover:bg-foreground/90 transition-all">
                  สร้างเซิร์ฟเวอร์ <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="#pricing">
                <Button variant="outline" size="lg" className="h-12 px-8 rounded-lg text-base font-medium border-border hover:bg-secondary/50">
                  ดูราคาแพ็คเกจ
                </Button>
              </Link>
            </div>

            {/* Trust Signals / Stats */}
            <div className="grid grid-cols-3 gap-8 border-t border-border/50 pt-8">
              <div>
                <div className="text-2xl font-bold text-foreground">99.9%</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-1">การันตี Uptime</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">10Gbps</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-1">ความเร็วเครือข่าย</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">24/7</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-1">ผู้เชี่ยวชาญดูแล</div>
              </div>
            </div>
          </motion.div>

          {/* Right: Technical Visual / Terminal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative rounded-xl bg-[#0d0d0d] border border-white/10 shadow-2xl overflow-hidden font-mono text-sm">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="ml-2 text-xs text-white/40">root@server-01:~</div>
              </div>
              <div className="p-6 text-green-400 space-y-2">
                <div className="flex">
                  <span className="text-blue-400 mr-2">➜</span>
                  <span className="text-white">apt-get update && apt-get upgrade -y</span>
                </div>
                <div className="text-white/50">Reading package lists... Done</div>
                <div className="text-white/50">Building dependency tree... Done</div>
                <div className="flex mt-4">
                  <span className="text-blue-400 mr-2">➜</span>
                  <span className="text-white">./benchmark.sh --nvme --network</span>
                </div>
                <div className="mt-2 text-white">
                  <span className="text-yellow-400">⚡ Storage I/O:</span> 5,200 MB/s (Read) / 3,800 MB/s (Write)<br/>
                  <span className="text-yellow-400">⚡ Network:</span> 9.8 Gbps Down / 9.5 Gbps Up<br/>
                  <span className="text-yellow-400">⚡ Latency:</span> 1.2ms (Asia-Pacific)
                </div>
                <div className="flex mt-4">
                  <span className="text-blue-400 mr-2">➜</span>
                  <span className="animate-pulse">_</span>
                </div>
              </div>
              
              {/* Overlay Badge */}
              <div className="absolute bottom-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                <ShieldCheck className="w-3 h-3" /> ระบบปลอดภัย
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
