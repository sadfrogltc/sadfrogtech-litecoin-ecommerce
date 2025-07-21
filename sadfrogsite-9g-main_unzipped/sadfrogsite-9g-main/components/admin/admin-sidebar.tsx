"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Package, ShoppingCart, Settings, BarChart3, History, X } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: Home },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Audit Logs", href: "/admin/audit-logs", icon: History },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Close sidebar when clicking overlay
  useEffect(() => {
    const overlay = document.getElementById('sidebar-overlay')
    if (overlay) {
      const handleClick = () => setIsOpen(false)
      overlay.addEventListener('click', handleClick)
      return () => overlay.removeEventListener('click', handleClick)
    }
  }, [])

  // Update overlay visibility
  useEffect(() => {
    const overlay = document.getElementById('sidebar-overlay')
    if (overlay) {
      if (isOpen) {
        overlay.classList.remove('hidden')
        overlay.classList.add('animate-in', 'fade-in', 'duration-200')
        overlay.style.backdropFilter = 'blur(6px)'
        overlay.style.background = 'rgba(20, 20, 30, 0.35)'
      } else {
        overlay.classList.add('animate-out', 'fade-out', 'duration-200')
        setTimeout(() => overlay.classList.add('hidden'), 200)
        overlay.style.backdropFilter = ''
        overlay.style.background = ''
      }
    }
  }, [isOpen])

  return (
    <>
      {/* Floating Hamburger Button */}
      <button
        aria-label="Open menu"
        className="lg:hidden fixed top-4 left-4 z-50 rounded-full bg-white/70 shadow-xl border border-gray-200 backdrop-blur-md flex items-center justify-center w-12 h-12 transition-all duration-200 hover:bg-white/90 active:scale-95"
        style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)' }}
        onClick={() => setIsOpen(true)}
      >
        <span className="sr-only">Open menu</span>
        <div className="flex flex-col gap-1 w-6 h-6 justify-center items-center">
          <span className="block w-6 h-0.5 bg-gray-700 rounded-full transition-all duration-300"></span>
          <span className="block w-6 h-0.5 bg-gray-700 rounded-full transition-all duration-300"></span>
          <span className="block w-6 h-0.5 bg-gray-700 rounded-full transition-all duration-300"></span>
        </div>
      </button>

      {/* Sidebar Sheet */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 max-w-[90vw] bg-white/80 backdrop-blur-xl border-r border-gray-200 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col rounded-r-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:relative lg:rounded-none lg:shadow-lg lg:bg-white lg:backdrop-blur-none lg:border-r"
        )}
        style={{ boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)' }}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-primary to-primary/90 rounded-tr-2xl lg:rounded-none">
          <Link href="/admin" className="flex items-center gap-2 text-white font-bold text-lg">
            <Image src="/sadfrog-logo.png" alt="SadFrogTech Logo" width={28} height={28} className="rounded-full shadow-md" />
            <span className="hidden sm:inline">SadFrogTech Admin</span>
            <span className="sm:hidden">Admin</span>
          </Link>
          <button
            aria-label="Close menu"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 transition-colors duration-200 text-white shadow-md"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {navigation.map((item, index) => {
            const isActive = pathname.startsWith(item.href) && (item.href !== "/admin" || pathname === "/admin")
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-full text-base font-medium transition-all duration-200 mobile-touch-target group",
                  "hover:shadow-md hover:scale-[1.03]",
                  isActive
                    ? "bg-gradient-to-r from-primary/90 to-primary text-white shadow-lg scale-[1.04]"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
                style={{
                  animationDelay: `${index * 50}ms`
                }}
              >
                <item.icon className={cn(
                  "h-5 w-5 flex-shrink-0 transition-all duration-200",
                  isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                )} />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
          <li>
            <Link href="/admin/subscribers" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-muted transition-colors">
              <span>Subscribers</span>
            </Link>
          </li>
        </nav>

        {/* Mobile Footer */}
        <div className="lg:hidden p-4 border-t border-gray-100 bg-gray-50/60 rounded-br-2xl">
          <div className="text-xs text-gray-500 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Admin Panel</span>
            </div>
            <p>SadFrogTech Management</p>
          </div>
        </div>
      </aside>
    </>
  )
}
