import { Metadata } from "next"
import ForgotPasswordForm from "./forgot-password-form"

export const metadata: Metadata = {
    title: "ลืมรหัสผ่าน | Ikuzen Studio",
    description: "ขอเปลี่ยนรหัสผ่านใหม่",
}

export default function ForgotPasswordPage() {
    return <ForgotPasswordForm />
}
