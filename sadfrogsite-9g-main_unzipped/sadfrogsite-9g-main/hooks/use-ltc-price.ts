"use client"

import { useState, useEffect } from "react"

export function useLtcPrice() {
  const [ltcPrice, setLtcPrice] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrice = async () => {
      console.log("[useLtcPrice] Fetching LTC price...")
      setIsLoading(true)
      try {
        const response = await fetch("/api/ltc-price")
        if (!response.ok) {
          throw new Error(`Failed to fetch LTC price (status: ${response.status})`)
        }
        const data = await response.json()
        console.log("[useLtcPrice] Received price data:", data)
        setLtcPrice(data.rate)
        setError(null)
      } catch (err: any) {
        console.error("[useLtcPrice] Error fetching price:", err)
        setError(err.message)
        setLtcPrice(85.0) // Placeholder fallback
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrice()
    const interval = setInterval(fetchPrice, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return { ltcPrice, isLoading, error }
}
