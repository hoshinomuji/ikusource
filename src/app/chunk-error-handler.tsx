"use client"

import { useEffect } from "react"
import { toast } from "sonner"

/**
 * Global error handler for chunk loading errors
 * This component should be included in the root layout
 */
export function ChunkErrorHandler() {
    useEffect(() => {
        // Handle unhandled promise rejections (chunk loading errors)
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const error = event.reason
            const errorMessage = error?.message || String(error) || ""

            // Check for chunk loading errors
            if (
                errorMessage.includes("Failed to load chunk") ||
                errorMessage.includes("525") ||
                errorMessage.includes("chunk") ||
                errorMessage.includes("ECONNREFUSED") ||
                errorMessage.includes("SSL") ||
                errorMessage.includes("TLS")
            ) {
                console.error("Chunk loading error detected:", error)
                
                // Prevent default error handling
                event.preventDefault()

                // Show user-friendly error message
                toast.error("เกิดข้อผิดพลาดในการโหลดไฟล์", {
                    description: "ไม่สามารถโหลดไฟล์ JavaScript ได้ กรุณาลอง refresh หน้าเว็บ",
                    duration: 10000,
                    action: {
                        label: "Refresh",
                        onClick: () => window.location.reload(),
                    },
                })
            }
        }

        // Handle general errors
        const handleError = (event: ErrorEvent) => {
            const errorMessage = event.message || ""

            // Check for chunk loading errors
            if (
                errorMessage.includes("Failed to load chunk") ||
                errorMessage.includes("525") ||
                errorMessage.includes("chunk")
            ) {
                console.error("Chunk loading error detected:", event.error)
                
                // Prevent default error handling
                event.preventDefault()

                // Show user-friendly error message
                toast.error("เกิดข้อผิดพลาดในการโหลดไฟล์", {
                    description: "ไม่สามารถโหลดไฟล์ JavaScript ได้ กรุณาลอง refresh หน้าเว็บ",
                    duration: 10000,
                    action: {
                        label: "Refresh",
                        onClick: () => window.location.reload(),
                    },
                })
            }
        }

        // Add event listeners
        window.addEventListener("unhandledrejection", handleUnhandledRejection)
        window.addEventListener("error", handleError)

        // Cleanup
        return () => {
            window.removeEventListener("unhandledrejection", handleUnhandledRejection)
            window.removeEventListener("error", handleError)
        }
    }, [])

    return null
}

