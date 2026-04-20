"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Phone, Mail, Clock, Send, MessageSquare } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
            <Navbar />

            <main className="pt-24 pb-20">
                <section className="relative px-4 sm:px-6 lg:px-8">
                    {/* Background Decor */}
                    <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl opacity-50 pointer-events-none" />

                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-16"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                                <MessageSquare className="h-4 w-4" />
                                ติดต่อเรา
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 font-heading tracking-tight">
                                พูดคุยกับ <span className="text-gradient from-primary to-accent bg-clip-text text-transparent bg-gradient-to-r">ทีมงานของเรา</span>
                            </h1>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                                มีข้อสงสัยหรือต้องการความช่วยเหลือ? ทีมงานผู้เชี่ยวชาญของเราพร้อมให้บริการคุณตลอด 24 ชั่วโมง
                            </p>
                        </motion.div>

                        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
                            {/* Contact Information */}
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="space-y-8"
                            >
                                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
                                    <h3 className="text-2xl font-bold text-foreground mb-6">ช่องทางการติดต่อ</h3>

                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0">
                                                <MapPin className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-foreground mb-1">ที่อยู่บริษัท</h4>
                                                <p className="text-muted-foreground leading-relaxed">
                                                    123 อาคารทาวเวอร์, ชั้น 15<br />
                                                    ถนนสุขุมวิท, แขวงคลองเตยเหนือ<br />
                                                    เขตวัฒนา, กรุงเทพฯ 10110
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-2xl bg-accent/10 text-accent-foreground shrink-0">
                                                <Mail className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-foreground mb-1">อีเมล</h4>
                                                <a href="mailto:support@ikuzen.studio" className="text-muted-foreground hover:text-primary transition-colors">
                                                    support@ikuzen.studio
                                                </a>
                                                <br />
                                                <a href="mailto:sales@ikuzen.studio" className="text-muted-foreground hover:text-primary transition-colors">
                                                    sales@ikuzen.studio
                                                </a>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 shrink-0">
                                                <Phone className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-foreground mb-1">โทรศัพท์</h4>
                                                <a href="tel:02-123-4567" className="text-muted-foreground hover:text-primary transition-colors">
                                                    02-123-4567
                                                </a>
                                                <p className="text-small text-muted-foreground mt-1">(จันทร์ - ศุกร์, 09:00 - 18:00)</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 shrink-0">
                                                <Clock className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-foreground mb-1">เวลาทำการ Support</h4>
                                                <p className="text-emerald-500 font-medium">เปิดบริการ 24 ชั่วโมง ทุกวัน</p>
                                                <p className="text-sm text-muted-foreground">ทีมงานเทคนิคพร้อมช่วยเหลือตลอดเวลา</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Map Placeholder or Additional Info */}
                                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 h-64 flex items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=13.7563,100.5018&zoom=13&size=600x300&maptype=roadmap&style=feature:all|saturation:-100|lightness:30')] opacity-50 bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                                    <Button variant="outline" className="relative z-10 bg-background/80 backdrop-blur border-primary/20 hover:border-primary">
                                        <MapPin className="mr-2 h-4 w-4" /> ดูแผนที่ Google Maps
                                    </Button>
                                </div>
                            </motion.div>

                            {/* Contact Form */}
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                            >
                                <div className="bg-card shadow-lg shadow-primary/5 border border-border rounded-[2.5rem] p-8 lg:p-10 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-[100px] pointer-events-none" />

                                    <h3 className="text-2xl font-bold text-foreground mb-2">ส่งข้อความถึงเรา</h3>
                                    <p className="text-muted-foreground mb-8">กรอกข้อมูลด้านล่าง ทีมงานจะติดต่อกลับภายใน 15 นาที</p>

                                    <form className="space-y-6">
                                        <div className="grid sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label htmlFor="name" className="text-sm font-medium text-foreground">ชื่อ-นามสกุล</label>
                                                <Input id="name" placeholder="สมชาย ใจดี" className="h-12 bg-background/50 border-input/60 focus:bg-background transition-all" />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="email" className="text-sm font-medium text-foreground">อีเมล</label>
                                                <Input id="email" type="email" placeholder="name@example.com" className="h-12 bg-background/50 border-input/60 focus:bg-background transition-all" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="subject" className="text-sm font-medium text-foreground">หัวข้อเรื่อง</label>
                                            <Input id="subject" placeholder="ต้องการสอบถามเกี่ยวกับ..." className="h-12 bg-background/50 border-input/60 focus:bg-background transition-all" />
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="message" className="text-sm font-medium text-foreground">ข้อความ</label>
                                            <Textarea
                                                id="message"
                                                placeholder="รายละเอียดข้อความของคุณ..."
                                                className="min-h-[150px] bg-background/50 border-input/60 focus:bg-background transition-all resize-y"
                                            />
                                        </div>

                                        <Button size="lg" className="w-full h-14 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity rounded-xl shadow-lg shadow-primary/20">
                                            ส่งข้อความ
                                            <Send className="ml-2 h-5 w-5" />
                                        </Button>

                                        <p className="text-xs text-center text-muted-foreground mt-4">
                                            การส่งข้อความแสดงว่าคุณยอมรับ <a href="/privacy-policy" className="underline hover:text-primary">นโยบายความเป็นส่วนตัว</a> ของเรา
                                        </p>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
