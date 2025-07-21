import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin-session"

// Ensure this route is not cached
export const revalidate = 0

export async function GET() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const checkEndpoint = async (name: string, url: string, options: RequestInit = {}) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5-second timeout

    try {
      const response = await fetch(url, {
        ...options,
        cache: "no-store",
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (response.ok) {
        return { name, status: "Operational", statusCode: response.status }
      }
      return { name, status: "Degraded", statusCode: response.status }
    } catch (error: any) {
      clearTimeout(timeoutId)
      return { name, status: "Offline", statusCode: null, error: error.message }
    }
  }

  try {
    const [paymentProviderStatuses, explorerApiStatuses] = await Promise.all([
      // Payment Provider APIs
      Promise.all([checkEndpoint("Litescribe", "https://litescribe.io/api/default/fee-summary")]),
      // Explorer APIs
      Promise.all([
        checkEndpoint("Litecoinspace", "https://litecoinspace.org/api/blocks/tip/height"),
        checkEndpoint("Blockchair", "https://api.blockchair.com/litecoin/stats"),
      ]),
    ])

    // Check for environment variables without exposing their values
    const envChecks = [
      { name: "Neon Database URL", set: !!process.env.DATABASE_URL },
      { name: "Admin LTC Address", set: !!process.env.ADMIN_LTC_ADDRESS },
      { name: "LiveCoinWatch API Key", set: !!process.env.LIVECOINWATCH_API_KEY },
      { name: "Admin Session Secret", set: !!process.env.ADMIN_SESSION_SECRET },
    ]

    return NextResponse.json({
      paymentProviderStatuses,
      explorerApiStatuses,
      envChecks,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch system status" }, { status: 500 })
  }
}
