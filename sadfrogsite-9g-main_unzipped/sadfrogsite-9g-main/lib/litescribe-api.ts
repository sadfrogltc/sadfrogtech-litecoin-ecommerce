// Litescribe API client for sadfrogsite-9g
const BASE_URL = "https://litescribe.io/api"

export async function getAddressBalance(address: string) {
  const res = await fetch(`${BASE_URL}/address/balance?address=${encodeURIComponent(address)}`)
  if (!res.ok) throw new Error("Failed to fetch address balance")
  const data = await res.json()
  if (data.status !== "1" && data.status !== 1) throw new Error(data.message || "API error")
  return data.result
}

export async function getAddressUtxos(address: string) {
  const res = await fetch(`${BASE_URL}/address/btc-utxo?address=${encodeURIComponent(address)}`)
  if (!res.ok) throw new Error("Failed to fetch address UTXOs")
  const data = await res.json()
  if (data.status !== "1" && data.status !== 1) throw new Error(data.message || "API error")
  return data.result
}

export async function getOrderStatus(order: string) {
  const res = await fetch(`${BASE_URL}/order/status?order=${encodeURIComponent(order)}`)
  if (!res.ok) throw new Error("Failed to fetch order status")
  const data = await res.json()
  if (data.status !== "1" && data.status !== 1) throw new Error(data.message || "API error")
  return data.result
}

// Add more endpoints as needed from the OpenAPI spec 