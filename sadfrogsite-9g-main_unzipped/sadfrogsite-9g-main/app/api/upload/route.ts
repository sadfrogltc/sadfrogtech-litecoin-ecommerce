import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"

const MAX_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || ""
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 })
    }

    // Validate type & size
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const mimeType = file.type || "application/octet-stream"

    const result = await sql`
      INSERT INTO product_images (data, mime_type)
      VALUES (${buffer}, ${mimeType})
      RETURNING id
    `

    const id = result[0].id as string
    const origin = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin
    const path = `/api/images/${id}`
    const url = `${origin}${path}`
    return NextResponse.json({ id, url, path })
  } catch (error) {
    console.error("[API] Upload failed:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}


