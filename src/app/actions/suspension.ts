"use server"

import { db } from "@/db"
import { services, hostingOrders, hostingPackages, directAdminConfig } from "@/db/schema"
import { eq, and, lt } from "drizzle-orm"
import { DirectAdminClient } from "@/lib/directadmin"
import { revalidatePath } from "next/cache"

interface SuspensionResult {
  serviceId: number
  domain: string
  username: string
  success: boolean
  error?: string
}

function formatThaiTime(date: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "short",
    timeStyle: "medium",
    hour12: false,
  }).format(date)
}

async function getDirectAdminConfig(configId?: number) {
  const config = configId
    ? await db.select().from(directAdminConfig).where(eq(directAdminConfig.id, configId)).limit(1)
    : await db.select().from(directAdminConfig).where(eq(directAdminConfig.isActive, true)).limit(1)

  if (!config || config.length === 0) {
    throw new Error("ไม่พบการตั้งค่า DirectAdmin")
  }

  return config[0]
}

export async function suspendExpiredHostingAccounts(graceDays: number = 0, isBackgroundJob: boolean = false): Promise<{
  success: boolean
  message: string
  results: SuspensionResult[]
  totalChecked: number
  totalSuspended: number
  totalFailed: number
}> {
  const results: SuspensionResult[] = []
  const now = new Date()
  const cutoffDate = new Date(now)
  cutoffDate.setDate(cutoffDate.getDate() - graceDays)

  console.log(`[Suspension Check] Starting at TH=${formatThaiTime(now)} UTC=${now.toISOString()}`)
  console.log(`[Suspension Check] Grace period=${graceDays}d Cutoff TH=${formatThaiTime(cutoffDate)} UTC=${cutoffDate.toISOString()}`)

  try {
    const expiredServices = await db
      .select({
        serviceId: services.id,
        serviceName: services.name,
      })
      .from(services)
      .where(and(eq(services.type, "hosting"), eq(services.status, "active"), lt(services.nextDueDate, cutoffDate)))

    console.log(`[Suspension Check] Found ${expiredServices.length} expired services`)

    if (expiredServices.length === 0) {
      return { success: true, message: "No expired services found", results: [], totalChecked: 0, totalSuspended: 0, totalFailed: 0 }
    }

    for (const service of expiredServices) {
      try {
        const order = await db
          .select({
            domain: hostingOrders.domain,
            directAdminUsername: hostingOrders.directAdminUsername,
            packageId: hostingOrders.packageId,
          })
          .from(hostingOrders)
          .where(eq(hostingOrders.serviceId, service.serviceId))
          .limit(1)

        if (!order || order.length === 0) {
          results.push({ serviceId: service.serviceId, domain: service.serviceName, username: "unknown", success: false, error: "No hosting order found" })
          continue
        }

        const pkg = await db
          .select({ configId: hostingPackages.configId })
          .from(hostingPackages)
          .where(eq(hostingPackages.id, order[0].packageId))
          .limit(1)

        if (!pkg || pkg.length === 0) {
          results.push({ serviceId: service.serviceId, domain: order[0].domain, username: order[0].directAdminUsername, success: false, error: "Package not found" })
          continue
        }

        const daConfig = await getDirectAdminConfig(pkg[0].configId || undefined)
        const daClient = new DirectAdminClient({
          resellerUsername: daConfig.resellerUsername,
          resellerPassword: daConfig.resellerPassword,
          serverIp: daConfig.serverIp,
          panelUrl: daConfig.panelUrl,
        })

        const suspendResult = await daClient.suspendAccount(order[0].directAdminUsername)
        const success = suspendResult.success || suspendResult.message.toLowerCase().includes("suspended")

        results.push({
          serviceId: service.serviceId,
          domain: order[0].domain,
          username: order[0].directAdminUsername,
          success,
          error: suspendResult.success ? undefined : suspendResult.message,
        })

        await db.update(services).set({ status: "suspended" }).where(eq(services.id, service.serviceId))
        await db.update(hostingOrders).set({ status: "suspended" }).where(eq(hostingOrders.serviceId, service.serviceId))
      } catch (error) {
        results.push({
          serviceId: service.serviceId,
          domain: service.serviceName,
          username: "unknown",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    const totalSuspended = results.filter((r) => r.success).length
    const totalFailed = results.filter((r) => !r.success).length

    console.log(`[Suspension Check] Completed. Suspended: ${totalSuspended}, Failed: ${totalFailed}`)

    if (!isBackgroundJob) {
      revalidatePath("/dashboard/admin")
      revalidatePath("/dashboard/admin/services")
      revalidatePath("/dashboard/services")
    }

    return {
      success: true,
      message: `Processed ${expiredServices.length} expired services. Suspended: ${totalSuspended}, Failed: ${totalFailed}`,
      results,
      totalChecked: expiredServices.length,
      totalSuspended,
      totalFailed,
    }
  } catch (error) {
    console.error("[Suspension Check] Fatal error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to check expired services",
      results: [],
      totalChecked: 0,
      totalSuspended: 0,
      totalFailed: 0,
    }
  }
}

export async function suspendHostingService(serviceId: number): Promise<{ success: boolean; message: string }> {
  try {
    const order = await db
      .select({ packageId: hostingOrders.packageId, domain: hostingOrders.domain, username: hostingOrders.directAdminUsername })
      .from(hostingOrders)
      .where(eq(hostingOrders.serviceId, serviceId))
      .limit(1)

    if (!order || order.length === 0) return { success: false, message: "Hosting order not found" }

    const pkg = await db
      .select({ configId: hostingPackages.configId })
      .from(hostingPackages)
      .where(eq(hostingPackages.id, order[0].packageId))
      .limit(1)

    if (!pkg || pkg.length === 0) return { success: false, message: "Package not found" }

    const daConfig = await getDirectAdminConfig(pkg[0].configId || undefined)
    const daClient = new DirectAdminClient({
      resellerUsername: daConfig.resellerUsername,
      resellerPassword: daConfig.resellerPassword,
      serverIp: daConfig.serverIp,
      panelUrl: daConfig.panelUrl,
    })

    const result = await daClient.suspendAccount(order[0].username)
    if (!result.success) return { success: false, message: result.message }

    await db.update(services).set({ status: "suspended" }).where(eq(services.id, serviceId))
    await db.update(hostingOrders).set({ status: "suspended" }).where(eq(hostingOrders.serviceId, serviceId))

    revalidatePath("/dashboard/admin/services")
    revalidatePath("/dashboard/services")
    return { success: true, message: "Hosting service suspended successfully" }
  } catch (error) {
    console.error("Error suspending hosting service:", error)
    return { success: false, message: error instanceof Error ? error.message : "Failed to suspend hosting service" }
  }
}

export async function unsuspendHostingService(serviceId: number): Promise<{ success: boolean; message: string }> {
  try {
    const order = await db
      .select({ packageId: hostingOrders.packageId, username: hostingOrders.directAdminUsername })
      .from(hostingOrders)
      .where(eq(hostingOrders.serviceId, serviceId))
      .limit(1)

    if (!order || order.length === 0) return { success: false, message: "Hosting order not found" }

    const pkg = await db
      .select({ configId: hostingPackages.configId })
      .from(hostingPackages)
      .where(eq(hostingPackages.id, order[0].packageId))
      .limit(1)

    if (!pkg || pkg.length === 0) return { success: false, message: "Package not found" }

    const daConfig = await getDirectAdminConfig(pkg[0].configId || undefined)
    const daClient = new DirectAdminClient({
      resellerUsername: daConfig.resellerUsername,
      resellerPassword: daConfig.resellerPassword,
      serverIp: daConfig.serverIp,
      panelUrl: daConfig.panelUrl,
    })

    const result = await daClient.unsuspendAccount(order[0].username)
    if (!result.success) return { success: false, message: result.message }

    await db.update(services).set({ status: "active" }).where(eq(services.id, serviceId))
    await db.update(hostingOrders).set({ status: "active" }).where(eq(hostingOrders.serviceId, serviceId))

    revalidatePath("/dashboard/admin/services")
    revalidatePath("/dashboard/services")
    return { success: true, message: "Hosting service unsuspended successfully" }
  } catch (error) {
    console.error("Error unsuspending hosting service:", error)
    return { success: false, message: error instanceof Error ? error.message : "Failed to unsuspend hosting service" }
  }
}

