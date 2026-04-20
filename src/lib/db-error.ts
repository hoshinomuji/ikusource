export function isRecoverableDbError(error: unknown): boolean {
    const anyErr = error as any
    const code = String(anyErr?.code || anyErr?.cause?.code || "")
    const message = String(anyErr?.message || anyErr?.cause?.message || "")

    return (
        code === "42P01" || // relation does not exist
        code === "ECONNREFUSED" ||
        code === "ETIMEDOUT" ||
        code === "ENOTFOUND" ||
        message.includes("does not exist") ||
        message.includes("ECONNREFUSED")
    )
}
