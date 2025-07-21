import { getCache, setCache } from "./cache"

const CACHE_KEY = "ltc-usd-price"
const CACHE_TTL_SECONDS = 5 * 60 // 5 minutes
const FALLBACK_RATE = 85.0

export interface LtcPriceData {
  rate: number
  source: "cache" | "api" | "fallback"
  timestamp: number
  error?: string
}

/**
 * Get current LTC/USD price with caching
 */
export async function getLtcPrice(): Promise<LtcPriceData> {
  try {
    // Check cache first
    const cachedRate = getCache<number>(CACHE_KEY)
    if (cachedRate) {
      return {
        rate: cachedRate,
        source: "cache",
        timestamp: Date.now(),
      }
    }

    // Fetch from API
    const response = await fetch("/api/ltc-price")
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    const rate = data.rate

    if (typeof rate !== "number" || rate <= 0) {
      throw new Error("Invalid rate received from API")
    }

    // Cache the result
    setCache(CACHE_KEY, rate, CACHE_TTL_SECONDS)

    return {
      rate,
      source: "api",
      timestamp: Date.now(),
    }
  } catch (error) {
    console.error("[LTC Conversions] Failed to fetch price:", error)
    return {
      rate: FALLBACK_RATE,
      source: "fallback",
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Convert USD amount to LTC
 */
export async function usdToLtc(usdAmount: number): Promise<{
  ltcAmount: number
  rate: number
  source: string
  error?: string
}> {
  const priceData = await getLtcPrice()
  
  if (priceData.error) {
    return {
      ltcAmount: usdAmount / FALLBACK_RATE,
      rate: FALLBACK_RATE,
      source: "fallback",
      error: priceData.error,
    }
  }

  return {
    ltcAmount: usdAmount / priceData.rate,
    rate: priceData.rate,
    source: priceData.source,
  }
}

/**
 * Convert LTC amount to USD
 */
export async function ltcToUsd(ltcAmount: number): Promise<{
  usdAmount: number
  rate: number
  source: string
  error?: string
}> {
  const priceData = await getLtcPrice()
  
  if (priceData.error) {
    return {
      usdAmount: ltcAmount * FALLBACK_RATE,
      rate: FALLBACK_RATE,
      source: "fallback",
      error: priceData.error,
    }
  }

  return {
    usdAmount: ltcAmount * priceData.rate,
    rate: priceData.rate,
    source: priceData.source,
  }
}

/**
 * Format LTC amount with proper decimal places
 */
export function formatLtcAmount(amount: number): string {
  return amount.toFixed(8)
}

/**
 * Format USD amount with proper decimal places
 */
export function formatUsdAmount(amount: number): string {
  return amount.toFixed(2)
}

/**
 * Get price display string
 */
export function getPriceDisplay(rate: number): string {
  return `$${formatUsdAmount(rate)} USD/LTC`
} 