"use server"

import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { users, hostingPackages, hostingCategories, directAdminConfig } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { DirectAdminClient } from "@/lib/directadmin"

const createPackageSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    categoryId: z.number().optional(),
    directAdminPackageName: z.string().min(1, "DirectAdmin Package Name is required"),
    diskSpace: z.union([z.string(), z.number()]).refine(
        (val) => val === "unlimited" || (typeof val === "number" && val >= 1) || (typeof val === "string" && !isNaN(Number(val)) && Number(val) >= 1),
        "Disk space must be at least 1 MB or 'unlimited'"
    ),
    bandwidth: z.union([z.string(), z.number()]).refine(
        (val) => val === "unlimited" || (typeof val === "number" && val >= 1) || (typeof val === "string" && !isNaN(Number(val)) && Number(val) >= 1),
        "Bandwidth must be at least 1 MB or 'unlimited'"
    ),
    domains: z.union([z.string(), z.number()]).default("1"),
    subdomains: z.union([z.string(), z.number()]).default("0"),
    emailAccounts: z.union([z.string(), z.number()]).default("0"),
    databases: z.union([z.string(), z.number()]).default("0"),
    ftpAccounts: z.union([z.string(), z.number()]).default("0"),
    price: z.string().min(1, "Price is required"),
    billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
    isActive: z.boolean().default(true),
})

const updatePackageSchema = createPackageSchema.extend({
    id: z.number(),
})

/**
 * Check if user is admin
 */
async function checkAdmin() {
    const cookieStore = await cookies()
    const userId = await getSessionUserIdValue(cookieStore)

    if (!userId) {
        return { isAdmin: false, error: "Not authenticated" }
    }

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

/**
 * Create a new hosting package
 */
export async function createHostingPackage(formData: FormData) {
    try {
        const adminCheck = await checkAdmin()
        if (!adminCheck.isAdmin) {
            return {
                success: false,
                error: adminCheck.error || "Unauthorized",
            }
        }

        const rawData = {
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            categoryId: formData.get("categoryId") ? parseInt(formData.get("categoryId") as string) : undefined,
            directAdminPackageName: formData.get("directAdminPackageName") as string,
            diskSpace: (formData.get("diskSpace") as string) === "unlimited" ? "unlimited" : parseInt(formData.get("diskSpace") as string),
            bandwidth: (formData.get("bandwidth") as string) === "unlimited" ? "unlimited" : parseInt(formData.get("bandwidth") as string),
            domains: (formData.get("domains") as string) === "unlimited" ? "unlimited" : (parseInt(formData.get("domains") as string) || 1),
            subdomains: (formData.get("subdomains") as string) === "unlimited" ? "unlimited" : (parseInt(formData.get("subdomains") as string) || 0),
            emailAccounts: (formData.get("emailAccounts") as string) === "unlimited" ? "unlimited" : (parseInt(formData.get("emailAccounts") as string) || 0),
            databases: (formData.get("databases") as string) === "unlimited" ? "unlimited" : (parseInt(formData.get("databases") as string) || 0),
            ftpAccounts: (formData.get("ftpAccounts") as string) === "unlimited" ? "unlimited" : (parseInt(formData.get("ftpAccounts") as string) || 0),
            price: formData.get("price") as string,
            billingCycle: (formData.get("billingCycle") as string) || "monthly",
            isActive: formData.get("isActive") === "true",
        }

        const validation = createPackageSchema.safeParse(rawData)
        if (!validation.success) {
            return {
                success: false,
                error: validation.error.errors[0].message,
            }
        }

        let categoryConfigId: number | null = null
        if (validation.data.categoryId) {
            const category = await db
                .select({
                    configId: hostingCategories.configId,
                })
                .from(hostingCategories)
                .where(eq(hostingCategories.id, validation.data.categoryId))
                .limit(1)

            categoryConfigId = category[0]?.configId ?? null
        }

        await db.insert(hostingPackages).values({
            ...validation.data,
            configId: categoryConfigId,
            description: validation.data.description || null,
        })

        revalidatePath("/dashboard/admin/hosting/packages")
        return {
            success: true,
            message: "Hosting package created successfully",
        }
    } catch (error) {
        console.error("Error creating hosting package:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create package",
        }
    }
}

/**
 * Update a hosting package
 */
export async function updateHostingPackage(formData: FormData) {
    try {
        const adminCheck = await checkAdmin()
        if (!adminCheck.isAdmin) {
            return {
                success: false,
                error: adminCheck.error || "Unauthorized",
            }
        }

        const rawData = {
            id: parseInt(formData.get("id") as string),
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            categoryId: formData.get("categoryId") ? parseInt(formData.get("categoryId") as string) : undefined,
            directAdminPackageName: formData.get("directAdminPackageName") as string,
            diskSpace: (formData.get("diskSpace") as string) === "unlimited" ? "unlimited" : parseInt(formData.get("diskSpace") as string),
            bandwidth: (formData.get("bandwidth") as string) === "unlimited" ? "unlimited" : parseInt(formData.get("bandwidth") as string),
            domains: (formData.get("domains") as string) === "unlimited" ? "unlimited" : (parseInt(formData.get("domains") as string) || 1),
            subdomains: (formData.get("subdomains") as string) === "unlimited" ? "unlimited" : (parseInt(formData.get("subdomains") as string) || 0),
            emailAccounts: (formData.get("emailAccounts") as string) === "unlimited" ? "unlimited" : (parseInt(formData.get("emailAccounts") as string) || 0),
            databases: (formData.get("databases") as string) === "unlimited" ? "unlimited" : (parseInt(formData.get("databases") as string) || 0),
            ftpAccounts: (formData.get("ftpAccounts") as string) === "unlimited" ? "unlimited" : (parseInt(formData.get("ftpAccounts") as string) || 0),
            price: formData.get("price") as string,
            billingCycle: (formData.get("billingCycle") as string) || "monthly",
            isActive: formData.get("isActive") === "true",
        }

        const validation = updatePackageSchema.safeParse(rawData)
        if (!validation.success) {
            return {
                success: false,
                error: validation.error.errors[0].message,
            }
        }

        let categoryConfigId: number | null = null
        if (validation.data.categoryId) {
            const category = await db
                .select({
                    configId: hostingCategories.configId,
                })
                .from(hostingCategories)
                .where(eq(hostingCategories.id, validation.data.categoryId))
                .limit(1)

            categoryConfigId = category[0]?.configId ?? null
        }

        await db
            .update(hostingPackages)
            .set({
                ...validation.data,
                configId: categoryConfigId,
                description: validation.data.description || null,
                updatedAt: new Date(),
            })
            .where(eq(hostingPackages.id, validation.data.id))

        revalidatePath("/dashboard/admin/hosting/packages")
        return {
            success: true,
            message: "Hosting package updated successfully",
        }
    } catch (error) {
        console.error("Error updating hosting package:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update package",
        }
    }
}

/**
 * Delete a hosting package
 */
export async function deleteHostingPackage(packageId: number) {
    try {
        const adminCheck = await checkAdmin()
        if (!adminCheck.isAdmin) {
            return {
                success: false,
                error: adminCheck.error || "Unauthorized",
            }
        }

        await db.delete(hostingPackages).where(eq(hostingPackages.id, packageId))

        revalidatePath("/dashboard/admin/hosting/packages")
        return {
            success: true,
            message: "Hosting package deleted successfully",
        }
    } catch (error) {
        console.error("Error deleting hosting package:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete package",
        }
    }
}

/**
 * Fetch DirectAdmin package list for quick mapping in package form
 */
export async function fetchDirectAdminPackages(configId?: number) {
    try {
        const adminCheck = await checkAdmin()
        if (!adminCheck.isAdmin) {
            return {
                success: false,
                error: adminCheck.error || "Unauthorized",
                data: [] as Array<{ name: string }>,
            }
        }

        const byId = configId
            ? await db
                .select()
                .from(directAdminConfig)
                .where(eq(directAdminConfig.id, configId))
                .limit(1)
            : []

        const active = byId.length
            ? byId
            : await db
                .select()
                .from(directAdminConfig)
                .where(eq(directAdminConfig.isActive, true))
                .limit(1)

        const fallback = active.length
            ? active
            : await db
                .select()
                .from(directAdminConfig)
                .limit(1)

        const selectedConfig = fallback[0]
        if (!selectedConfig) {
            return {
                success: false,
                error: "No DirectAdmin config found",
                data: [] as Array<{ name: string }>,
            }
        }

        const daClient = new DirectAdminClient({
            resellerUsername: selectedConfig.resellerUsername,
            resellerPassword: selectedConfig.resellerPassword,
            serverIp: selectedConfig.serverIp,
            panelUrl: selectedConfig.panelUrl,
        })

        const result = await daClient.getPackages()
        if (!result.success) {
            return {
                success: false,
                error: result.message,
                data: [] as Array<{ name: string }>,
            }
        }

        return {
            success: true,
            data: result.data || [],
            configId: selectedConfig.id,
            serverIp: selectedConfig.serverIp,
        }
    } catch (error) {
        console.error("Error fetching DirectAdmin packages:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch DirectAdmin packages",
            data: [] as Array<{ name: string }>,
        }
    }
}




