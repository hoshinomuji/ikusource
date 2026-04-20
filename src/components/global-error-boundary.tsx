"use client"

import React, { Component, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RefreshCw } from "lucide-react"

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class GlobalErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("GlobalErrorBoundary caught an error:", error, errorInfo)

        // Handle chunk loading errors specifically
        if (error.message?.includes("Failed to load chunk") || error.message?.includes("525")) {
            console.error("Chunk loading error detected, attempting to reload page...")
            // Don't auto-reload, let user decide
        }
    }

    handleReload = () => {
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            const isChunkError = this.state.error?.message?.includes("Failed to load chunk") ||
                this.state.error?.message?.includes("525") ||
                this.state.error?.message?.includes("chunk")

            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
                    <Card className="max-w-md w-full">
                        <CardHeader>
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                                <CardTitle className="text-red-600 dark:text-red-400">
                                    {isChunkError ? "เกิดข้อผิดพลาดในการโหลดไฟล์" : "เกิดข้อผิดพลาด"}
                                </CardTitle>
                            </div>
                            <CardDescription>
                                {isChunkError
                                    ? "ไม่สามารถโหลดไฟล์ JavaScript ได้ อาจเกิดจากปัญหาเครือข่ายหรือ SSL"
                                    : "เกิดข้อผิดพลาดที่ไม่คาดคิด"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {this.state.error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                    <p className="text-sm text-red-800 dark:text-red-300 font-mono break-all">
                                        {this.state.error.message}
                                    </p>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Button
                                    onClick={this.handleReload}
                                    className="flex-1"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    โหลดหน้าใหม่
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => this.setState({ hasError: false, error: null })}
                                >
                                    ลองอีกครั้ง
                                </Button>
                            </div>
                            {isChunkError && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                    <p>คำแนะนำ:</p>
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                        <li>ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</li>
                                        <li>ลองเคลียร์ cache และ reload หน้าเว็บ</li>
                                        <li>ลองใช้ browser อื่น</li>
                                        <li>ถ้ายังมีปัญหา กรุณาติดต่อผู้ดูแลระบบ</li>
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )
        }

        return this.props.children
    }
}
