"use server"

import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { db } from "@/db"
import { users, hostingCategories } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const categorySchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    icon: z.string().optional(),
    configId: z.number().optional().nullable(),
    displayOrder: z.number().default(0),
    isActive: z.boolean().default(true),
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
 * Get all hosting categories
 */
export async function getHostingCategories() {
    try {
        const categories = await db
            .select()
            .from(hostingCategories)
            .orderBy(hostingCategories.displayOrder, hostingCategories.name)

        return {
            success: true,
            data: categories,
        }
    } catch (error) {
        console.error("Error fetching categories:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch categories",
        }
    }
}

/**
 * Create hosting category
 */
export async function createHostingCategory(formData: FormData) {
    try {
        const adminCheck = await checkAdmin()
        if (!adminCheck.isAdmin) {
            return {
                success: false,
                error: adminCheck.error || "Unauthorized",
            }
        }

        const configIdValue = formData.get("configId") as string
        const rawData = {
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            icon: formData.get("icon") as string,
            configId: configIdValue && configIdValue !== "" ? parseInt(configIdValue) : null,
            displayOrder: formData.get("displayOrder") ? parseInt(formData.get("displayOrder") as string) : 0,
            isActive: formData.get("isActive") === "true",
        }

        const validation = categorySchema.safeParse(rawData)
        if (!validation.success) {
            return {
                success: false,
                error: validation.error.errors[0].message,
            }
        }

        await db.insert(hostingCategories).values(validation.data)

        revalidatePath("/dashboard/admin/hosting/config")
        return {
            success: true,
            message: "Hosting category created successfully",
        }
    } catch (error) {
        console.error("Error creating category:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create category",
        }
    }
}

/**
 * Update hosting category
 */
export async function updateHostingCategory(formData: FormData) {
    try {
        const adminCheck = await checkAdmin()
        if (!adminCheck.isAdmin) {
            return {
                success: false,
                error: adminCheck.error || "Unauthorized",
            }
        }

        const id = parseInt(formData.get("id") as string)
        if (!id) {
            return {
                success: false,
                error: "Category ID is required",
            }
        }

        const configIdValue = formData.get("configId") as string
        const rawData = {
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            icon: formData.get("icon") as string,
            configId: configIdValue && configIdValue !== "" ? parseInt(configIdValue) : null,
            displayOrder: formData.get("displayOrder") ? parseInt(formData.get("displayOrder") as string) : 0,
            isActive: formData.get("isActive") === "true",
        }

        const validation = categorySchema.safeParse(rawData)
        if (!validation.success) {
            return {
                success: false,
                error: validation.error.errors[0].message,
            }
        }

        await db
            .update(hostingCategories)
            .set({
                ...validation.data,
                updatedAt: new Date(),
            })
            .where(eq(hostingCategories.id, id))

        revalidatePath("/dashboard/admin/hosting/config")
        return {
            success: true,
            message: "Hosting category updated successfully",
        }
    } catch (error) {
        console.error("Error updating category:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update category",
        }
    }
}

/**
 * Delete hosting category
 */
export async function deleteHostingCategory(categoryId: number) {
    try {
        const adminCheck = await checkAdmin()
        if (!adminCheck.isAdmin) {
            return {
                success: false,
                error: adminCheck.error || "Unauthorized",
            }
        }

        await db.delete(hostingCategories).where(eq(hostingCategories.id, categoryId))

        revalidatePath("/dashboard/admin/hosting/config")
        return {
            success: true,
            message: "Hosting category deleted successfully",
        }
    } catch (error) {
        console.error("Error deleting category:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete category",
        }
    }
}

