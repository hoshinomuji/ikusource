import type React from "react"
import type { Metadata } from "next"
import { IBM_Plex_Sans_Thai } from "next/font/google"
// import { Analytics } from "@vercel/analytics/next" // Disabled - not using Vercel
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { getWebsiteSettings } from "@/app/actions/settings"
import { GlobalErrorBoundary } from "@/components/global-error-boundary"
import { TranslationProvider } from "@/components/translation-provider"
import { ChunkErrorHandler } from "./chunk-error-handler"
import "./globals.css"

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ["latin", "thai"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans-thai",
  display: "swap",
})

export async function generateMetadata(): Promise<Metadata> {
  // Use fallback values if getWebsiteSettings fails (e.g., during build without DB)
  let settings
  try {
    settings = await getWebsiteSettings()
  } catch (error) {
    console.warn("Failed to fetch website settings in generateMetadata, using fallbacks:", error)
    settings = {
      logoUrl: "",
      storeName: process.env.NEXT_PUBLIC_STORE_NAME || "Ikuzen Studio",
      websiteTitle: `${process.env.NEXT_PUBLIC_STORE_NAME || "Ikuzen Studio"} - Lightning-Fast Cloud Hosting`,
      description: "",
    }
  }

  const title = settings.storeName || settings.websiteTitle || "Ikuzen Studio - Lightning-Fast Cloud Hosting"
  const description = settings.description || "Enterprise-grade cloud hosting with 99.9% uptime guarantee. Deploy your websites and applications with unmatched speed, security, and scalability."

  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    keywords: ["cloud hosting", "vps", "web hosting", "domain names", "ssl certificates", "fast hosting", "secure hosting", "server", "hosting thailand"],
    authors: [{ name: "Ikuzen Studio Team" }],
    creator: "Ikuzen Studio",
    publisher: "Ikuzen Studio",
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com"),
    openGraph: {
      title: title,
      description: description,
      url: process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com",
      siteName: title,
      locale: "th_TH",
      type: "website",
      images: [
        {
          url: settings.logoUrl || "/og-image.jpg", // Fallback image
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [settings.logoUrl || "/og-image.jpg"],
      creator: "@ikuzenstudio",
    },
    icons: {
      icon: [
        // Use logo from settings if available
        ...(settings.logoUrl && settings.logoUrl.trim() ? [
          {
            url: settings.logoUrl,
            type: settings.logoUrl.endsWith('.svg') ? "image/svg+xml" : "image/png",
          },
        ] : [
          {
            url: "/icon-light-32x32.png",
            media: "(prefers-color-scheme: light)",
          },
          {
            url: "/icon-dark-32x32.png",
            media: "(prefers-color-scheme: dark)",
          },
          {
            url: "/icon.svg",
            type: "image/svg+xml",
          },
        ]),
      ],
      apple: settings.logoUrl && settings.logoUrl.trim() ? settings.logoUrl : "/apple-icon.png",
    },
  }
}

export const viewport = {
  themeColor: "#0ea5e9",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${ibmPlexSansThai.variable} font-sans antialiased`}>
        <GlobalErrorBoundary>
          <ChunkErrorHandler />
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <TranslationProvider>
              {children}
              <Toaster />
            </TranslationProvider>
          </ThemeProvider>
        </GlobalErrorBoundary>
        {/* <Analytics /> Disabled - not using Vercel */}
      </body>
    </html>
  )
}
