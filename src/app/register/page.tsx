import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import RegisterForm from "./register-form"
import { hasValidSession } from "@/lib/session"

export const metadata = {
    title: "สมัครสมาชิก | Ikuzen Studio",
    description: "สร้างบัญชีใหม่เพื่อเริ่มต้นใช้งาน",
}

export default async function RegisterPage() {
    const cookieStore = await cookies()
    if (await hasValidSession(cookieStore)) {
        redirect("/dashboard")
    }

    return <RegisterForm />
}
