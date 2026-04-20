import { NextRequest, NextResponse } from "next/server"
import { createHostingOrder } from "@/app/actions/hosting"
import { isTrustedSameOriginRequest } from "@/lib/request-security"

export async function POST(request: NextRequest) {
  try {
    if (!isTrustedSameOriginRequest(request)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request origin",
        },
        { status: 403 }
      )
    }

    const body = await request.json()

    const formData = new FormData()
    formData.append("packageId", String(body.packageId || ""))
    formData.append("domain", String(body.domain || ""))
    formData.append("email", String(body.email || ""))

    const result = await createHostingOrder(formData)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[API Route] create hosting failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create hosting order",
      },
      { status: 500 }
    )
  }
}

