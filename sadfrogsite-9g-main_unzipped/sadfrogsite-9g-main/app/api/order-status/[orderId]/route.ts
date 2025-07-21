import { NextResponse } from "next/server"
import { getOrderById, updateOrder } from "@/lib/data"
import { findTxWithLitecoinspace, getTransactionConfirmations, REQUIRED_CONFIRMATIONS } from "@/lib/litescribe"
import { sendOrderStatusEmail, sendAdminStatusNotification } from "@/lib/email"

export const dynamic = "force-dynamic" // Ensure this route is not cached

async function handleOrderStatusCheck(orderId: string, token: string | null) {
  console.log(`[API:OrderStatus] Check for order: ${orderId}, Token: ${token ? "Present" : "Missing"}`)

  if (!token) {
    return NextResponse.json({ error: "Missing authentication token" }, { status: 401 })
  }

  const order = await getOrderById(orderId)

  if (!order || order.secureToken !== token) {
    console.error(
      `[API:OrderStatus] Invalid auth for order ${orderId}. Order found: ${!!order}, Token match: ${
        order?.secureToken === token
      }`,
    )
    return NextResponse.json({ error: "Invalid order or token" }, { status: 404 })
  }

  console.log(`[API:OrderStatus] Order ${orderId} found. Current status: ${order.status}`)

  // Final states - no need to check further
  if (order.status === "paid") {
    console.log(`[API:OrderStatus] Order ${orderId} is already paid. No action needed.`)
    return NextResponse.json({ status: "paid", confirmations: order.confirmations })
  }

  // Check for expiration
  const timeSinceCreation = new Date().getTime() - new Date(order.createdAt).getTime()
  if (timeSinceCreation > 30 * 60 * 1000 && order.status === "pending") {
    console.warn(`[API:OrderStatus] Order ${orderId} has expired. Updating status.`)
    await updateOrder(orderId, { status: "expired" })
    return NextResponse.json({ status: "expired" })
  }

  // --- State Machine for Payment Verification ---

  try {
    // State 1: PENDING -> DETECTED/CONFIRMING
    if (order.status === "pending" && !order.txId) {
      console.log(`[API:OrderStatus] [PENDING] Searching for transaction (mempool + confirmed) for order ${orderId}`)
      const foundTx = await findTxWithLitecoinspace(order)
      if (foundTx) {
        if (!foundTx.confirmed) {
          console.log(`[API:OrderStatus] [DETECTED] Found unconfirmed tx ${foundTx.txId} for order ${orderId}. Status: detected (mempool).`)
          await updateOrder(orderId, { txId: foundTx.txId, status: "detected", confirmations: 0 })
          return NextResponse.json({ status: "detected", txId: foundTx.txId, confirmations: 0, confirmed: false, debug: "Found in mempool" })
        } else {
          console.log(`[API:OrderStatus] [CONFIRMING] Found confirmed tx ${foundTx.txId} for order ${orderId}. Status: confirming.`)
        await updateOrder(orderId, { txId: foundTx.txId, status: "confirming", confirmations: 0 })
          return NextResponse.json({ status: "confirming", txId: foundTx.txId, confirmations: 0, confirmed: true, debug: "Found in confirmed" })
        }
      } else {
        console.log(`[API:OrderStatus] [PENDING] No transaction found for order ${orderId}.`)
      }
    }

    // State 2: DETECTED/CONFIRMING -> PAID
    if (order.txId) {
      console.log(`[API:OrderStatus] [CONFIRMING] Checking confirmations for txId ${order.txId} on order ${orderId}...`)
      const confirmations = await getTransactionConfirmations(order.txId)
      if (confirmations !== order.confirmations) {
        await updateOrder(orderId, { confirmations })
        console.log(`[API:OrderStatus] [CONFIRMING] Updated confirmations for order ${orderId}: ${confirmations}`)
      }
      if (confirmations >= REQUIRED_CONFIRMATIONS) {
        console.log(`[API:OrderStatus] [PAID] Tx ${order.txId} has ${confirmations} confirmations. Marking order as PAID.`)
        const previousStatus = order.status
        await updateOrder(orderId, { status: "paid", confirmations })
        
        // Send email notifications for payment confirmation
        if (previousStatus !== "paid") {
          // Send customer receipt
          await sendOrderStatusEmail(order, "paid", previousStatus)
          
          // Send admin notification
          await sendAdminStatusNotification(order, "paid", previousStatus)
        }
        
        return NextResponse.json({ status: "paid", txId: order.txId, confirmations, confirmed: true, debug: "Paid" })
      }
      if (order.status === "detected") {
        await updateOrder(orderId, { status: "confirming" })
        console.log(`[API:OrderStatus] [CONFIRMING] Status moved from detected to confirming for order ${orderId}`)
      }
      console.log(`[API:OrderStatus] [CONFIRMING] Tx ${order.txId} has ${confirmations}/${REQUIRED_CONFIRMATIONS} confirmations. Status remains 'confirming'.`)
      return NextResponse.json({ status: "confirming", txId: order.txId, confirmations, confirmed: confirmations > 0, debug: "Still confirming" })
    }

    // Default: Still pending, no transaction found yet.
    console.log(`[API:OrderStatus] [PENDING] No transaction found yet for order ${orderId}. Status remains pending.`)
    return NextResponse.json({ status: "pending", confirmations: 0, confirmed: false, debug: "No tx found" })
  } catch (error) {
    console.error(`[API:OrderStatus] [ERROR] CRITICAL ERROR checking status for order ${orderId}:`, error)
    return NextResponse.json({ error: "Failed to check transaction status", debug: error?.message }, { status: 500 })
  }
}

async function handleOrderStatusUpdate(orderId: string, body: any) {
  console.log(`[API:OrderStatus] Update for order: ${orderId}`, body)

  const { status, txId, paymentMethod } = body

  if (!status) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 })
  }

  try {
    const updateData: any = { status }
    if (txId) updateData.txId = txId
    if (paymentMethod) updateData.paymentMethod = paymentMethod

    await updateOrder(orderId, updateData)
    
    console.log(`[API:OrderStatus] Successfully updated order ${orderId} to status: ${status}`)
    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error(`[API:OrderStatus] Error updating order ${orderId}:`, error)
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId?: string }> }
) {
  // Await the params to resolve the Promise
  const { orderId } = await context.params;
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId param" }, { status: 400 });
  }
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  return handleOrderStatusCheck(orderId, token);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId?: string }> }
) {
  const { orderId } = await context.params;
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId param" }, { status: 400 });
  }

  try {
    const body = await request.json();
    return handleOrderStatusUpdate(orderId, body);
  } catch (error) {
    console.error(`[API:OrderStatus] Error parsing request body:`, error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
