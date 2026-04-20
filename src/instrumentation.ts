import * as Sentry from "@sentry/nextjs"

export const runtime = "nodejs"

export const onRequestError = Sentry.captureRequestError

export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        await import("../sentry.server.config")
    }

    if (process.env.NEXT_RUNTIME === "edge") {
        await import("../sentry.edge.config")
    }

    // Keep this entry file extremely dependency-light.
    // Next builds can compile instrumentation under a non-Node layer; importing DB/libs here can break builds.
    if (process.env.NEXT_RUNTIME !== "nodejs") return

    // Default off for stability; enable explicitly when you really want the in-process scheduler.
    if (process.env.ENABLE_INTERNAL_SCHEDULER !== "true") return

    // Avoid static import so webpack doesn't eagerly traverse Node-only dependencies during build.
    // eslint-disable-next-line no-eval
    const node = await (0, eval)("import('./instrumentation.node')")
    await node.register()
}
