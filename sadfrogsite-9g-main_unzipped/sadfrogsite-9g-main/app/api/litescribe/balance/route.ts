import { NextResponse } from "next/server"

const LITESCRIBE_API_KEY = "b9a5cdac-568a-4f8e-a6c9-9b39005001b3"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")
  if (!address) {
    return NextResponse.json({ error: "Missing address param" }, { status: 400 })
  }
  const apiUrl = `https://litescribe.io/api/address/balance?address=${encodeURIComponent(address)}`
  try {
    const res = await fetch(apiUrl, {
      headers: {
        "X-API-KEY": LITESCRIBE_API_KEY,
      },
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("Litescribe API proxy error:", err)
    return NextResponse.json({ error: "Failed to fetch from Litescribe API", details: String(err) }, { status: 500 })
  }
} 