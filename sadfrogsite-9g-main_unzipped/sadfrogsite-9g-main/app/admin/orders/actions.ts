"use server"

import { revalidatePath } from "next/cache"
import { getAdminSession } from "@/lib/admin-session"
import { sql } from "@/lib/neon"
import { getOrderById, updateOrder } from "@/lib/data"
import { sendOrderStatusEmail, sendAdminStatusNotification } from "@/lib/email"
import { z } from "zod"

async function logAudit(
  session: { userId: string; username: string } | null,
  action: string,
  targetType: string,
  targetId: string,
  details: object,
) {
  if (!session) {
    console.error(`[Audit Log] FAILED: Attempted to log action "${action}" without an active session.`)
    return
  }
  try {
    await sql`
      INSERT INTO audit_logs (user_id, username, action, target_type, target_id, details)
      VALUES (${session.userId}, ${session.username}, ${action}, ${targetType}, ${targetId}, ${JSON.stringify(details)})
    `
  } catch (error) {
    console.error(`[Audit Log] FAILED to write audit log for action ${action} on ${targetId}:`, error)
  }
}

const updateOrderSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled", "expired", "confirming"]),
  notes: z.string().optional(),
})

export async function updateOrderStatus(prevState: any, formData: FormData) {
  const orderId = formData.get("orderId") as string
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Authentication required." }

  console.log(`[Action] User ${session.username} initiating status update for order ${orderId}.`)
  await logAudit(session, "order_status_update_initiated", "order", orderId, {})

  const validatedFields = updateOrderSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  })

  if (!validatedFields.success) {
    const errorDetails = validatedFields.error.flatten().fieldErrors
    await logAudit(session, "order_status_update_failed", "order", orderId, {
      error: "Validation failed",
      details: errorDetails,
    })
    return { success: false, error: "Invalid form data.", fieldErrors: errorDetails }
  }

  const { status, notes } = validatedFields.data
  try {
    const currentOrder = await getOrderById(orderId)
    if (!currentOrder) {
      await logAudit(session, "order_status_update_failed", "order", orderId, { error: "Order not found" })
      return { success: false, error: "Order not found." }
    }

    const previousStatus = currentOrder.status
    const updateData: any = { status }
    if (notes) {
      updateData.notes = notes
    }
    console.log(`[Action] Updating order ${orderId} with:`, updateData)
    const updatedOrder = await updateOrder(orderId, updateData)
    console.log(`[Action] Order ${orderId} updated. Result:`, updatedOrder)

    // Adjust stock when transitioning to cancelled from a non-cancelled state
    if (previousStatus !== "cancelled" && status === "cancelled") {
      try {
        const order = await getOrderById(orderId)
        if (order) {
          for (const item of order.items) {
            await sql`
              UPDATE products
              SET stock_limit = CASE 
                WHEN stock_limit IS NULL THEN NULL
                ELSE stock_limit + ${item.quantity}
              END,
              stock_status = CASE 
                WHEN stock_limit IS NULL THEN stock_status
                WHEN stock_limit + ${item.quantity} > 0 THEN 'in-stock'
                ELSE stock_status
              END,
              updated_at = CURRENT_TIMESTAMP
              WHERE id = ${item.id}
            `
          }
        }
      } catch (stockError) {
        console.error("[Action] Failed to restock items on cancellation:", stockError)
      }
    }

    // Send email notifications for status changes
    if (previousStatus !== status) {
      try {
        // Send customer notification
        await sendOrderStatusEmail(currentOrder, status, previousStatus, notes)
        // Send admin notification
        await sendAdminStatusNotification(currentOrder, status, previousStatus, notes)
        console.log(`[Action] Email notifications sent for order ${orderId}`)
      } catch (emailError) {
        console.error(`[Action] Email notification failed for order ${orderId}:`, emailError)
      }
    }

    await logAudit(session, "order_status_update_success", "order", orderId, { 
      from: previousStatus, 
      to: status,
      notes: notes || null 
    })
    revalidatePath("/admin/orders")
    return { success: true, message: `Order ${orderId} status updated to ${status}.` }
  } catch (error) {
    console.error(`[Action] updateOrderStatus failed for order ${orderId}:`, error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    await logAudit(session, "order_status_update_failed", "order", orderId, { error: errorMessage, stack: (error && typeof error === 'object' && 'stack' in error) ? (error as any).stack : undefined })
    return { success: false, error: `Server error: ${errorMessage}` }
  }
}

export async function cancelOrderAction(orderId: string) {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Authentication required." }

  console.log(`[Action] User ${session.username} initiating cancellation for order ${orderId}.`)
  await logAudit(session, "order_cancel_initiated", "order", orderId, {})

  try {
    const currentOrder = await getOrderById(orderId)
    if (!currentOrder) {
      await logAudit(session, "order_cancel_failed", "order", orderId, { error: "Order not found" })
      return { success: false, error: "Order not found." }
    }

    const previousStatus = currentOrder.status
    await updateOrder(orderId, { status: "cancelled" })

    // Send email notifications for cancellation
    if (previousStatus !== "cancelled") {
      // Send customer notification
      await sendOrderStatusEmail(currentOrder, "cancelled", previousStatus)
      
      // Send admin notification
      await sendAdminStatusNotification(currentOrder, "cancelled", previousStatus)
    }

    await logAudit(session, "order_cancel_success", "order", orderId, { from: previousStatus, to: "cancelled" })
    revalidatePath("/admin/orders")
    return { success: true, message: `Order ${orderId} has been cancelled.` }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    await logAudit(session, "order_cancel_failed", "order", orderId, { error: errorMessage })
    return { success: false, error: "An unexpected server error occurred." }
  }
}

export async function permanentlyDeleteOrderAction(orderId: string) {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Authentication required." }

  console.log(`[Action] User ${session.username} initiating PERMANENT DELETION for order ${orderId}.`)
  const orderToDelete = await getOrderById(orderId)
  await logAudit(session, "order_delete_initiated", "order", orderId, {
    orderDetails: orderToDelete || "Order not found",
  })

  try {
    const result = await sql`DELETE FROM orders WHERE order_id = ${orderId}`

    if (result.count === 0) {
      await logAudit(session, "order_delete_failed", "order", orderId, {
        error: "Order not found during deletion attempt",
      })
      return { success: false, error: "Order not found." }
    }

    await logAudit(session, "order_delete_success", "order", orderId, { deletedOrder: orderToDelete })
    revalidatePath("/admin/orders")
    return { success: true, message: `Order ${orderId} has been permanently deleted.` }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    await logAudit(session, "order_delete_failed", "order", orderId, { error: errorMessage })
    return { success: false, error: "An unexpected server error occurred." }
  }
}
