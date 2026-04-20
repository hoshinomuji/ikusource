"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{ padding: 24, fontFamily: "sans-serif" }}>
          <h2>Something went wrong</h2>
          <p>We have logged this error and will investigate it.</p>
          <button onClick={() => reset()} style={{ marginTop: 12 }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}

