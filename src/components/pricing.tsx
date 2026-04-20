"use client"

import { useState, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Check, Zap } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

const plans = [
  {
    name: "เริ่มต้น",
    description: "เหมาะสำหรับโปรเจกต์ส่วนตัว",
    monthlyPrice: 9,
    yearlyPrice: 90,
    features: [
      "พื้นที่เก็บข้อมูล SSD 10 GB",
      "แบนด์วิดท์ 100 GB",
      "1 โดเมน",
      "ใบรับรอง SSL ฟรี",
      "สำรองข้อมูลรายวัน",
      "สนับสนุนทางอีเมล",
    ],
    popular: false,
  },
  {
    name: "มืออาชีพ",
    description: "เหมาะสำหรับธุรกิจที่กำลังเติบโต",
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      "พื้นที่เก็บข้อมูล SSD 50 GB",
      "แบนด์วิดท์ไม่จำกัด",
      "10 โดเมน",
      "ใบรับรอง SSL ฟรี",
      "สำรองข้อมูลรายชั่วโมง",
      "สนับสนุนแบบเร่งด่วน",
      "CDN ฟรี",
      "ป้องกัน DDoS",
    ],
    popular: true,
  },
  {
    name: "องค์กร",
    description: "สำหรับแอปพลิเคชันขนาดใหญ่",
    monthlyPrice: 99,
    yearlyPrice: 990,
    features: [
      "พื้นที่เก็บข้อมูล SSD 500 GB",
      "แบนด์วิดท์ไม่จำกัด",
      "โดเมนไม่จำกัด",
      "ใบรับรอง SSL ฟรี",
      "สำรองข้อมูลแบบเรียลไทม์",
      "สนับสนุนทางโทรศัพท์ 24/7",
      "CDN พรีเมียม",
      "ป้องกัน DDoS ขั้นสูง",
      "ทรัพยากรเฉพาะ",
      "โซลูชันที่กำหนดเอง",
    ],
    popular: false,
  },
]

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-sky-200/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-100/80 backdrop-blur-sm border border-sky-200 text-sky-700 text-sm font-medium mb-6"
          >
            <Zap className="h-4 w-4" />
            ราคาที่เรียบง่าย
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-balance">
            เลือกแพ็คเกจ{" "}
            <span className="bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">
              ที่เหมาะกับคุณ
            </span>
          </h2>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 text-pretty leading-relaxed">
            ไม่มีค่าธรรมเนียมแอบแฝง ไม่มีค่าใช้จ่ายซ่อนเร้น เพียงแค่ราคาที่ตรงไปตรงมาซึ่งปรับขนาดตามความต้องการของคุณ
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-4 p-1 rounded-full bg-white/60 backdrop-blur-xl border border-sky-100 shadow-lg">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full transition-all duration-300 ${!isYearly
                ? "bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-lg"
                : "text-gray-700 hover:text-sky-600"
                }`}
            >
              รายเดือน
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full transition-all duration-300 ${isYearly
                ? "bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-lg"
                : "text-gray-700 hover:text-sky-600"
                }`}
            >
              รายปี
              <span className="ml-2 text-xs">ประหยัด 17%</span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              <div
                className={`relative h-full bg-white/60 backdrop-blur-xl rounded-3xl p-8 border transition-all duration-300 hover:-translate-y-2 ${plan.popular
                  ? "border-sky-400 shadow-2xl shadow-sky-500/30 hover:shadow-sky-500/40"
                  : "border-sky-100 hover:border-sky-200 hover:shadow-2xl hover:shadow-sky-500/20"
                  }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-sky-500 to-cyan-600 text-white text-sm font-medium shadow-lg">
                      <Zap className="h-3.5 w-3.5" />
                      ยอดนิยม
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-gray-900">
                      ${formatCurrency(isYearly ? plan.yearlyPrice : plan.monthlyPrice)}
                    </span>
                    <span className="text-gray-600">/{isYearly ? "ปี" : "เดือน"}</span>
                  </div>
                  {isYearly && (
                    <p className="text-sm text-sky-600 mt-2">
                      ประหยัด ${formatCurrency(plan.monthlyPrice * 12 - plan.yearlyPrice)} ต่อปี
                    </p>
                  )}
                </div>

                <Button
                  className={`w-full mb-8 ${plan.popular
                    ? "bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white shadow-lg shadow-sky-500/30"
                    : "bg-white hover:bg-sky-50 text-gray-900 border border-sky-200"
                    }`}
                  size="lg"
                >
                  เริ่มใช้งาน
                </Button>

                <div className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center mt-0.5">
                        <Check className="h-3.5 w-3.5 text-sky-600" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Decorative Gradient */}
                {plan.popular && (
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-cyan-500/5 rounded-3xl -z-10" />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-gray-600">
            แพ็คเกจทั้งหมดรวม <span className="font-semibold text-sky-600">การรับประกันคืนเงิน 30 วัน</span> โดยไม่ต้องถามคำถาม
          </p>
        </motion.div>
      </div>
    </section>
  )
}
