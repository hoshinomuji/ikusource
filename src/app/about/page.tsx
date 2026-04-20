"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Rocket, Heart, Globe, Award, Users, Lightbulb } from "lucide-react"

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
            <Navbar />

            <main>
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 overflow-hidden">
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] opacity-50" />
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
                                <Heart className="h-4 w-4" />
                                เกี่ยวกับเรา
                            </div>
                            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-8 font-heading tracking-tight">
                                เรามุ่งมั่นที่จะ <br className="hidden md:block" />
                                <span className="text-gradient bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                                    ปฏิวัติวงการ Web Hosting
                                </span>
                            </h1>
                            <h2 className="sr-only">เกี่ยวกับเราและวิสัยทัศน์</h2>
                            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                                CloudHost เกิดจากความตั้งใจที่จะให้บริการโฮสติ้งที่มีประสิทธิภาพสูงสุด ปลอดภัยที่สุด และใช้งานง่ายที่สุดสำหรับทุกคน ตั้งแต่นักพัฒนาอิสระไปจนถึงองค์กรขนาดใหญ่
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Mission & Vision Grid */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: Rocket,
                                    title: "ภารกิจของเรา",
                                    desc: "ส่งมอบบริการ Cloud Hosting ที่เร็วและเสถียรที่สุด เพื่อให้ธุรกิจของคุณเติบโตได้อย่างไร้ขีดจำกัด",
                                    color: "from-blue-500 to-cyan-500",
                                },
                                {
                                    icon: Lightbulb,
                                    title: "นวัตกรรม",
                                    desc: "เราไม่หยุดที่จะพัฒนาและนำเทคโนโลยีใหม่ล่าสุดมาปรับใช้ เพื่อให้คุณได้ใช้โครงสร้างพื้นฐานที่ทันสมัยที่สุดเสมอ",
                                    color: "from-amber-500 to-orange-500",
                                },
                                {
                                    icon: Users,
                                    title: "ลูกค้าตือกุญแจสำคัญ",
                                    desc: "ความสำเร็จของคุณคือความสำเร็จของเรา เราจึงทุ่มเทให้กับการบริการลูกค้าและการสนับสนุนตลอด 24 ชั่วโมง",
                                    color: "from-emerald-500 to-green-500",
                                },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1, duration: 0.5 }}
                                    className="bg-card/40 backdrop-blur-md border border-border/50 p-8 rounded-[2rem] hover:bg-card/60 transition-colors group"
                                >
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                                        <item.icon className="h-7 w-7" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-foreground mb-4">{item.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-20 relative overflow-hidden bg-primary/5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                            {[
                                { label: "ลูกค้าที่ไว้วางใจ", value: "10,000+" },
                                { label: "เว็บไซต์ออนไลน์", value: "50,000+" },
                                { label: "ประเทศที่ให้บริการ", value: "25+" },
                                { label: "Uptime Guarantee", value: "99.9%" },
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1, duration: 0.5 }}
                                >
                                    <div className="text-4xl md:text-5xl font-bold text-foreground mb-2 font-heading">{stat.value}</div>
                                    <div className="text-muted-foreground">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Team Section Placeholder */}
                <section className="py-24 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto text-center">
                        <h2 className="text-4xl font-bold text-foreground mb-16 font-heading">ทีมงานผู้บริหาร</h2>
                        <div className="grid md:grid-cols-3 gap-10">
                            {/* Team Member 1 */}
                            <div className="group">
                                <div className="relative w-64 h-64 mx-auto mb-6 rounded-full overflow-hidden border-4 border-background shadow-2xl">
                                    <div className="absolute inset-0 bg-gray-200 animate-pulse" /> {/* Placeholder Image */}
                                    {/* <img src="/team-1.jpg" alt="CEO" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> */}
                                </div>
                                <h3 className="text-xl font-bold text-foreground">คุณสมชาย ใจดี</h3>
                                <p className="text-primary font-medium mb-4">CEO & Founder</p>
                                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                    มีประสบการณ์กว่า 15 ปีในวงการ Web Hosting และมุ่งมั่นที่จะยกระดับมาตรฐานอุตสาหกรรม
                                </p>
                            </div>

                            {/* Team Member 2 */}
                            <div className="group">
                                <div className="relative w-64 h-64 mx-auto mb-6 rounded-full overflow-hidden border-4 border-background shadow-2xl">
                                    <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">คุณสมหญิง รักงาน</h3>
                                <p className="text-primary font-medium mb-4">CTO</p>
                                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                    ผู้เชี่ยวชาญด้าน Cloud Infrastructure และ System Security ผู้อยู่เบื้องหลังความเสถียรของระบบ
                                </p>
                            </div>

                            {/* Team Member 3 */}
                            <div className="group">
                                <div className="relative w-64 h-64 mx-auto mb-6 rounded-full overflow-hidden border-4 border-background shadow-2xl">
                                    <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">คุณวิชัย เก่งกาจ</h3>
                                <p className="text-primary font-medium mb-4">Head of Support</p>
                                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                    ดูแลทีมงาน Support เพื่อให้มั่นใจว่าลูกค้าทุกคนจะได้รับการช่วยเหลือที่รวดเร็วและประทับใจ
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    )
}
