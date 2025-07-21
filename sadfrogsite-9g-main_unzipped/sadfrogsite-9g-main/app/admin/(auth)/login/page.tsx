"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get("redirect")

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/admin/session-check")
        if (!response.ok) {
          // Don't treat a failed check as an error, just means no session
          console.log("[Login Page] Session check failed, assuming no session.")
          return
        }
        const data = await response.json()

        if (data.success) {
          console.log("[Login Page] Already logged in, redirecting...")
          router.push(redirectPath || "/admin")
        }
      } catch (error) {
        console.log("[Login Page] No existing session or network error.")
      }
    }

    checkSession()
  }, [router, redirectPath])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    console.log(`[Login Page] Attempting login for: ${username}`)

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      console.log(`[Login Page] Login response status: ${response.status}`)

      // Improved error handling
      if (!response.ok) {
        let errorMessage = `Login failed with status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          console.log(`[Login Page] Login failed with error response:`, errorData)
        } catch (e) {
          const textResponse = await response.text()
          console.error("[Login Page] Could not parse error response as JSON. Response text:", textResponse)
          errorMessage = "An unexpected server error occurred."
        }
        setError(errorMessage)
        setIsLoading(false)
        return
      }

      const data = await response.json()
      console.log(`[Login Page] Login response data:`, data)

      if (data.success) {
        console.log(`[Login Page] Login successful - Session ID: ${data.sessionId}`)
        toast.success("Login successful! Redirecting...")

        // Wait a moment for the cookie to be set, then redirect
        setTimeout(() => {
          const targetPath = redirectPath || "/admin"
          console.log(`[Login Page] Redirecting to: ${targetPath}`)
          router.push(targetPath)
          router.refresh()
        }, 1000)
      } else {
        console.log(`[Login Page] Login failed: ${data.error}`)
        setError(data.error || "Login failed")
      }
    } catch (error) {
      console.error("[Login Page] Network error:", error)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-sm sm:max-w-md">
        <CardHeader className="text-center pb-4 sm:pb-6">
          <div className="flex justify-center items-center gap-2 mb-3 sm:mb-4">
            <Image src="/sadfrog-logo.png" alt="SadFrogTech Logo" width={32} height={32} className="sm:w-10 sm:h-10" />
            <span className="text-xl sm:text-2xl font-bold">SadFrogTech</span>
          </div>
          <CardTitle className="text-xl sm:text-2xl">Admin Login</CardTitle>
          <div className="text-xs sm:text-sm text-muted-foreground">
            Sign in to access the admin panel
            {redirectPath && <div className="mt-2 text-xs">You'll be redirected to: {redirectPath}</div>}
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="username"
                className="mobile-touch-target"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
                className="mobile-touch-target"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full mobile-touch-target" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          <div className="mt-4 sm:mt-6 space-y-2">
            <Button asChild variant="outline" className="w-full bg-transparent mobile-touch-target">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Homepage
              </Link>
            </Button>
            <div className="text-center text-xs sm:text-sm text-muted-foreground">
              <p>Hint: Check the .env file for demo credentials.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
