"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import { toast } from "sonner"

export default function CleanupExpiredOrdersButton() {
  const [loading, setLoading] = useState(false)

  const handleCleanup = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/orders/expire", {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error("Failed to cleanup expired orders")
      }

      const result = await response.json()
      toast.success(`Cleanup completed: ${result.expiredCount} orders expired`)
    } catch (error) {
      console.error("Cleanup failed:", error)
      toast.error("Failed to cleanup expired orders")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCleanup}
      disabled={loading}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      {loading ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      {loading ? "Cleaning..." : "Cleanup Expired"}
    </Button>
  )
} 