"use client"

import { 
  Cpu, 
  Globe, 
  ShieldCheck, 
  Zap, 
  Server, 
  Headphones, 
  LayoutTemplate, 
  Rocket 
} from "lucide-react"
import { motion } from "framer-motion"

// Combining Trust Signals & Technical Features
const features = [
  {
    title: "NVMe ประสิทธิภาพสูง",
    description: "พื้นที่จัดเก็บข้อมูล NVMe SSD ระดับองค์กร ให้ความเร็วในการอ่าน/เขียนเร็วกว่า SSD ทั่วไปถึง 5 เท่า",
    icon: Zap,
    category: "ฮาร์ดแวร์"
  },
  {
    title: "เครือข่าย 10Gbps",
    description: "การเชื่อมต่อเครือข่ายความเร็วสูงที่มีความซ้ำซ้อน มั่นใจได้ในความหน่วงต่ำและปริมาณงานสูงสุดสำหรับแอปของคุณ",
    icon: Globe,
    category: "เครือข่าย"
  },
  {
    title: "ป้องกัน DDoS ขั้นสูง",
    description: "การป้องกันแบบเรียลไทม์จากการโจมตี L3/L4/L7 ให้บริการของคุณออนไลน์ได้แม้ภายใต้โหลดหนัก",
    icon: ShieldCheck,
    category: "ความปลอดภัย"
  },
  {
    title: "ติดตั้งแอปใน 1 คลิก",
    description: "ติดตั้งแอปพลิเคชันยอดนิยมอย่าง WordPress, Docker และ Node.js ได้ทันทีจากแผงควบคุมของเรา",
    icon: Rocket,
    category: "การใช้งาน"
  },
  {
    title: "เลือก Control Panel ได้",
    description: "รองรับ DirectAdmin และ cPanel อย่างเต็มรูปแบบ จัดการเซิร์ฟเวอร์ของคุณด้วยเครื่องมือที่คุณคุ้นเคย",
    icon: LayoutTemplate,
    category: "การจัดการ"
  },
  {
    title: "สำรองข้อมูลรายวันอัตโนมัติ",
    description: "กู้คืนความเสียหายได้ง่ายๆ เราจะ Snapshot ข้อมูลของคุณทุกวันไปยังพื้นที่จัดเก็บภายนอกโดยอัตโนมัติ",
    icon: Server,
    category: "ความปลอดภัยข้อมูล"
  },
  {
    title: "โปรเซสเซอร์รุ่นล่าสุด",
    description: "ขับเคลื่อนด้วยโปรเซสเซอร์ AMD EPYC™ และ Intel® Xeon® Scalable รุ่นล่าสุดสำหรับงานหนัก",
    icon: Cpu,
    category: "ฮาร์ดแวร์"
  },
  {
    title: "ซัพพอร์ตโดยผู้เชี่ยวชาญ 24/7",
    description: "เข้าถึงวิศวกรระดับ Tier-3 ได้โดยตรง เพื่อช่วยเหลือในการย้ายข้อมูล ตั้งค่า และแก้ไขปัญหา",
    icon: Headphones,
    category: "บริการ"
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 mb-20 items-end">
            <div>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                    ออกแบบมาเพื่อ <br />
                    <span className="text-muted-foreground">งานระดับ Mission-Critical</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-xl">
                    เราไม่ลดสเปคฮาร์ดแวร์ สัมผัสประสบการณ์แพลตฟอร์มที่สร้างด้วยอุปกรณ์ที่ดีที่สุดในอุตสาหกรรม
                </p>
            </div>
            <div className="hidden md:flex justify-end">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    ระบบทั้งหมดทำงานปกติ
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-md bg-secondary/50 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <feature.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-transparent group-hover:border-primary/20 transition-all">
                    {feature.category}
                </span>
              </div>
              
              <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
