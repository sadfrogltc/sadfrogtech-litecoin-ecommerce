import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import crypto from "crypto"
import { sql } from "./neon"
import { ensureDbInitialized } from "./data"

const JWT_SECRET = new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET || "sadfrogtech-admin-secret-2024")
const COOKIE_NAME = "admin-session"

export interface AdminSession {
  sessionId: string
  userId: string
  username: string
  loginTime: number
  lastActivity: number
  ipAddress?: string
  userAgent?: string
}

export function generateSessionId(): string {
  return crypto.randomBytes(32).toString("hex")
}

export async function createAdminSession(username: string, ipAddress?: string, userAgent?: string): Promise<string> {
  await ensureDbInitialized()
  const now = Date.now()
  const sessionId = generateSessionId()
  const expiresAt = now + 24 * 60 * 60 * 1000 // 24 hours from now, as a number

  console.log(`[Admin Session] Creating session for ${username} in database.`)

  const sessionData: AdminSession = {
    sessionId,
    userId: "admin-1",
    username,
    loginTime: now,
    lastActivity: now,
    ipAddress,
    userAgent,
  }

  // Store session in database using numeric timestamps
  await sql`
    INSERT INTO admin_sessions (session_id, user_id, username, login_time, last_activity, ip_address, user_agent, expires_at)
    VALUES (${sessionData.sessionId}, ${sessionData.userId}, ${sessionData.username}, ${sessionData.loginTime}, ${sessionData.lastActivity}, ${sessionData.ipAddress}, ${sessionData.userAgent}, ${expiresAt})
  `
  console.log(`[Admin Session] Stored session ${sessionId} in database.`)

  // Create JWT token
  const token = await new SignJWT({ sessionId, username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET)

  // Set cookie
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60, // 24 hours
    path: "/",
  })

  console.log(`[Admin Session] Session creation complete for ${username}.`)
  return sessionId
}

export async function getAdminSession(): Promise<AdminSession | null> {
  await ensureDbInitialized()
  const cookiesStore = await cookies();
  const token = cookiesStore.get(COOKIE_NAME)?.value;
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const { sessionId } = payload as { sessionId: string }
    if (!sessionId) return null

    const result = await sql`
      SELECT session_id, user_id, username, login_time, last_activity, ip_address, user_agent, expires_at
      FROM admin_sessions WHERE session_id = ${sessionId}
    `

    if (result.length === 0) {
      console.log(`[Admin Session] Session ${sessionId} not found in DB. Invalidating.`)
      await clearAdminSession()
      return null
    }

    const sessionRow = result[0]

    // Check inactivity (2 hours) using numeric comparison
    const maxInactivity = 2 * 60 * 60 * 1000
    if (Date.now() - Number(sessionRow.last_activity) > maxInactivity) {
      console.log(`[Admin Session] Session ${sessionId} expired due to inactivity.`)
      await invalidateSession(sessionId)
      return null
    }

    // Update last activity timestamp with a number
    await sql`UPDATE admin_sessions SET last_activity = ${Date.now()} WHERE session_id = ${sessionId}`

    return {
      sessionId: sessionRow.session_id,
      userId: sessionRow.user_id,
      username: sessionRow.username,
      loginTime: Number(sessionRow.login_time),
      lastActivity: Number(sessionRow.last_activity),
      ipAddress: sessionRow.ip_address,
      userAgent: sessionRow.user_agent,
    }
  } catch (error) {
    console.error("[Admin Session] Error validating session:", error)
    await clearAdminSession()
    return null
  }
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await ensureDbInitialized()
  await sql`DELETE FROM admin_sessions WHERE session_id = ${sessionId}`
  await clearAdminSession()
  console.log(`[Admin Session] Invalidated session ${sessionId} from database.`)
}

export async function clearAdminSession(): Promise<void> {
  cookies().delete(COOKIE_NAME)
  console.log(`[Admin Session] Cleared session cookie: ${COOKIE_NAME}`)
}

export async function getAllActiveSessions(): Promise<AdminSession[]> {
  await ensureDbInitialized()
  const result = await sql`
    SELECT session_id, user_id, username, login_time, last_activity, ip_address, user_agent
    FROM admin_sessions
    ORDER BY last_activity DESC
  `
  return result.map((row: any) => ({
    sessionId: row.session_id,
    userId: row.user_id,
    username: row.username,
    loginTime: Number(row.login_time),
    lastActivity: Number(row.last_activity),
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
  }))
}

export async function cleanupExpiredSessions(): Promise<void> {
  await ensureDbInitialized()
  const now = Date.now() // Use a numeric timestamp for comparison with BIGINT
  const result = await sql`
    DELETE FROM admin_sessions WHERE expires_at < ${now}
  `
  if (result.count > 0) {
    console.log(`[Admin Session] Cleaned up ${result.count} expired sessions.`)
  }
}

export async function validateSessionFromRequest(token: string): Promise<AdminSession | null> {
  await ensureDbInitialized()
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const { sessionId } = payload as { sessionId: string }
    if (!sessionId) return null

    const result = await sql`
      SELECT session_id, user_id, username, login_time, last_activity, expires_at
      FROM admin_sessions WHERE session_id = ${sessionId}
    `
    if (result.length === 0) return null

    const sessionRow = result[0]
    const now = Date.now()

    if (Number(sessionRow.expires_at) < now) {
      await sql`DELETE FROM admin_sessions WHERE session_id = ${sessionId}`
      return null
    }

    const maxInactivity = 2 * 60 * 60 * 1000
    if (now - Number(sessionRow.last_activity) > maxInactivity) {
      await sql`DELETE FROM admin_sessions WHERE session_id = ${sessionId}`
      return null
    }

    await sql`UPDATE admin_sessions SET last_activity = ${now} WHERE session_id = ${sessionId}`

    return {
      sessionId: sessionRow.session_id,
      userId: sessionRow.user_id,
      username: sessionRow.username,
      loginTime: Number(sessionRow.login_time),
      lastActivity: Number(sessionRow.last_activity),
    }
  } catch (error) {
    return null
  }
}
