import { NextResponse } from "next/server"
import { getCache, setCache } from "@/lib/cache"

const LIVECOINWATCH_API_KEY = process.env.LIVECOINWATCH_API_KEY || "1af68037-18ea-4d5d-8950-75539b96ddba"
const LTC_FALLBACK_RATE = Number.parseFloat(process.env.LTC_FALLBACK_RATE || "85.0")
const CACHE_KEY = "ltc-usd-price"
const CACHE_TTL_SECONDS = 5 * 60 // 5 minutes

export async function GET() {
  console.log("[API:LTC-Price] Request received.")
  try {
    const cachedRate = getCache<number>(CACHE_KEY)
    if (cachedRate) {
      console.log(`[API:LTC-Price] Cache HIT. Rate: ${cachedRate}`)
      return NextResponse.json({ rate: cachedRate, source: "cache" })
    }

    console.log("[API:LTC-Price] Cache MISS. Fetching from LiveCoinWatch.")
    const response = await fetch("https://api.livecoinwatch.com/coins/single", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": LIVECOINWATCH_API_KEY,
      },
      body: JSON.stringify({ currency: "USD", code: "LTC", meta: false }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[API:LTC-Price] LiveCoinWatch API error: ${response.status}`, errorText)
      throw new Error(`LiveCoinWatch API request failed with status ${response.status}`)
    }

    const data = await response.json()
    const rate = data?.rate

    if (typeof rate !== "number") {
      console.error("[API:LTC-Price] Invalid rate received from API:", data)
      throw new Error("Invalid rate received from LiveCoinWatch API")
    }

    console.log(`[API:LTC-Price] Fetched new rate: ${rate}. Caching for ${CACHE_TTL_SECONDS}s.`)
    setCache(CACHE_KEY, rate, CACHE_TTL_SECONDS)

    return NextResponse.json({ rate, source: "api" })
  } catch (error) {
    console.error("[API:LTC-Price] Failed to fetch LTC price, using fallback.", error)
    return NextResponse.json(
      { rate: LTC_FALLBACK_RATE, source: "fallback", error: (error as Error).message },
      { status: 500 },
    )
  }
}
