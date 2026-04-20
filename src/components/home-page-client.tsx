"use client"

import { useEffect, useState } from "react"
import { Features } from "@/components/features"
import { LandingPackages } from "@/components/landing-packages"
import { ComparisonTable } from "@/components/comparison-table"
import { CookieConsent } from "@/components/cookie-consent"
import { SmoothScroll } from "@/components/smooth-scroll"

import { HeroNew } from "@/components/hero-new"

interface HostingPackage {
  id: number
  name: string
  description: string | null
  price: string
  diskSpace: string
  bandwidth: string
  domains: string
  subdomains: string
  emailAccounts: string
  databases: string
  ftpAccounts: string
  billingCycle: string | null
}

interface NewsItem {
  id: number
  title: string
  content: string
  type: string
  createdAt: Date
}

interface HomePageClientProps {
  selectedPackages: HostingPackage[]
  comparisonPackages: HostingPackage[]
  userCount?: number
  news?: NewsItem[]
}

export function HomePageClient({ selectedPackages, comparisonPackages, userCount = 0, news = [] }: HomePageClientProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/20 selection:text-primary">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg transition-transform">
          ข้ามไปยังเนื้อหาหลัก
        </a>

        <HeroNew userCount={userCount} />

        <main id="main-content" role="main" className="relative z-10" data-news-count={news.length}>
          <Features />
          <LandingPackages packages={selectedPackages} comparisonPackages={comparisonPackages} />
          <ComparisonTable packages={comparisonPackages.length > 0 ? comparisonPackages : selectedPackages} />
        </main>

        <CookieConsent />
      </div>
    </SmoothScroll>
  )
}
