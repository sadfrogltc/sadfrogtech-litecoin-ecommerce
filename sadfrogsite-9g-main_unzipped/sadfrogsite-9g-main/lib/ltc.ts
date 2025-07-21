import { getCache, setCache } from "./cache"

const LIVECOINWATCH_API_KEY = process.env.LIVECOINWATCH_API_KEY || "1af68037-18ea-4d5d-8950-75539b96ddba"
const LTC_FALLBACK_RATE = Number.parseFloat(process.env.LTC_FALLBACK_RATE || "85.0")
const CACHE_KEY = "ltc-usd-price"
const CACHE_TTL_SECONDS = 5 * 60 // 5 minutes

export async function getLtcPriceServer(): Promise<number | null> {
  console.log("[LTC Price Server] Requesting LTC price.")
  try {
    const cachedRate = getCache<number>(CACHE_KEY)
    if (cachedRate) {
      console.log(`[LTC Price Server] Cache HIT. Rate: ${cachedRate}`)
      return cachedRate
    }

    console.log("[LTC Price Server] Cache MISS. Fetching from LiveCoinWatch.")
    const response = await fetch("https://api.livecoinwatch.com/coins/single", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": LIVECOINWATCH_API_KEY },
      body: JSON.stringify({ currency: "USD", code: "LTC", meta: false }),
    })

    if (!response.ok) throw new Error(`LiveCoinWatch API request failed with status ${response.status}`)

    const data = await response.json()
    const rate = data?.rate
    if (typeof rate !== "number") throw new Error("Invalid rate from API")

    console.log(`[LTC Price Server] Fetched new rate: ${rate}. Caching.`)
    setCache(CACHE_KEY, rate, CACHE_TTL_SECONDS)
    return rate
  } catch (error) {
    console.error("[LTC Price Server] Failed to fetch price, using fallback.", error)
    return LTC_FALLBACK_RATE
  }
}
