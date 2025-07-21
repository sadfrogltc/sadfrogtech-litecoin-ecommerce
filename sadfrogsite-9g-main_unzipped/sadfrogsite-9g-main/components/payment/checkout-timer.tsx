"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Clock, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface CheckoutTimerProps {
  expiresAt: Date
  orderId: string
}

export default function CheckoutTimer({ expiresAt, orderId }: CheckoutTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isExpired, setIsExpired] = useState<boolean>(false)
  const [isLeaving, setIsLeaving] = useState<boolean>(false)
  const router = useRouter()

  // Handle page leave events
  const handleBeforeUnload = useCallback((event: BeforeUnloadEvent) => {
    if (timeLeft > 0 && !isExpired) {
      const message = "Are you sure you want to leave? Your payment session will continue running in the background."
      event.preventDefault()
      event.returnValue = message
      return message
    }
  }, [timeLeft, isExpired])

  // Handle page visibility changes
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && timeLeft > 0 && !isExpired) {
      setIsLeaving(true)
      toast.warning("Payment session is still active. Complete your payment within the remaining time.")
      
      // Log page leave activity
      fetch("/api/orders/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          orderId, 
          action: "page_leave",
          timestamp: new Date().toISOString()
        }),
      }).catch(console.error)
    } else if (!document.hidden && isLeaving) {
      setIsLeaving(false)
      
      // Log page return activity
      fetch("/api/orders/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          orderId, 
          action: "page_return",
          timestamp: new Date().toISOString()
        }),
      }).catch(console.error)
    }
  }, [timeLeft, isExpired, isLeaving, orderId])

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const expirationTime = new Date(expiresAt).getTime()
      const difference = expirationTime - now

      if (difference <= 0) {
        setIsExpired(true)
        setTimeLeft(0)
        return
      }

      setTimeLeft(difference)
    }

    // Calculate immediately
    calculateTimeLeft()

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [expiresAt])

  // Add page leave event listeners
  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [handleBeforeUnload, handleVisibilityChange])

  useEffect(() => {
    if (isExpired) {
      // Mark the order as expired in the database
      fetch("/api/orders/expire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      }).catch((error) => {
        console.error("Failed to expire order:", error)
      })

      toast.error("Checkout session has expired. Your order has been cancelled.")
      // Redirect to home page after a short delay
      setTimeout(() => {
        router.push("/")
      }, 3000)
    }
  }, [isExpired, router, orderId])

  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000)

    return {
      hours: hours.toString().padStart(2, "0"),
      minutes: minutes.toString().padStart(2, "0"),
      seconds: seconds.toString().padStart(2, "0"),
    }
  }

  const { hours, minutes, seconds } = formatTime(timeLeft)

  if (isExpired) {
    return (
      <Card className="w-full max-w-md mx-auto mb-6 border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            Session Expired
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">
            Your checkout session has expired. You will be redirected to the home page shortly.
          </p>
        </CardContent>
      </Card>
    )
  }

  const isWarning = timeLeft < 10 * 60 * 1000 // Less than 10 minutes
  const isCritical = timeLeft < 5 * 60 * 1000 // Less than 5 minutes

  return (
    <div className="space-y-4">
      {/* Page Leave Warning */}
      {isLeaving && (
        <Card className="w-full max-w-md mx-auto border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-5 w-5" />
              Session Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-600 text-sm">
              You left the page, but your payment session is still active. Return to complete your payment within the remaining time.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timer */}
      <Card className={`w-full max-w-md mx-auto ${
        isCritical ? "border-red-200 bg-red-50" : 
        isWarning ? "border-yellow-200 bg-yellow-50" : 
        "border-blue-200 bg-blue-50"
      }`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${
            isCritical ? "text-red-700" : 
            isWarning ? "text-yellow-700" : 
            "text-blue-700"
          }`}>
            <Clock className="h-5 w-5" />
            Time Remaining
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className={`text-3xl font-mono font-bold ${
              isCritical ? "text-red-600" : 
              isWarning ? "text-yellow-600" : 
              "text-blue-600"
            }`}>
              {hours}:{minutes}:{seconds}
            </div>
            <p className={`text-sm mt-2 ${
              isCritical ? "text-red-600" : 
              isWarning ? "text-yellow-600" : 
              "text-blue-600"
            }`}>
              {isCritical 
                ? "Complete your payment quickly!" 
                : isWarning 
                ? "Complete your payment soon" 
                : "Complete your payment within this time"
              }
            </p>
            {isLeaving && (
              <p className="text-xs mt-2 text-gray-600">
                ⚠️ Session continues in background
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 