"use server"

import { z } from "zod"
import { getOrderById, updateOrder } from "@/lib/data"
import type { Order } from "@/types"

export async function submitSenderAddress(
  orderId: string,
  senderAddress: string,
  token: string
) {
  console.log(`[Payment Action] Submitting sender address for order ${orderId}`)

  try {
    const order = await getOrderById(orderId)
    if (!order || order.secureToken !== token) {
      return { success: false, message: "Order not found or invalid token." }
    }

    if (order.status !== "pending") {
      return { success: false, message: "Order is not in pending status." }
    }

    await updateOrder(orderId, { senderAddress: senderAddress })
    
    console.log(`[Payment Action] Sender address updated for order ${orderId}`)
    return { success: true }
  } catch (error) {
    console.error("[Payment Action] Error updating sender address:", error)
    return { success: false, message: "Failed to update sender address." }
  }
}

export async function setOrderToConfirming(orderId: string, secureToken: string, txId: string, senderAddress?: string) {
  console.log(`[Action:setOrderToConfirming] Request for order ${orderId} with txId ${txId}`)
  const order = await getOrderById(orderId)

  if (!order || order.secureToken !== secureToken) {
    console.error(`[Action:setOrderToConfirming] Auth failed for order ${orderId}.`)
    return { success: false, error: "Invalid order or token." }
  }

  if (order.status !== "pending") {
    console.warn(
      `[Action:setOrderToConfirming] Order ${orderId} not in 'pending' state. Status: ${order.status}. Aborting.`,
    )
    return { success: false, error: "Order status does not allow this update." }
  }

  try {
    const updatePayload: Partial<Order> = {
      status: "confirming",
    }
    if (txId && txId !== "unknown") {
      updatePayload.txId = txId
    }
    if (senderAddress) {
      updatePayload.senderAddress = senderAddress
    }
    await updateOrder(orderId, updatePayload)
    console.log(`[Action:setOrderToConfirming] Order ${orderId} status set to confirming.`)
    return { success: true }
  } catch (error) {
    console.error(`[Action:setOrderToConfirming] Failed to update order ${orderId}:`, error)
    return { success: false, error: "Failed to update order." }
  }
}

export async function updateOrderPaymentMethod(
  orderId: string,
  secureToken: string,
  paymentMethod: "manual" | "walletconnect",
) {
  console.log(`[Action:updatePaymentMethod] Request for order ${orderId} to set method: ${paymentMethod}`)
  const order = await getOrderById(orderId)

  if (!order || order.secureToken !== secureToken) {
    console.error(`[Action:updatePaymentMethod] Auth failed for order ${orderId}.`)
    return { success: false, error: "Invalid order or token." }
  }

  try {
    console.log(`[Action:updatePaymentMethod] Updating order ${orderId}...`)
    await updateOrder(orderId, { paymentMethod })
    console.log(`[Action:updatePaymentMethod] Order ${orderId} updated successfully.`)
    return { success: true }
  } catch (error) {
    console.error(`[Action:updatePaymentMethod] Failed to update order ${orderId}:`, error)
    return { success: false, error: "Failed to update order." }
  }
}
