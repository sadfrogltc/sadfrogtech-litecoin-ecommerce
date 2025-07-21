"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function OrderStatusRedirect({ orderId, token }: { orderId: string, token: string }) {
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (!orderId || !token) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/order-status/${orderId}?token=${token}`)
        if (res.ok) {
          const data = await res.json()
          if (data.status === "paid") {
            setRedirecting(true)
            router.push(`/receipt/${orderId}?token=${token}`)
          }
        }
      } catch (err) {
        // Ignore errors
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [orderId, token, router])

  if (!redirecting) return null
  return (
    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-center">
      Payment confirmed! Redirecting to your receipt...
    </div>
  )
} 