import { type NextRequest, NextResponse } from "next/server"
import { createAdminSession } from "@/lib/admin-session"

export async function POST(request: NextRequest) {
  console.log("[Admin Login API] Received login request")

  try {
    const body = await request.json()
    const { username, password } = body

    console.log(`[Admin Login API] Login attempt for username: ${username}`)

    // Get client info for session tracking
    const ipAddress = request.ip || request.headers.get("x-forwarded-for") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    console.log(`[Admin Login API] Client info - IP: ${ipAddress}`)

    // Validate credentials
    if (username === "sadfrog" && password === "sadfrogtech") {
      console.log(`[Admin Login API] Credentials valid for ${username}`)

      try {
        // Create new session with unique token
        const sessionId = await createAdminSession(username, ipAddress, userAgent)

        console.log(`[Admin Login API] Session created successfully: ${sessionId}`)

        return NextResponse.json({
          success: true,
          sessionId,
          message: "Login successful",
        })
      } catch (sessionError) {
        console.error("[Admin Login API] Error creating session:", sessionError)
        return NextResponse.json(
          {
            error: "Failed to create session",
          },
          { status: 500 },
        )
      }
    } else {
      console.log(`[Admin Login API] Invalid credentials for ${username}`)
      return NextResponse.json(
        {
          error: "Invalid username or password",
        },
        { status: 401 },
      )
    }
  } catch (error) {
    console.error("[Admin Login API] Error processing request:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
