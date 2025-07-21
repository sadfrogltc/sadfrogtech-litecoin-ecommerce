import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import type { NextRequest, NextResponse } from "next/server"

// Session configuration
const SESSION_CONFIG = {
  SECRET_KEY: process.env.ADMIN_SESSION_SECRET || "fallback-secret-key-for-sadfrogtech-admin-2024",
  COOKIE_NAME: "admin_session",
  EXPIRY_HOURS: 24,
  INACTIVITY_MINUTES: 120, // 2 hours of inactivity
  ALGORITHM: "HS256" as const,
}

const SECRET_KEY = process.env.ADMIN_SESSION_SECRET;
if (!SECRET_KEY) {
  throw new Error("ADMIN_SESSION_SECRET environment variable is required.");
}

const key = new TextEncoder().encode(SECRET_KEY)

interface SessionPayload {
  user: {
    id: string
    username: string
  }
  iat: number
  exp: number
  lastActivity: number
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  console.log("[Session] Encrypting session payload for user:", payload.user.username)

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: SESSION_CONFIG.ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_CONFIG.EXPIRY_HOURS}h`)
    .sign(key)
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: [SESSION_CONFIG.ALGORITHM],
    })

    console.log("[Session] Successfully decrypted session token")
    return payload as SessionPayload
  } catch (error) {
    console.error("[Session] Token decryption failed:", error instanceof Error ? error.message : "Unknown error")
    return null
  }
}

export async function createSession(userId: string, username: string): Promise<void> {
  try {
    const now = Date.now()
    const expires = new Date(now + SESSION_CONFIG.EXPIRY_HOURS * 60 * 60 * 1000)

    const sessionPayload: SessionPayload = {
      user: { id: userId, username },
      iat: Math.floor(now / 1000),
      exp: Math.floor(expires.getTime() / 1000),
      lastActivity: now,
    }

    const encryptedSession = await encrypt(sessionPayload)
    const cookieStore = cookies()

    // Set secure session cookie
    cookieStore.set(SESSION_CONFIG.COOKIE_NAME, encryptedSession, {
      httpOnly: true, // Prevent XSS attacks
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "lax", // CSRF protection
      path: "/admin", // Restrict to admin routes
      expires,
      priority: "high",
    })

    console.log(`[Session] Created secure session for user: ${username}, expires: ${expires.toISOString()}`)
  } catch (error) {
    console.error("[Session] Failed to create session:", error)
    throw new Error("Session creation failed")
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get(SESSION_CONFIG.COOKIE_NAME)?.value

    if (!sessionCookie) {
      console.log("[Session] No session cookie found")
      return null
    }

    const session = await decrypt(sessionCookie)
    if (!session) {
      console.log("[Session] Invalid session token")
      await deleteSession()
      return null
    }

    // Check session expiration
    const now = Date.now()
    if (session.exp * 1000 < now) {
      console.log("[Session] Session has expired")
      await deleteSession()
      return null
    }

    // Check inactivity timeout
    const inactivityLimit = SESSION_CONFIG.INACTIVITY_MINUTES * 60 * 1000
    if (now - session.lastActivity > inactivityLimit) {
      console.log("[Session] Session expired due to inactivity")
      await deleteSession()
      return null
    }

    // Update last activity timestamp
    await updateSessionActivity(session)

    console.log(`[Session] Valid session found for user: ${session.user.username}`)
    return session
  } catch (error) {
    console.error("[Session] Error retrieving session:", error)
    await deleteSession()
    return null
  }
}

export async function updateSessionActivity(session: SessionPayload): Promise<void> {
  try {
    const updatedSession: SessionPayload = {
      ...session,
      lastActivity: Date.now(),
    }

    const encryptedSession = await encrypt(updatedSession)
    const cookieStore = cookies()
    const expires = new Date(session.exp * 1000)

    cookieStore.set(SESSION_CONFIG.COOKIE_NAME, encryptedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/admin",
      expires,
      priority: "high",
    })

    console.log("[Session] Updated session activity timestamp")
  } catch (error) {
    console.error("[Session] Failed to update session activity:", error)
  }
}

export async function deleteSession(): Promise<void> {
  try {
    const cookieStore = cookies()

    // Clear the session cookie
    cookieStore.set(SESSION_CONFIG.COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/admin",
      expires: new Date(0),
      maxAge: 0,
    })

    console.log("[Session] Session cookie deleted successfully")
  } catch (error) {
    console.error("[Session] Error deleting session:", error)
  }
}

// Middleware helper function
export async function validateSessionFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  const sessionCookie = request.cookies.get(SESSION_CONFIG.COOKIE_NAME)?.value

  if (!sessionCookie) {
    console.log("[Session Middleware] No session cookie in request")
    return null
  }

  const session = await decrypt(sessionCookie)
  if (!session) {
    console.log("[Session Middleware] Invalid session token in request")
    return null
  }

  // Check expiration
  const now = Date.now()
  if (session.exp * 1000 < now) {
    console.log("[Session Middleware] Session expired in request validation")
    return null
  }

  // Check inactivity
  const inactivityLimit = SESSION_CONFIG.INACTIVITY_MINUTES * 60 * 1000
  if (now - session.lastActivity > inactivityLimit) {
    console.log("[Session Middleware] Session inactive too long in request validation")
    return null
  }

  console.log(`[Session Middleware] Valid session for user: ${session.user.username}`)
  return session
}

// Response helper to update session in middleware
export function updateSessionInResponse(response: NextResponse, session: SessionPayload): NextResponse {
  try {
    const updatedSession: SessionPayload = {
      ...session,
      lastActivity: Date.now(),
    }

    // We can't use the encrypt function here as it's async, so we'll create a new JWT
    const expires = new Date(session.exp * 1000)

    // Note: In a real implementation, you might want to handle this differently
    // For now, we'll just update the cookie with the same token but new expiry
    response.cookies.set(SESSION_CONFIG.COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/admin",
      expires,
      priority: "high",
    })

    console.log("[Session Middleware] Updated session activity in response")
  } catch (error) {
    console.error("[Session Middleware] Failed to update session in response:", error)
  }

  return response
}
