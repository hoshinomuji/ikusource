"use server"

import { getSessionUserIdValue } from "@/lib/session"
import { cookies } from "next/headers"
import { db } from "@/db"
import { services, hostingOrders, hostingPackages, directAdminConfig } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"

export interface UserService {
    id: number
    name: string
    type: string
    status: string
    ip: string | null
    price: string
    billingCycle: string | null
    nextDueDate: Date | null
    disk: string | null
    createdAt: Date
}

export interface HostingDetails {
    domain: string
    directAdminUsername: string
    directAdminPassword: string
    directAdminEmail: string
    panelUrl: string
    serverIp: string
    nameservers: string[]
    status: string
}

/**
 * Get all services for the current user
 */
export async function getUserServices() {
    try {
        const cookieStore = await cookies()
        const userId = await getSessionUserIdValue(cookieStore)

        if (!userId) {
            return {
                success: false,
                error: "เธเธฃเธธเธ“เธฒเน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธ",
                data: [],
            }
        }

        const userIdNum = parseInt(userId)

        const userServices = await db
            .select({
                id: services.id,
                name: services.name,
                type: services.type,
                status: services.status,
                ip: services.ip,
                price: services.price,
                billingCycle: services.billingCycle,
                nextDueDate: services.nextDueDate,
                disk: services.disk,
                createdAt: services.createdAt,
            })
            .from(services)
            .where(eq(services.userId, userIdNum))
            .orderBy(desc(services.createdAt))

        return {
            success: true,
            data: userServices,
        }
    } catch (error) {
        console.error("Error fetching user services:", error)
        return {
            success: false,
            error: "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เนเธซเธฅเธ”เธเนเธญเธกเธนเธฅเธเธฃเธดเธเธฒเธฃเนเธ”เน",
            data: [],
        }
    }
}

/**
 * Get hosting order details by service ID
 */
export async function getServiceDetails(serviceId: number): Promise<{
    success: boolean
    error?: string
    data?: HostingDetails
}> {
    try {
        const cookieStore = await cookies()
        const userId = await getSessionUserIdValue(cookieStore)

        if (!userId) {
            return {
                success: false,
                error: "เธเธฃเธธเธ“เธฒเน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธ",
            }
        }

        const userIdNum = parseInt(userId)

        // Verify ownership
        const service = await db
            .select()
            .from(services)
            .where(and(
                eq(services.id, serviceId),
                eq(services.userId, userIdNum)
            ))
            .limit(1)

        if (!service || service.length === 0) {
            return {
                success: false,
                error: "เนเธกเนเธเธเธเธฃเธดเธเธฒเธฃเธซเธฃเธทเธญเธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเน€เธเนเธฒเธ–เธถเธ",
            }
        }

        // Get hosting order details
        const order = await db
            .select({
                id: hostingOrders.id,
                domain: hostingOrders.domain,
                directAdminUsername: hostingOrders.directAdminUsername,
                directAdminPassword: hostingOrders.directAdminPassword,
                directAdminEmail: hostingOrders.directAdminEmail,
                status: hostingOrders.status,
                packageId: hostingOrders.packageId,
            })
            .from(hostingOrders)
            .where(eq(hostingOrders.serviceId, serviceId))
            .limit(1)

        if (!order || order.length === 0) {
            return {
                success: false,
                error: "เนเธกเนเธเธเธเนเธญเธกเธนเธฅ Hosting Order",
            }
        }

        // Get package to find configId
        const pkg = await db
            .select({ configId: hostingPackages.configId })
            .from(hostingPackages)
            .where(eq(hostingPackages.id, order[0].packageId))
            .limit(1)

        // Get DirectAdmin config
        let daConfig
        if (pkg && pkg.length > 0 && pkg[0].configId) {
            daConfig = await db
                .select()
                .from(directAdminConfig)
                .where(eq(directAdminConfig.id, pkg[0].configId))
                .limit(1)
        } else {
            daConfig = await db
                .select()
                .from(directAdminConfig)
                .where(eq(directAdminConfig.isActive, true))
                .limit(1)
        }

        if (!daConfig || daConfig.length === 0) {
            return {
                success: false,
                error: "เนเธกเนเธเธเธเธฒเธฃเธ•เธฑเนเธเธเนเธฒ DirectAdmin",
            }
        }

        return {
            success: true,
            data: {
                domain: order[0].domain,
                directAdminUsername: order[0].directAdminUsername,
                directAdminPassword: order[0].directAdminPassword,
                directAdminEmail: order[0].directAdminEmail,
                panelUrl: daConfig[0].panelUrl,
                serverIp: daConfig[0].serverIp,
                nameservers: [daConfig[0].nameserver1, daConfig[0].nameserver2],
                status: order[0].status,
            },
        }
    } catch (error) {
        console.error("Error fetching service details:", error)
        return {
            success: false,
            error: "เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เนเธซเธฅเธ”เธเนเธญเธกเธนเธฅเนเธ”เน",
        }
    }
}
