"use client"

import { Button } from "@/components/ui/button"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, PlayCircle } from "lucide-react"
import Link from "next/link"
import { useRef } from "react"

export function HeroNew({ userCount = 0 }: { userCount?: number }) {
  const ref = useRef(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section 
      ref={ref} 
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black text-white"
    >
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-55 scale-105"
          style={{ backgroundImage: 'url("/images/world-blackground.jpg")', filter: "brightness(1.35) contrast(1.25)" }}
        />
        {/* Stronger Gradient Overlays for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/75" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-65" />
        

      </div>

      {/* Main Content */}
      <div className="container relative z-10 px-4 md:px-6 w-full max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div
          style={{ y, opacity }}
          className="flex min-h-screen flex-col items-center justify-center gap-8 md:gap-12"
        >
          {/* Headline - High Contrast */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase leading-[0.9] text-white drop-shadow-2xl"
          >
            <span className="block text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              Future
            </span>
            <span className="block text-gray-300 drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]">
              Is Here
            </span>
          </motion.h1>

          {/* Subtitle - Better Readability */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="max-w-2xl text-lg sm:text-xl md:text-2xl text-gray-300 font-light leading-relaxed drop-shadow-lg"
          >
            Deploy your applications to the edge with our enterprise-grade cloud infrastructure. 
            <span className="text-white font-semibold glow-text"> 99.99% Uptime</span> guaranteed.
          </motion.p>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto mt-6"
          >
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-lg rounded-full bg-black text-white border border-white/30 hover:bg-white/10 transition-all font-bold tracking-tight shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="#features" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-10 text-lg rounded-full border-white/20 text-white hover:bg-white/10 backdrop-blur-sm transition-all hover:border-white/40 shadow-lg bg-black/30">
                <PlayCircle className="mr-2 w-5 h-5" />
                Live Demo
              </Button>
            </Link>
          </motion.div>

        </motion.div>
      </div>

      {/* Stats Bar - Anchored at bottom so headline stays centered */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="pointer-events-none absolute bottom-6 left-1/2 z-10 w-[92%] max-w-6xl -translate-x-1/2 rounded-xl border border-white/10 bg-black/20 p-6 backdrop-blur-sm md:p-8"
      >
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-16">
          {[
            { label: "Active Users", value: "10K+", suffix: "" },
            { label: "Global Locations", value: "25", suffix: "+" },
            { label: "Uptime SLA", value: "99.99", suffix: "%" },
            { label: "Support", value: "24/7", suffix: "" },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-3xl font-black tracking-tighter tabular-nums text-white drop-shadow-xl md:text-5xl">
                {stat.value}<span className="text-xl text-gray-400 md:text-3xl">{stat.suffix}</span>
              </span>
              <span className="mt-2 text-xs font-semibold uppercase tracking-widest text-gray-400 md:text-sm">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
