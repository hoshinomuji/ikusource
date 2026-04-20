import { Metadata } from "next"
import { Suspense } from "react"
import ResetPasswordForm from "./reset-password-form"

export const metadata: Metadata = {
    title: "ตั้งรหัสผ่านใหม่ | Ikuzen Studio",
    description: "กำหนดรหัสผ่านใหม่สำหรับเข้าใช้งาน",
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen w-full flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">กำลังโหลด...</p>
                </div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    )
}
