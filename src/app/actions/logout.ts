"use server"

import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { clearAuthCookies } from "@/lib/session"

export async function logout() {
    const cookieStore = await cookies()
    clearAuthCookies(cookieStore)

    redirect("/login")
}
