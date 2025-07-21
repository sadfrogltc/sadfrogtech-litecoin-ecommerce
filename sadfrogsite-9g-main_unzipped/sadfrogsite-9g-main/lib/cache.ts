interface CacheEntry<T> {
  value: T
  expiry: number
}

const cache = new Map<string, CacheEntry<any>>()

export function setCache<T>(key: string, value: T, ttlSeconds: number): void {
  const expiry = Date.now() + ttlSeconds * 1000
  cache.set(key, { value, expiry })
  console.log(`[Cache] SET: key=${key}, ttl=${ttlSeconds}s`)
}

export function getCache<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) {
    console.log(`[Cache] MISS: key=${key}`)
    return null
  }

  if (Date.now() > entry.expiry) {
    cache.delete(key)
    console.log(`[Cache] EXPIRED: key=${key}`)
    return null
  }

  console.log(`[Cache] HIT: key=${key}`)
  return entry.value as T
}
