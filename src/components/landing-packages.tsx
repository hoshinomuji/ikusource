"use client"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

function buildSpecs(pkg: any): string[] {
  const specs: string[] = []
  if (pkg?.diskSpace) specs.push(`Disk: ${pkg.diskSpace}`)
  if (pkg?.bandwidth) specs.push(`Bandwidth: ${pkg.bandwidth}`)
  if (pkg?.domains) specs.push(`Domains: ${pkg.domains}`)
  if (pkg?.databases) specs.push(`Databases: ${pkg.databases}`)
  return specs.slice(0, 4)
}

export function LandingPackages({ packages = [] }: { packages: any[]; comparisonPackages?: any[] }) {
  const displayPackages = Array.isArray(packages)
    ? packages.slice(0, 4).map((pkg: any, index: number) => ({
      id: pkg.id,
      name: pkg.name,
      price: pkg.price,
      description: pkg.description || "แพ็กเกจโฮสติ้งคุณภาพสูง",
      specs: buildSpecs(pkg),
      highlight: index === 1,
    }))
    : []

  return (
    <section id="pricing" className="py-24 bg-zinc-950 border-y border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-zinc-100">ราคาโปร่งใส เรียบง่าย</h2>
          <p className="text-lg text-zinc-400">เลือกแผนที่เหมาะกับงานของคุณ อัปเกรดหรือลดสเปกได้ตลอดเวลา</p>
        </div>

        {displayPackages.length === 0 ? (
          <div className="rounded-md border border-zinc-800 bg-zinc-900/20 p-6 text-center text-zinc-400">
            ยังไม่มีแพ็กเกจที่เปิดใช้งานในระบบ
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {displayPackages.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "relative flex h-full flex-col p-6 rounded-md border bg-zinc-950 transition-all duration-300 hover:bg-zinc-900/80",
                pkg.highlight
                  ? "border-zinc-300/80 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
                  : "border-zinc-700 hover:border-zinc-500",
              )}
            >
              {pkg.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-sm border border-zinc-500 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-200">
                  ยอดนิยม
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-zinc-100">{pkg.name}</h3>
                <p className="text-sm text-zinc-400 mt-1">{pkg.description}</p>
              </div>

              <div className="mb-6 pb-6 border-b border-zinc-700/80">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight text-white">฿{pkg.price}</span>
                  <span className="text-sm text-zinc-400 font-medium">/เดือน</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {pkg.specs.map((spec: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-3 text-sm">
                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-zinc-800 text-zinc-300")}>
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="font-medium text-zinc-200">{spec}</span>
                  </li>
                ))}
              </ul>

              <Link href="/register" className="w-full">
                <Button
                  className={cn(
                    // Kumo-inspired secondary button shape/size and interaction style
                    "group flex w-full h-10 items-center justify-center gap-2 rounded-md px-4 text-base font-medium transition-all",
                    "border border-zinc-500 bg-zinc-800 text-zinc-100 shadow-sm",
                    "hover:bg-zinc-700 hover:border-zinc-300",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/40",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  สั่งซื้อเลย
                </Button>
              </Link>
            </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
