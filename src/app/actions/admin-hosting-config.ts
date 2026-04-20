"use server"
import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { db } from "@/db"
import { users, directAdminConfig } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { DirectAdminClient } from "@/lib/directadmin"
import { encryptSecret } from "@/lib/secret-crypto"

const configSchema = z.object({
  resellerUsername: z.string().min(1, "Reseller username is required"),
  resellerPassword: z.string().min(1, "Reseller password is required"),
  serverIp: z.string().min(1, "Server IP is required"),
  panelUrl: z.string().url("Invalid panel URL"),
  nameserver1: z.string().min(1, "Nameserver 1 is required"),
  nameserver2: z.string().min(1, "Nameserver 2 is required"),
  isActive: z.boolean().default(true),
})

const updateConfigSchema = configSchema.extend({
  resellerPassword: z.string().optional(),
})

async function checkAdmin() {
  const cookieStore = await cookies()
  const userId = await getSessionUserIdValue(cookieStore)

  if (!userId) return { isAdmin: false, error: "Not authenticated" }

  const userIdNum = parseInt(userId)
  const user = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userIdNum))
    .limit(1)

  if (!user || user.length === 0 || user[0].role !== "admin") {
    return { isAdmin: false, error: "Unauthorized" }
  }

  return { isAdmin: true }
}

export async function createDirectAdminConfig(formData: FormData) {
  try {
    const adminCheck = await checkAdmin()
    if (!adminCheck.isAdmin) return { success: false, error: adminCheck.error || "Unauthorized" }

    const rawData = {
      resellerUsername: formData.get("resellerUsername") as string,
      resellerPassword: formData.get("resellerPassword") as string,
      serverIp: formData.get("serverIp") as string,
      panelUrl: formData.get("panelUrl") as string,
      nameserver1: formData.get("nameserver1") as string,
      nameserver2: formData.get("nameserver2") as string,
      isActive: formData.get("isActive") === "true",
    }

    const validation = configSchema.safeParse(rawData)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message }
    }

    const result = await db
      .insert(directAdminConfig)
      .values({
        ...validation.data,
        resellerPassword: encryptSecret(validation.data.resellerPassword),
      })
      .returning({ id: directAdminConfig.id })

    revalidatePath("/dashboard/admin/hosting/config")
    return { success: true, message: "DirectAdmin configuration created successfully", data: result[0]?.id || null }
  } catch (error) {
    console.error("Error creating DirectAdmin config:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to create configuration" }
  }
}

export async function updateDirectAdminConfig(formData: FormData) {
  try {
    const adminCheck = await checkAdmin()
    if (!adminCheck.isAdmin) return { success: false, error: adminCheck.error || "Unauthorized" }

    const id = parseInt(formData.get("id") as string)
    if (!id) return { success: false, error: "Configuration ID is required" }

    const rawData = {
      resellerUsername: formData.get("resellerUsername") as string,
      resellerPassword: (formData.get("resellerPassword") as string) || undefined,
      serverIp: formData.get("serverIp") as string,
      panelUrl: formData.get("panelUrl") as string,
      nameserver1: formData.get("nameserver1") as string,
      nameserver2: formData.get("nameserver2") as string,
      isActive: formData.get("isActive") === "true",
    }

    const validation = updateConfigSchema.safeParse(rawData)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message }
    }

    const existing = await db
      .select({ resellerPassword: directAdminConfig.resellerPassword })
      .from(directAdminConfig)
      .where(eq(directAdminConfig.id, id))
      .limit(1)

    if (!existing.length) return { success: false, error: "Configuration not found" }

    const nextPassword = validation.data.resellerPassword && validation.data.resellerPassword.trim().length > 0
      ? encryptSecret(validation.data.resellerPassword.trim())
      : existing[0].resellerPassword

    await db
      .update(directAdminConfig)
      .set({
        resellerUsername: validation.data.resellerUsername,
        resellerPassword: nextPassword,
        serverIp: validation.data.serverIp,
        panelUrl: validation.data.panelUrl,
        nameserver1: validation.data.nameserver1,
        nameserver2: validation.data.nameserver2,
        isActive: validation.data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(directAdminConfig.id, id))

    revalidatePath("/dashboard/admin/hosting/config")
    return { success: true, message: "DirectAdmin configuration updated successfully" }
  } catch (error) {
    console.error("Error updating DirectAdmin config:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to update configuration" }
  }
}

export async function deleteDirectAdminConfig(configId: number) {
  try {
    const adminCheck = await checkAdmin()
    if (!adminCheck.isAdmin) return { success: false, error: adminCheck.error || "Unauthorized" }

    await db.delete(directAdminConfig).where(eq(directAdminConfig.id, configId))

    revalidatePath("/dashboard/admin/hosting/config")
    return { success: true, message: "DirectAdmin configuration deleted successfully" }
  } catch (error) {
    console.error("Error deleting DirectAdmin config:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete configuration" }
  }
}

export async function testDirectAdminConnection(configId: number) {
  try {
    const adminCheck = await checkAdmin()
    if (!adminCheck.isAdmin) {
      return { success: false, error: adminCheck.error || "Unauthorized", details: ["Permission denied"] }
    }

    const config = await db
      .select()
      .from(directAdminConfig)
      .where(eq(directAdminConfig.id, configId))
      .limit(1)

    if (!config || config.length === 0) {
      return { success: false, error: "เนเธกเนเธเธเธเธฒเธฃเธ•เธฑเนเธเธเนเธฒ DirectAdmin", details: ["Configuration not found"] }
    }

    const daClient = new DirectAdminClient({
      resellerUsername: config[0].resellerUsername,
      resellerPassword: config[0].resellerPassword,
      serverIp: config[0].serverIp,
      panelUrl: config[0].panelUrl,
    })

    const result = await daClient.testConnection()
    return {
      success: result.success,
      message: result.message,
      details: [
        `Panel URL: ${config[0].panelUrl}`,
        `Server IP: ${config[0].serverIp}`,
        `Reseller: ${config[0].resellerUsername}`,
      ],
    }
  } catch (error) {
    console.error("Error testing DirectAdmin connection:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to test connection",
      details: ["Unexpected error during connection test"],
    }
  }
}

