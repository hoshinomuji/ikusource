import { getSessionUserIdValue } from "@/lib/session"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { TwoFactorSetup } from "@/components/dashboard/two-factor-setup"
import { Separator } from "@/components/ui/separator"
import { Shield, Lock, KeyRound } from "lucide-react"

export const metadata = {
    title: "ศูนย์ความปลอดภัย - Dashboard",
}

export default async function SecurityPage() {
    const cookieStore = await cookies()
    const userId = await getSessionUserIdValue(cookieStore)

    if (!userId) {
        redirect("/login")
    }

    const userIdNum = parseInt(userId)

    const user = await db.query.users.findFirst({
        where: eq(users.id, userIdNum),
        columns: {
            id: true,
            email: true,
            twoFactorEnabled: true,
        },
    })

    if (!user) {
        redirect("/login")
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg">
                        <Shield className="h-6 w-6 text-white" />
                    </div>
                    ศูนย์ความปลอดภัย
                </h1>
                <p className="text-muted-foreground mt-2 text-base">
                    ปกป้องบัญชีของคุณด้วยการยืนยันตัวตนสองขั้นตอน (2FA)
                </p>
            </div>

            <Separator className="my-6" />

            {/* 2FA Section */}
            <TwoFactorSetup user={user} />
        </div>
    )
}
