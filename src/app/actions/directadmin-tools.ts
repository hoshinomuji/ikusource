"use server"
import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { and, asc, desc, eq, inArray, lte } from "drizzle-orm"
import { db } from "@/db"
import {
    directAdminAuditLogs,
    directAdminConfig,
    directAdminQueueJobs,
    hostingOrders,
    hostingPackageTemplates,
    hostingPackages,
    services,
    users,
} from "@/db/schema"
import { DirectAdminClient } from "@/lib/directadmin"

type SessionUser = { id: number; role: string }

type QueueAction = "suspend" | "unsuspend" | "change_package" | "rotate_password" | "sync_status"

type QueuePayload = {
    orderId: number
    packageId?: number
    newPackageName?: string
    newPassword?: string
}

function isMissingTable(error: unknown) {
    const anyErr = error as any
    return anyErr?.code === "42P01" || String(anyErr?.message || "").includes("does not exist")
}

async function getSessionUser(): Promise<SessionUser | null> {
    const cookieStore = await cookies()
    const userId = await getSessionUserIdValue(cookieStore)
    if (!userId) return null
    const id = Number.parseInt(userId)
    if (!Number.isFinite(id)) return null
    const user = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, id)).limit(1)
    return user[0] || null
}

async function requireAdmin(): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
    const user = await getSessionUser()
    if (!user) return { ok: false, error: "Not authenticated" }
    if (user.role !== "admin") return { ok: false, error: "Unauthorized" }
    return { ok: true, user }
}

async function writeAuditLog(input: {
    actorUserId?: number | null
    targetUserId?: number | null
    hostingOrderId?: number | null
    action: string
    status: "success" | "failed"
    message?: string
    metadata?: Record<string, unknown>
}) {
    try {
        await db.insert(directAdminAuditLogs).values({
            actorUserId: input.actorUserId ?? null,
            targetUserId: input.targetUserId ?? null,
            hostingOrderId: input.hostingOrderId ?? null,
            action: input.action,
            status: input.status,
            message: input.message || null,
            metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        })

        if (input.status === "failed" || input.action.startsWith("queue-run:")) {
            try {
                const { sendDiscordNotification } = await import("@/lib/discord-notify")
                await sendDiscordNotification("directadmin", {
                    action: input.action,
                    status: input.status,
                    orderId: input.hostingOrderId || undefined,
                    message: input.message || "",
                })
            } catch {
                // Do not block main flow if webhook fails
            }
        }
    } catch (error) {
        if (!isMissingTable(error)) {
            console.error("Failed to write DirectAdmin audit log:", error)
        }
    }
}

async function getOrderWithConfig(orderId: number) {
    const order = await db
        .select({
            id: hostingOrders.id,
            userId: hostingOrders.userId,
            serviceId: hostingOrders.serviceId,
            packageId: hostingOrders.packageId,
            domain: hostingOrders.domain,
            directAdminUsername: hostingOrders.directAdminUsername,
            directAdminPassword: hostingOrders.directAdminPassword,
            status: hostingOrders.status,
            configId: hostingPackages.configId,
            packageName: hostingPackages.name,
            daPackageName: hostingPackages.directAdminPackageName,
        })
        .from(hostingOrders)
        .leftJoin(hostingPackages, eq(hostingOrders.packageId, hostingPackages.id))
        .where(eq(hostingOrders.id, orderId))
        .limit(1)

    if (!order[0]) {
        return { error: "Hosting order not found" as const }
    }

    const configQuery = order[0].configId
        ? db.select().from(directAdminConfig).where(eq(directAdminConfig.id, order[0].configId!)).limit(1)
        : db.select().from(directAdminConfig).where(eq(directAdminConfig.isActive, true)).limit(1)
    const config = await configQuery
    if (!config[0]) {
        return { error: "DirectAdmin config not found" as const }
    }

    return {
        order: order[0],
        config: config[0],
    }
}

function buildDaClient(config: {
    resellerUsername: string
    resellerPassword: string
    serverIp: string
    panelUrl: string
}) {
    return new DirectAdminClient({
        resellerUsername: config.resellerUsername,
        resellerPassword: config.resellerPassword,
        serverIp: config.serverIp,
        panelUrl: config.panelUrl,
    })
}

async function executeQueueAction(action: QueueAction, payload: QueuePayload) {
    const resolved = await getOrderWithConfig(payload.orderId)
    if ("error" in resolved) {
        return { success: false, error: resolved.error }
    }

    const { order, config } = resolved
    const daClient = buildDaClient(config)

    if (action === "suspend") {
        const result = await daClient.suspendAccount(order.directAdminUsername)
        if (!result.success) return { success: false, error: result.message }
        await db.update(hostingOrders).set({ status: "suspended", updatedAt: new Date() }).where(eq(hostingOrders.id, order.id))
        if (order.serviceId) {
            await db.update(services).set({ status: "suspended" }).where(eq(services.id, order.serviceId))
        }
        return { success: true, message: result.message }
    }

    if (action === "unsuspend") {
        const result = await daClient.unsuspendAccount(order.directAdminUsername)
        if (!result.success) return { success: false, error: result.message }
        await db.update(hostingOrders).set({ status: "active", updatedAt: new Date() }).where(eq(hostingOrders.id, order.id))
        if (order.serviceId) {
            await db.update(services).set({ status: "active" }).where(eq(services.id, order.serviceId))
        }
        return { success: true, message: result.message }
    }

    if (action === "change_package") {
        const packageName = payload.newPackageName || order.daPackageName || undefined
        if (!packageName) return { success: false, error: "Missing DirectAdmin package name" }

        const result = await daClient.changePackage(order.directAdminUsername, packageName)
        if (!result.success) return { success: false, error: result.message }

        if (payload.packageId) {
            await db.update(hostingOrders).set({ packageId: payload.packageId, updatedAt: new Date() }).where(eq(hostingOrders.id, order.id))
        }
        return { success: true, message: result.message }
    }

    if (action === "rotate_password") {
        if (!payload.newPassword) return { success: false, error: "Missing new password" }
        const result = await daClient.changePassword(order.directAdminUsername, payload.newPassword)
        if (!result.success) return { success: false, error: result.message }
        await db
            .update(hostingOrders)
            .set({ directAdminPassword: payload.newPassword, updatedAt: new Date() })
            .where(eq(hostingOrders.id, order.id))
        return { success: true, message: result.message }
    }

    if (action === "sync_status") {
        const result = await daClient.getUserStatus(order.directAdminUsername)
        if (!result.success) return { success: false, error: result.message }

        if (result.data?.suspended === true) {
            await db.update(hostingOrders).set({ status: "suspended", updatedAt: new Date() }).where(eq(hostingOrders.id, order.id))
            if (order.serviceId) await db.update(services).set({ status: "suspended" }).where(eq(services.id, order.serviceId))
        } else if (result.data?.suspended === false) {
            await db.update(hostingOrders).set({ status: "active", updatedAt: new Date() }).where(eq(hostingOrders.id, order.id))
            if (order.serviceId) await db.update(services).set({ status: "active" }).where(eq(services.id, order.serviceId))
        }

        return { success: true, message: "Synced status from DirectAdmin", data: result.data }
    }

    return { success: false, error: "Unsupported action" }
}

export async function queueDirectAdminAction(action: QueueAction, payload: QueuePayload) {
    const admin = await requireAdmin()
    if (!admin.ok) return { success: false, error: admin.error }

    try {
        const [job] = await db
            .insert(directAdminQueueJobs)
            .values({
                action,
                payload: JSON.stringify(payload),
                createdByUserId: admin.user.id,
                runAt: new Date(),
            })
            .returning({ id: directAdminQueueJobs.id })

        await writeAuditLog({
            actorUserId: admin.user.id,
            hostingOrderId: payload.orderId,
            action: `queue:${action}`,
            status: "success",
            message: `Queued job #${job.id}`,
            metadata: payload,
        })

        revalidatePath("/dashboard/admin/hosting")
        return { success: true, jobId: job.id }
    } catch (error) {
        if (isMissingTable(error)) {
            const result = await executeQueueAction(action, payload)
            await writeAuditLog({
                actorUserId: admin.user.id,
                hostingOrderId: payload.orderId,
                action: `direct:${action}`,
                status: result.success ? "success" : "failed",
                message: result.success ? result.message : result.error,
                metadata: payload,
            })
            return result
        }
        console.error("Failed to queue DirectAdmin action:", error)
        return { success: false, error: "Failed to queue action" }
    }
}

export async function processDirectAdminQueue(maxJobs: number = 10) {
    const admin = await requireAdmin()
    if (!admin.ok) return { success: false, error: admin.error }

    try {
        const jobs = await db
            .select()
            .from(directAdminQueueJobs)
            .where(and(eq(directAdminQueueJobs.status, "pending"), lte(directAdminQueueJobs.runAt, new Date())))
            .orderBy(asc(directAdminQueueJobs.createdAt))
            .limit(maxJobs)

        if (jobs.length === 0) {
            return { success: true, processed: 0, succeeded: 0, failed: 0 }
        }

        let succeeded = 0
        let failed = 0

        for (const job of jobs) {
            await db
                .update(directAdminQueueJobs)
                .set({ status: "processing", updatedAt: new Date(), attempts: (job.attempts || 0) + 1 })
                .where(eq(directAdminQueueJobs.id, job.id))

            let payload: QueuePayload
            try {
                payload = JSON.parse(job.payload) as QueuePayload
            } catch {
                payload = { orderId: 0 }
            }

            const action = job.action as QueueAction
            const result = await executeQueueAction(action, payload)
            if (result.success) {
                succeeded++
                await db
                    .update(directAdminQueueJobs)
                    .set({ status: "done", processedAt: new Date(), updatedAt: new Date(), lastError: null })
                    .where(eq(directAdminQueueJobs.id, job.id))
            } else {
                failed++
                const nextStatus = (job.attempts || 0) + 1 >= (job.maxAttempts || 3) ? "failed" : "pending"
                await db
                    .update(directAdminQueueJobs)
                    .set({
                        status: nextStatus as any,
                        updatedAt: new Date(),
                        lastError: result.error || "Unknown queue error",
                        runAt: nextStatus === "pending" ? new Date(Date.now() + 60_000) : job.runAt,
                    })
                    .where(eq(directAdminQueueJobs.id, job.id))
            }

            await writeAuditLog({
                actorUserId: admin.user.id,
                hostingOrderId: payload.orderId,
                action: `queue-run:${action}`,
                status: result.success ? "success" : "failed",
                message: result.success ? result.message : result.error,
                metadata: payload,
            })
        }

        revalidatePath("/dashboard/admin/hosting")
        return { success: true, processed: jobs.length, succeeded, failed }
    } catch (error) {
        if (isMissingTable(error)) {
            return { success: false, error: "Queue tables missing. Please migrate database first." }
        }
        console.error("Failed to process DirectAdmin queue:", error)
        return { success: false, error: "Failed to process queue" }
    }
}

export async function getDirectAdminQueueJobs(limit: number = 50) {
    const admin = await requireAdmin()
    if (!admin.ok) return { success: false, error: admin.error, data: [] as any[] }

    try {
        const jobs = await db.select().from(directAdminQueueJobs).orderBy(desc(directAdminQueueJobs.createdAt)).limit(limit)
        return { success: true, data: jobs }
    } catch (error) {
        if (isMissingTable(error)) return { success: true, data: [] as any[] }
        console.error("Failed to fetch queue jobs:", error)
        return { success: false, error: "Failed to fetch queue jobs", data: [] as any[] }
    }
}

export async function getDirectAdminAuditLogs(limit: number = 100) {
    const admin = await requireAdmin()
    if (!admin.ok) return { success: false, error: admin.error, data: [] as any[] }

    try {
        const logs = await db
            .select({
                id: directAdminAuditLogs.id,
                action: directAdminAuditLogs.action,
                status: directAdminAuditLogs.status,
                message: directAdminAuditLogs.message,
                metadata: directAdminAuditLogs.metadata,
                createdAt: directAdminAuditLogs.createdAt,
                actorName: users.name,
            })
            .from(directAdminAuditLogs)
            .leftJoin(users, eq(directAdminAuditLogs.actorUserId, users.id))
            .orderBy(desc(directAdminAuditLogs.createdAt))
            .limit(limit)
        return { success: true, data: logs }
    } catch (error) {
        if (isMissingTable(error)) return { success: true, data: [] as any[] }
        console.error("Failed to fetch audit logs:", error)
        return { success: false, error: "Failed to fetch audit logs", data: [] as any[] }
    }
}

export async function bulkQueueDirectAdminAction(action: QueueAction, orderIds: number[], options?: { packageId?: number; newPackageName?: string }) {
    const admin = await requireAdmin()
    if (!admin.ok) return { success: false, error: admin.error }
    if (orderIds.length === 0) return { success: false, error: "No orders selected" }

    let queued = 0
    let failed = 0
    for (const orderId of orderIds) {
        const payload: QueuePayload = { orderId, packageId: options?.packageId, newPackageName: options?.newPackageName }
        const result = await queueDirectAdminAction(action, payload)
        if (result.success) queued++
        else failed++
    }
    return { success: true, queued, failed }
}

export async function syncHostingOrderFromDirectAdmin(orderId: number) {
    const admin = await requireAdmin()
    if (!admin.ok) return { success: false, error: admin.error }
    return executeQueueAction("sync_status", { orderId })
}

export async function syncManyHostingOrders(orderIds: number[]) {
    const admin = await requireAdmin()
    if (!admin.ok) return { success: false, error: admin.error }
    if (orderIds.length === 0) return { success: false, error: "No orders selected" }

    const results: Array<{ orderId: number; success: boolean; error?: string }> = []
    for (const orderId of orderIds) {
        const result = await executeQueueAction("sync_status", { orderId })
        results.push({ orderId, success: result.success, error: result.success ? undefined : result.error })
    }
    return { success: true, results }
}

export async function getHostingUsageByServiceId(serviceId: number) {
    const session = await getSessionUser()
    if (!session) return { success: false, error: "Not authenticated" }

    const order = await db
        .select({
            id: hostingOrders.id,
            userId: hostingOrders.userId,
        })
        .from(hostingOrders)
        .where(eq(hostingOrders.serviceId, serviceId))
        .limit(1)

    if (!order[0]) return { success: false, error: "Hosting order not found" }
    if (session.role !== "admin" && order[0].userId !== session.id) return { success: false, error: "Unauthorized" }

    const resolved = await getOrderWithConfig(order[0].id)
    if ("error" in resolved) return { success: false, error: resolved.error }

    const daClient = buildDaClient(resolved.config)
    const result = await daClient.getUserUsage(resolved.order.directAdminUsername)
    if (!result.success) return { success: false, error: result.message }

    await writeAuditLog({
        actorUserId: session.id,
        targetUserId: resolved.order.userId,
        hostingOrderId: resolved.order.id,
        action: "usage:fetch",
        status: "success",
        message: "Fetched usage",
    })

    return { success: true, data: result.data }
}

export async function generateOneClickLoginByServiceId(serviceId: number) {
    const session = await getSessionUser()
    if (!session) return { success: false, error: "Not authenticated" }

    const order = await db
        .select({
            id: hostingOrders.id,
            userId: hostingOrders.userId,
        })
        .from(hostingOrders)
        .where(eq(hostingOrders.serviceId, serviceId))
        .limit(1)

    if (!order[0]) return { success: false, error: "Hosting order not found" }
    if (session.role !== "admin" && order[0].userId !== session.id) return { success: false, error: "Unauthorized" }

    const resolved = await getOrderWithConfig(order[0].id)
    if ("error" in resolved) return { success: false, error: resolved.error }
    const daClient = buildDaClient(resolved.config)
    const link = await daClient.createLoginUrl(resolved.order.directAdminUsername)
    if (!link.success || (!link.url && !link.loginData)) return { success: false, error: link.message }

    await writeAuditLog({
        actorUserId: session.id,
        targetUserId: resolved.order.userId,
        hostingOrderId: resolved.order.id,
        action: "login-link:create",
        status: "success",
        message: "Generated one-click login URL",
    })

    return { success: true, url: link.url, loginData: link.loginData }
}

function randomPassword(length = 16) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let out = ""
    for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)]
    return out
}

export async function rotateDirectAdminPassword(serviceId: number) {
    const session = await getSessionUser()
    if (!session) return { success: false, error: "Not authenticated" }

    const order = await db
        .select({ id: hostingOrders.id, userId: hostingOrders.userId })
        .from(hostingOrders)
        .where(eq(hostingOrders.serviceId, serviceId))
        .limit(1)

    if (!order[0]) return { success: false, error: "Hosting order not found" }
    if (session.role !== "admin" && order[0].userId !== session.id) return { success: false, error: "Unauthorized" }

    const resolved = await getOrderWithConfig(order[0].id)
    if ("error" in resolved) return { success: false, error: resolved.error }
    const daClient = buildDaClient(resolved.config)
    const newPassword = randomPassword(18)
    const result = await daClient.changePassword(resolved.order.directAdminUsername, newPassword)
    if (!result.success) return { success: false, error: result.message }

    await db.update(hostingOrders).set({ directAdminPassword: newPassword, updatedAt: new Date() }).where(eq(hostingOrders.id, resolved.order.id))
    await writeAuditLog({
        actorUserId: session.id,
        targetUserId: resolved.order.userId,
        hostingOrderId: resolved.order.id,
        action: "password:rotate",
        status: "success",
        message: "Rotated DirectAdmin password",
    })

    return { success: true, password: newPassword }
}

const DOMAIN_REGEX = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z]{2,63})+$/

export async function precheckHostingDomain(domain: string) {
    const session = await getSessionUser()
    if (!session) return { success: false, error: "Not authenticated" }

    const normalized = domain.trim().toLowerCase()
    if (!DOMAIN_REGEX.test(normalized)) {
        return { success: false, error: "Invalid domain format" }
    }

    const exists = await db.select({ id: hostingOrders.id }).from(hostingOrders).where(eq(hostingOrders.domain, normalized)).limit(1)
    if (exists[0]) {
        return { success: false, error: "Domain is already used in the system" }
    }

    return {
        success: true,
        data: {
            normalizedDomain: normalized,
            suggestions: [`www.${normalized}`, `cp.${normalized}`],
        },
    }
}

export async function createTemplateFromPackage(packageId: number, templateName: string) {
    const admin = await requireAdmin()
    if (!admin.ok) return { success: false, error: admin.error }

    try {
        const pkg = await db.select().from(hostingPackages).where(eq(hostingPackages.id, packageId)).limit(1)
        if (!pkg[0]) return { success: false, error: "Package not found" }

        await db.insert(hostingPackageTemplates).values({
            name: templateName.trim(),
            description: pkg[0].description || null,
            directAdminPackageName: pkg[0].directAdminPackageName || null,
            diskSpace: pkg[0].diskSpace,
            bandwidth: pkg[0].bandwidth,
            domains: pkg[0].domains,
            subdomains: pkg[0].subdomains,
            emailAccounts: pkg[0].emailAccounts,
            databases: pkg[0].databases,
            ftpAccounts: pkg[0].ftpAccounts,
            price: pkg[0].price,
            billingCycle: pkg[0].billingCycle,
            createdByUserId: admin.user.id,
        })
        return { success: true }
    } catch (error) {
        if (isMissingTable(error)) return { success: false, error: "Template table missing. Please migrate database first." }
        console.error("Failed to create template from package:", error)
        return { success: false, error: "Failed to create template" }
    }
}

export async function applyTemplateToPackages(templateId: number, packageIds: number[]) {
    const admin = await requireAdmin()
    if (!admin.ok) return { success: false, error: admin.error }
    if (packageIds.length === 0) return { success: false, error: "No packages selected" }

    try {
        const template = await db.select().from(hostingPackageTemplates).where(eq(hostingPackageTemplates.id, templateId)).limit(1)
        if (!template[0]) return { success: false, error: "Template not found" }

        await db
            .update(hostingPackages)
            .set({
                description: template[0].description,
                directAdminPackageName: template[0].directAdminPackageName,
                diskSpace: template[0].diskSpace,
                bandwidth: template[0].bandwidth,
                domains: template[0].domains,
                subdomains: template[0].subdomains,
                emailAccounts: template[0].emailAccounts,
                databases: template[0].databases,
                ftpAccounts: template[0].ftpAccounts,
                price: template[0].price,
                billingCycle: template[0].billingCycle,
                updatedAt: new Date(),
            })
            .where(inArray(hostingPackages.id, packageIds))

        revalidatePath("/dashboard/admin/hosting/packages")
        return { success: true, updated: packageIds.length }
    } catch (error) {
        if (isMissingTable(error)) return { success: false, error: "Template table missing. Please migrate database first." }
        console.error("Failed to apply template:", error)
        return { success: false, error: "Failed to apply template" }
    }
}

export async function listHostingPackageTemplates() {
    const admin = await requireAdmin()
    if (!admin.ok) return { success: false, error: admin.error, data: [] as any[] }
    try {
        const templates = await db.select().from(hostingPackageTemplates).orderBy(desc(hostingPackageTemplates.createdAt))
        return { success: true, data: templates }
    } catch (error) {
        if (isMissingTable(error)) return { success: true, data: [] as any[] }
        console.error("Failed to list templates:", error)
        return { success: false, error: "Failed to list templates", data: [] as any[] }
    }
}

function toServiceStatus(input: string): "active" | "pending" | "suspended" | "terminated" {
    const normalized = input.toLowerCase()
    if (normalized === "active") return "active"
    if (normalized === "suspended") return "suspended"
    if (normalized === "terminated") return "terminated"
    return "pending"
}

type ImportPayload = {
    configId: number
    username: string
    domain: string
    email: string
    password: string
    targetUserId: number
    packageId: number
    status: "active" | "pending" | "suspended" | "terminated"
    nextDueDate?: string | null
}

export async function listDirectAdminAccounts(configId: number, search?: string) {
    const admin = await requireAdmin()
    if (!admin.ok) return { success: false, error: admin.error, data: [] as Array<{ username: string }> }

    try {
        const config = await db.select().from(directAdminConfig).where(eq(directAdminConfig.id, configId)).limit(1)
        if (!config[0]) return { success: false, error: "DirectAdmin config not found", data: [] as Array<{ username: string }> }

        const daClient = buildDaClient(config[0])
        const usersRes = await daClient.getUsers()
        if (!usersRes.success) return { success: false, error: usersRes.message, data: [] as Array<{ username: string }> }

        const query = (search || "").trim().toLowerCase()
        const filtered = (usersRes.data || []).filter((u) => !query || u.username.toLowerCase().includes(query))

        return { success: true, data: filtered.slice(0, 200) }
    } catch (error) {
        console.error("Failed to list DirectAdmin accounts:", error)
        return { success: false, error: "Failed to list DirectAdmin accounts", data: [] as Array<{ username: string }> }
    }
}

export async function getDirectAdminAccountProfile(configId: number, username: string) {
    const admin = await requireAdmin()
    if (!admin.ok) return { success: false, error: admin.error }

    try {
        const config = await db.select().from(directAdminConfig).where(eq(directAdminConfig.id, configId)).limit(1)
        if (!config[0]) return { success: false, error: "DirectAdmin config not found" }

        const daClient = buildDaClient(config[0])
        const profile = await daClient.getUserConfig(username.trim())
        if (!profile.success || !profile.data) return { success: false, error: profile.message }

        return { success: true, data: profile.data }
    } catch (error) {
        console.error("Failed to fetch DirectAdmin account profile:", error)
        return { success: false, error: "Failed to fetch DirectAdmin account profile" }
    }
}

export async function importHostingFromDirectAdmin(payload: ImportPayload) {
    const admin = await requireAdmin()
    if (!admin.ok) return { success: false, error: admin.error }

    try {
        const username = payload.username.trim()
        const domain = payload.domain.trim().toLowerCase()
        const email = payload.email.trim().toLowerCase()
        const password = payload.password.trim()

        if (!username || !domain || !email || !password) {
            return { success: false, error: "Username, domain, email, and password are required" }
        }

        const targetUser = await db.select({ id: users.id }).from(users).where(eq(users.id, payload.targetUserId)).limit(1)
        if (!targetUser[0]) return { success: false, error: "Target user not found" }

        const pkg = await db
            .select({
                id: hostingPackages.id,
                name: hostingPackages.name,
                price: hostingPackages.price,
                billingCycle: hostingPackages.billingCycle,
                diskSpace: hostingPackages.diskSpace,
            })
            .from(hostingPackages)
            .where(eq(hostingPackages.id, payload.packageId))
            .limit(1)
        if (!pkg[0]) return { success: false, error: "Hosting package not found" }

        const config = await db.select().from(directAdminConfig).where(eq(directAdminConfig.id, payload.configId)).limit(1)
        if (!config[0]) return { success: false, error: "DirectAdmin config not found" }

        const existingOrder = await db
            .select({
                id: hostingOrders.id,
                serviceId: hostingOrders.serviceId,
            })
            .from(hostingOrders)
            .where(eq(hostingOrders.directAdminUsername, username))
            .limit(1)

        const serviceStatus = toServiceStatus(payload.status)
        const orderStatus = serviceStatus === "terminated" ? "cancelled" : serviceStatus
        const parsedDueDate = payload.nextDueDate ? new Date(payload.nextDueDate) : null
        const nextDueDate = parsedDueDate && !Number.isNaN(parsedDueDate.getTime()) ? parsedDueDate : null

        let serviceId: number

        if (existingOrder[0]?.serviceId) {
            serviceId = existingOrder[0].serviceId
            await db
                .update(services)
                .set({
                    userId: payload.targetUserId,
                    name: `Hosting - ${domain}`,
                    type: "hosting",
                    status: serviceStatus,
                    price: pkg[0].price,
                    billingCycle: pkg[0].billingCycle,
                    nextDueDate,
                    ip: config[0].serverIp,
                    disk: `${pkg[0].diskSpace} MB`,
                })
                .where(eq(services.id, serviceId))
        } else {
            const [createdService] = await db
                .insert(services)
                .values({
                    userId: payload.targetUserId,
                    name: `Hosting - ${domain}`,
                    type: "hosting",
                    status: serviceStatus,
                    price: pkg[0].price,
                    billingCycle: pkg[0].billingCycle,
                    nextDueDate,
                    ip: config[0].serverIp,
                    disk: `${pkg[0].diskSpace} MB`,
                })
                .returning({ id: services.id })
            serviceId = createdService.id
        }

        if (existingOrder[0]) {
            await db
                .update(hostingOrders)
                .set({
                    userId: payload.targetUserId,
                    serviceId,
                    packageId: payload.packageId,
                    domain,
                    directAdminUsername: username,
                    directAdminPassword: password,
                    directAdminEmail: email,
                    status: orderStatus,
                    updatedAt: new Date(),
                })
                .where(eq(hostingOrders.id, existingOrder[0].id))
        } else {
            await db.insert(hostingOrders).values({
                userId: payload.targetUserId,
                serviceId,
                packageId: payload.packageId,
                domain,
                directAdminUsername: username,
                directAdminPassword: password,
                directAdminEmail: email,
                status: orderStatus,
            })
        }

        await writeAuditLog({
            actorUserId: admin.user.id,
            targetUserId: payload.targetUserId,
            hostingOrderId: existingOrder[0]?.id || null,
            action: "import:directadmin-account",
            status: "success",
            message: `Imported ${username} (${domain}) to user #${payload.targetUserId}`,
            metadata: {
                configId: payload.configId,
                packageId: payload.packageId,
                nextDueDate: nextDueDate?.toISOString() || null,
                serviceStatus,
            },
        })

        revalidatePath("/dashboard/admin/hosting")
        revalidatePath("/dashboard/services")

        return { success: true, message: "Imported account successfully" }
    } catch (error) {
        console.error("Failed to import DirectAdmin account:", error)
        return { success: false, error: "Failed to import DirectAdmin account" }
    }
}
