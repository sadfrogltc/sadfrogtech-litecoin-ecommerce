import { NextRequest } from "next/server"
import { sql } from "@/lib/neon"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const rows = await sql`SELECT data, mime_type FROM product_images WHERE id = ${id} LIMIT 1`
    if (rows.length === 0) {
      return new Response("Not found", { status: 404 })
    }
    const { data, mime_type } = rows[0] as { data: Uint8Array; mime_type: string }
    return new Response(Buffer.from(data), {
      status: 200,
      headers: {
        "Content-Type": mime_type || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("[API] Image fetch failed:", error)
    return new Response("Server error", { status: 500 })
  }
}


