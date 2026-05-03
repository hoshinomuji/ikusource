import path from "node:path"
import { fileURLToPath } from "node:url"
import { withSentryConfig } from "@sentry/nextjs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
// Force restart
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    // unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
      {
        protocol: 'https',
        hostname: 'img2.pic.in.th',
      },
      {
        protocol: 'https',
        hostname: '*.pic.in.th',
      },
    ],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // swcMinify is deprecated in Next.js 16 - SWC is used by default
  output: 'standalone', // Required for Docker/Coolify deployment
  outputFileTracingRoot: __dirname,
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.56.1'],
  // Improve chunk loading reliability
  experimental: {
    // Enable better error handling for chunk loading
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // Increase server actions timeout for DirectAdmin API calls
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  // Keep Turbopack happy even when a webpack config exists.
  turbopack: {},
  // Increase timeout for server actions (default is 30s which is too short for DirectAdmin)
  serverExternalPackages: ['undici'],
  // Add headers for better caching and error handling
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          }
        ]
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  webpack: (config, { dev, isServer }) => {
    // Work around intermittent ENOENT issues from filesystem pack cache on Windows.
    if (dev) {
      config.cache = false
    }

    // In webpack builds, `node:`-prefixed built-ins can trip the resolver in some setups.
    // Externalize them for server builds so they are required at runtime by Node.
    if (isServer) {
      config.externals.push(({ request }, callback) => {
        if (typeof request === "string" && request.startsWith("node:")) {
          return callback(null, `commonjs ${request.slice("node:".length)}`)
        }
        callback()
      })
    }

    return config
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  tunnelRoute: "/monitoring",
  widenClientFileUpload: true,
})
