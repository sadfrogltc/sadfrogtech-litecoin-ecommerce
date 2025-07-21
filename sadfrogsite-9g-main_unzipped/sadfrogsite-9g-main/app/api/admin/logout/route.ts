import { NextResponse } from "next/server"
import { getAdminSession, invalidateSession } from "@/lib/admin-session"

export async function POST() {
  try {
    // Get current session to invalidate it properly
    const session = await getAdminSession()

    if (session) {
      await invalidateSession(session.sessionId)
      console.log(`[Admin Logout API] Invalidated session ${session.sessionId} for ${session.username}`)
    } else {
      console.log("[Admin Logout API] No active session found to invalidate")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Admin Logout API] Error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
