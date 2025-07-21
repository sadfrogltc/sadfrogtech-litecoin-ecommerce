"use client"

import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { AdminSession } from "@/lib/admin-session"

interface AdminHeaderProps {
  session: AdminSession
}

export function AdminHeader({ session }: AdminHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      console.log(`[Admin Header] Logging out user: ${session.username}`)

      const response = await fetch("/api/admin/logout", {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Logged out successfully")
        console.log("[Admin Header] Logout successful")

        // Immediately redirect to login to prevent dashboard from loading
        router.push("/admin/login")

        // Force a hard refresh to clear any cached data
        setTimeout(() => {
          window.location.href = "/admin/login"
        }, 100)
      } else {
        throw new Error("Logout request failed")
      }
    } catch (error) {
      console.error("[Admin Header] Logout error:", error)
      toast.error("Logout failed. Please try again.")

      // Even if logout fails, redirect to login as a safety measure
      setTimeout(() => {
        router.push("/admin/login")
      }, 1000)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b px-3 sm:px-6 py-3 sm:py-4 lg:ml-0">
      <div className="flex items-center justify-between">
        {/* Left side - Empty for balance */}
        <div className="w-20 sm:w-24"></div>
        
        {/* Center - Title */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">Admin Panel</h1>
        </div>
        
        {/* Right side - User info and logout */}
        <div className="flex items-center gap-2 sm:gap-4 w-20 sm:w-24 justify-end">
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <div className="text-right">
              <div>Welcome, {session.username}</div>
              <div className="text-xs text-gray-500">Session: {session.sessionId.substring(0, 8)}...</div>
            </div>
          </div>
          <div className="sm:hidden flex items-center gap-1 text-xs text-gray-600">
            <User className="h-3 w-3" />
            <span>{session.username}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="mobile-touch-target"
          >
            <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">Out</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
