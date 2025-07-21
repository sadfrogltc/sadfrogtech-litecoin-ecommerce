import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function POST(request: NextRequest) {
  try {
    const { orderId, action, timestamp } = await request.json()

    if (!orderId || !action) {
      return NextResponse.json({ error: "Order ID and action are required" }, { status: 400 })
    }

    // Log user activity for analytics and debugging
    console.log(`[Order Activity] Order ${orderId}: ${action} at ${timestamp || new Date().toISOString()}`)

    // For now, we just log the activity
    // In the future, you could store this in a separate table for analytics
    // or use it to extend session time for active users

    return NextResponse.json({ success: true, message: "Activity logged" })
  } catch (error) {
    console.error("[API] Error logging activity:", error)
    return NextResponse.json({ error: "Failed to log activity" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    // Get order status and check if it's still valid
    const order = await sql`
      SELECT order_id, status, expires_at, created_at
      FROM orders 
      WHERE order_id = ${orderId}
    `

    if (order.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const orderData = order[0]
    const now = new Date()
    const expiresAt = new Date(orderData.expires_at)
    const isExpired = now > expiresAt || orderData.status === 'expired'
    const timeLeft = Math.max(0, expiresAt.getTime() - now.getTime())

    return NextResponse.json({
      orderId: orderData.order_id,
      status: orderData.status,
      isExpired,
      timeLeft,
      expiresAt: orderData.expires_at,
      createdAt: orderData.created_at
    })
  } catch (error) {
    console.error("[API] Error getting order status:", error)
    return NextResponse.json({ error: "Failed to get order status" }, { status: 500 })
  }
} 