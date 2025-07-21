#!/usr/bin/env node

/**
 * Test script to verify the checkout timer functionality
 * This script creates a test order with a short expiration time for testing
 */

const { neon } = require("@neondatabase/serverless")

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_BtwoqYx70zLb@ep-bitter-wave-afw39oiu-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

const sql = neon(DATABASE_URL)

async function createTestOrder() {
  try {
    console.log("Creating test order with 2-minute expiration...")
    
    const orderId = "TEST" + Math.random().toString(36).substring(2, 8).toUpperCase()
    const secureToken = require("crypto").randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000) // 2 minutes from now
    
    const result = await sql`
      INSERT INTO orders (
        order_id, status, customer_name, customer_email, customer_phone,
        shipping_street, shipping_city, shipping_state, shipping_zip, shipping_country,
        total_usd, total_ltc, payment_method, tx_id, confirmations, secure_token, expires_at
      ) VALUES (
        ${orderId}, 'pending', 'Test User', 'test@example.com', '123-456-7890',
        '123 Test St', 'Test City', 'Test State', '12345', 'Test Country',
        99.99, 1.23456789, null, null, 0, ${secureToken}, ${expiresAt}
      )
      RETURNING order_id, expires_at
    `
    
    const order = result[0]
    console.log(`✅ Test order created successfully!`)
    console.log(`Order ID: ${order.order_id}`)
    console.log(`Expires at: ${order.expires_at}`)
    console.log(`Payment URL: http://localhost:3000/payment/${order.order_id}?token=${secureToken}`)
    console.log(`\n⏰ This order will expire in 2 minutes for testing purposes.`)
    
    return { orderId: order.order_id, token: secureToken }
  } catch (error) {
    console.error("❌ Failed to create test order:", error)
    throw error
  }
}

async function checkExpiredOrders() {
  try {
    console.log("\nChecking for expired orders...")
    
    const expiredOrders = await sql`
      SELECT order_id, created_at, expires_at, status
      FROM orders 
      WHERE status = 'pending' AND expires_at < CURRENT_TIMESTAMP
    `
    
    console.log(`Found ${expiredOrders.length} expired orders:`)
    expiredOrders.forEach(order => {
      console.log(`- ${order.order_id}: ${order.status} (expired at ${order.expires_at})`)
    })
    
    return expiredOrders
  } catch (error) {
    console.error("❌ Failed to check expired orders:", error)
    throw error
  }
}

async function cleanupExpiredOrders() {
  try {
    console.log("\nCleaning up expired orders...")
    
    const result = await sql`
      UPDATE orders 
      SET status = 'expired', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'pending' AND expires_at < CURRENT_TIMESTAMP
    `
    
    console.log(`✅ Cleaned up ${result.count} expired orders`)
    return result.count
  } catch (error) {
    console.error("❌ Failed to cleanup expired orders:", error)
    throw error
  }
}

async function main() {
  const command = process.argv[2]
  
  switch (command) {
    case "create":
      await createTestOrder()
      break
    case "check":
      await checkExpiredOrders()
      break
    case "cleanup":
      await cleanupExpiredOrders()
      break
    case "test":
      console.log("🧪 Running full timer test...")
      await createTestOrder()
      console.log("\nWaiting 10 seconds before checking...")
      await new Promise(resolve => setTimeout(resolve, 10000))
      await checkExpiredOrders()
      break
    default:
      console.log("Usage: node test-timer.js [create|check|cleanup|test]")
      console.log("  create   - Create a test order with 2-minute expiration")
      console.log("  check    - Check for expired orders")
      console.log("  cleanup  - Clean up expired orders")
      console.log("  test     - Run full test (create + wait + check)")
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { createTestOrder, checkExpiredOrders, cleanupExpiredOrders } 