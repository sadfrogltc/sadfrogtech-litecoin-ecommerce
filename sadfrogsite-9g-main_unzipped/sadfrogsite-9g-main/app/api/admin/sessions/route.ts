import { NextResponse } from "next/server"
import { getAllActiveSessions, cleanupExpiredSessions } from "@/lib/admin-session"

export async function GET() {
  try {
    console.log("[Admin Sessions API] Starting session retrieval...")

    // Clean up expired sessions first
    await cleanupExpiredSessions()
    console.log("[Admin Sessions API] Cleaned up expired sessions")

    // Get all active sessions
    const sessions = await getAllActiveSessions()
    console.log(`[Admin Sessions API] Retrieved ${sessions.length} active sessions`)

    // Return sanitized session info (without sensitive data)
    const sessionInfo = sessions.map((session) => ({
      sessionId: session.sessionId,
      username: session.username,
      loginTime: new Date(session.loginTime).toISOString(),
      lastActivity: new Date(session.lastActivity).toISOString(),
      ipAddress: session.ipAddress || "unknown",
      userAgent: session.userAgent ? session.userAgent.substring(0, 100) + "..." : "unknown", // Truncate for display
    }))

    console.log(`[Admin Sessions API] Returning session info for ${sessionInfo.length} sessions`)

    return NextResponse.json({
      success: true,
      sessions: sessionInfo,
      count: sessions.length,
    })
  } catch (error) {
    console.error("[Admin Sessions API] Error:", error)

    // Return a proper JSON error response
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve sessions",
        sessions: [],
        count: 0,
      },
      { status: 500 },
    )
  }
}
