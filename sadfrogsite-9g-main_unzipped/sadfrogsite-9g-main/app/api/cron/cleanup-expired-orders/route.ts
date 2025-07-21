import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a legitimate cron job (you can add more security here)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[Cron] Starting cleanup of expired orders...")

    // Get count of expired orders
    const expiredCountResult = await sql`
      SELECT COUNT(*) as count
      FROM orders 
      WHERE status = 'pending' AND expires_at < CURRENT_TIMESTAMP
    `
    const expiredCount = expiredCountResult[0]?.count || 0

    if (expiredCount > 0) {
      // Update all expired orders to expired status
      await sql`
        UPDATE orders 
        SET status = 'expired', updated_at = CURRENT_TIMESTAMP
        WHERE status = 'pending' AND expires_at < CURRENT_TIMESTAMP
      `

      console.log(`[Cron] Expired ${expiredCount} orders`)
    } else {
      console.log("[Cron] No expired orders found")
    }

    return NextResponse.json({ 
      success: true, 
      expiredCount,
      message: `Cleanup completed. Expired ${expiredCount} orders.`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("[Cron] Error during cleanup:", error)
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 })
  }
} 