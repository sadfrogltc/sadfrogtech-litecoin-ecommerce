"use client"

import { useState, useEffect } from "react"

export function useSolPrice() {
  const [solPrice, setSolPrice] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSolPrice() {
      try {
        setIsLoading(true)
        setError(null)
        console.log("[useSolPrice] Fetching SOL price...")
        
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd")
        if (!response.ok) {
          throw new Error(`Failed to fetch SOL price (status: ${response.status})`)
        }
        
        const data = await response.json()
        console.log("[useSolPrice] Received price data:", data)
        setSolPrice(data.solana?.usd || null)
      } catch (err) {
        console.error("[useSolPrice] Error fetching price:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch SOL price")
        setSolPrice(100.0) // Placeholder fallback
      } finally {
        setIsLoading(false)
      }
    }

    fetchSolPrice()

    // Refresh price every 5 minutes
    const interval = setInterval(fetchSolPrice, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return { solPrice, isLoading, error }
} 