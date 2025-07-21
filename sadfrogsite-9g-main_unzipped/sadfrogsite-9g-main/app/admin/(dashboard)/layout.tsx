import type React from "react"
import { getAdminSession, clearAdminSession } from "@/lib/admin-session"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

async function logoutAction() {
  "use server"
  console.log("[Admin Layout] Processing logout")
  await clearAdminSession()
  redirect("/admin/login")
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  console.log("[Dashboard Layout] Checking session...")

  const session = await getAdminSession()

  if (!session) {
    console.log("[Dashboard Layout] No valid session found, redirecting to login")
    redirect("/admin/login")
  }

  console.log(`[Dashboard Layout] Valid session found for user: ${session.username}`)

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* Mobile Sidebar Overlay */}
      <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50 hidden" id="sidebar-overlay"></div>
      {/* Sidebar */}
      <div className="lg:relative fixed inset-y-0 left-0 z-50 lg:z-auto">
        <AdminSidebar />
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen max-h-screen overflow-y-auto lg:ml-0">
        <AdminHeader session={session} />
        <main className="flex-1 min-h-0 overflow-y-auto bg-gray-100 p-3 sm:p-6">
          <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
            <strong>Debug:</strong> Session active for {session.username} (ID: {session.sessionId.substring(0, 8)}...)
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}
