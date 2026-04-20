"use client"

import type React from "react"

import { useEffect } from "react"

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Dynamic import to avoid SSR issues
    const loadLenis = async () => {
      const Lenis = (await import("lenis")).default
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      })

      function raf(time: number) {
        lenis.raf(time)
        requestAnimationFrame(raf)
      }

      requestAnimationFrame(raf)
    }

    loadLenis()
  }, [])

  return <>{children}</>
}
