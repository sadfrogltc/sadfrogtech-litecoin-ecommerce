import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin-session"

export async function GET() {
  console.log("[Session Check API] Checking current session...")

  try {
    const session = await getAdminSession()

    if (session) {
      console.log(`[Session Check API] Active session found for ${session.username}`)
      return NextResponse.json({
        success: true,
        session: {
          sessionId: session.sessionId,
          username: session.username,
          loginTime: new Date(session.loginTime).toISOString(),
          lastActivity: new Date(session.lastActivity).toISOString(),
        },
      })
    } else {
      console.log("[Session Check API] No active session found")
      return NextResponse.json({
        success: false,
        message: "No active session",
      })
    }
  } catch (error) {
    console.error("[Session Check API] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check session",
      },
      { status: 500 },
    )
  }
}
