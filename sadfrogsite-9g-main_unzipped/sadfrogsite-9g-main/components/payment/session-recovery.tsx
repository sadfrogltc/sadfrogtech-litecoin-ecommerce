"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface SessionRecoveryProps {
  orderId: string
  originalItems: any[]
}

export default function SessionRecovery({ orderId, originalItems }: SessionRecoveryProps) {
  const [isChecking, setIsChecking] = useState(true)
  const [orderStatus, setOrderStatus] = useState<any>(null)
  const [isRecovering, setIsRecovering] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkOrderStatus()
  }, [orderId])

  const checkOrderStatus = async () => {
    try {
      const response = await fetch(`/api/orders/activity?orderId=${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setOrderStatus(data)
      }
    } catch (error) {
      console.error("Failed to check order status:", error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleRestartCheckout = async () => {
    setIsRecovering(true)
    try {
      // Clear the current cart and add the original items back
      // This would require implementing cart management
      toast.success("Redirecting to checkout with your items...")
      
      // For now, redirect to home page where they can restart
      setTimeout(() => {
        router.push("/")
      }, 1000)
    } catch (error) {
      console.error("Failed to restart checkout:", error)
      toast.error("Failed to restart checkout. Please try again.")
    } finally {
      setIsRecovering(false)
    }
  }

  const handleGoHome = () => {
    router.push("/")
  }

  if (isChecking) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Checking Session Status...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Verifying your order status...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!orderStatus) {
    return (
      <Card className="w-full max-w-md mx-auto border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            Order Not Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">
            We couldn't find your order. It may have been cancelled or expired.
          </p>
          <Button onClick={handleGoHome} className="w-full">
            Return to Home
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (orderStatus.isExpired) {
    return (
      <Card className="w-full max-w-md mx-auto border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            Session Expired
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">
            Your payment session has expired. Don't worry - you can restart your checkout with the same items.
          </p>
          
          {originalItems && originalItems.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Your items:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {originalItems.map((item, index) => (
                  <li key={index}>
                    {item.title} x{item.quantity} - ${(item.price * item.quantity).toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="space-y-2">
            <Button 
              onClick={handleRestartCheckout} 
              disabled={isRecovering}
              className="w-full"
            >
              {isRecovering ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Restarting...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Restart Checkout
                </>
              )}
            </Button>
            <Button onClick={handleGoHome} variant="outline" className="w-full">
              Return to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // If order is still valid, show normal timer (this shouldn't happen in this component)
  return null
} 