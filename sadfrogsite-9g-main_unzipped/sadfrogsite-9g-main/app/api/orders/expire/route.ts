import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    // Update the order status to expired
    const result = await sql`
      UPDATE orders 
      SET status = 'expired', updated_at = CURRENT_TIMESTAMP
      WHERE order_id = ${orderId} AND status = 'pending'
    `

    if (result.count === 0) {
      return NextResponse.json({ error: "Order not found or already processed" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Order expired successfully" })
  } catch (error) {
    console.error("[API] Error expiring order:", error)
    return NextResponse.json({ error: "Failed to expire order" }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get all expired orders that are still marked as pending
    const expiredOrders = await sql`
      SELECT order_id, created_at, expires_at
      FROM orders 
      WHERE status = 'pending' AND expires_at < CURRENT_TIMESTAMP
    `

    // Update all expired orders to expired status
    if (expiredOrders.length > 0) {
      await sql`
        UPDATE orders 
        SET status = 'expired', updated_at = CURRENT_TIMESTAMP
        WHERE status = 'pending' AND expires_at < CURRENT_TIMESTAMP
      `
    }

    return NextResponse.json({ 
      success: true, 
      expiredCount: expiredOrders.length,
      message: `Expired ${expiredOrders.length} orders`
    })
  } catch (error) {
    console.error("[API] Error cleaning up expired orders:", error)
    return NextResponse.json({ error: "Failed to cleanup expired orders" }, { status: 500 })
  }
} 