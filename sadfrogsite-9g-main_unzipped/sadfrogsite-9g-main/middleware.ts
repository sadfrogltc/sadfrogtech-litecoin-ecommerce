import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { validateSessionFromRequest } from "@/lib/admin-session"

// 1. Specify protected and public routes
const protectedRoutes = ["/admin"]
const protectedApiRoutes = ["/api/admin"]
const publicRoutes = ["/admin/login"]
const publicApiRoutes = ["/api/admin/login", "/api/admin/session-check"]

function handleUnauthorized(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  const loginUrl = new URL("/admin/login", request.url)
  loginUrl.searchParams.set("redirect", pathname)
  return NextResponse.redirect(loginUrl)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log(`[Middleware] Processing request for: ${pathname}`)

  // 2. Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isProtectedApiRoute = protectedApiRoutes.some((route) => pathname.startsWith(route))

  if (!isProtectedRoute && !isProtectedApiRoute) {
    console.log(`[Middleware] Route ${pathname} is not protected, allowing access`)
    return NextResponse.next()
  }

  // 3. Check if the protected route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))
  const isPublicApiRoute = publicApiRoutes.some((route) => pathname.startsWith(route))

  if (isPublicRoute || isPublicApiRoute) {
    console.log(`[Middleware] Route ${pathname} is public, allowing access`)
    return NextResponse.next()
  }

  // 4. If it's a protected, non-public route, validate the session
  const token = request.cookies.get("admin-session")?.value
  if (!token) {
    console.log(`[Middleware] No session token found for protected route: ${pathname}`)
    return handleUnauthorized(request)
  }

  const session = await validateSessionFromRequest(token)
  if (!session) {
    console.log(`[Middleware] Invalid session for protected route: ${pathname}`)
    const response = handleUnauthorized(request)
    response.cookies.delete("admin-session") // Clear invalid cookie
    return response
  }

  console.log(`[Middleware] Valid session found for ${session.username}, allowing access to: ${pathname}`)
  return NextResponse.next()
}

export const config = {
  // Matcher to run middleware on all relevant routes
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
