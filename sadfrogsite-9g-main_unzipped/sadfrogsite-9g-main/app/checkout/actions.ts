"use server"

import { z } from "zod"
import { getLtcPriceServer } from "@/lib/ltc"
import { createOrder } from "@/lib/data"
import { revalidatePath } from "next/cache"

const phoneRegex = new RegExp(/^([+]?[  -9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/)

const checkoutSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }).max(100),
  email: z.string().email({ message: "Please enter a valid email address." }),
  shippingAddress: z.object({
    street: z.string().min(3, { message: "Street address is required." }),
    city: z.string().min(2, { message: "City is required." }),
    state: z.string().min(2, { message: "State / Province is required." }),
    zip: z.string().min(3, { message: "ZIP / Postal code is required." }),
    country: z.string().min(2, { message: "Please select a country." }),
  }),
  phone: z.string().regex(phoneRegex, "Invalid phone number").or(z.literal("")).optional(),
  notes: z.string().max(500, { message: "Notes cannot exceed 500 characters." }).optional(),
})

export async function createOrderAction(formData: FormData) {
  console.log("[Action:createOrder] Received request with form data:", Object.fromEntries(formData.entries()))

  const validation = checkoutSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    shippingAddress: {
      street: formData.get("shippingStreet"),
      city: formData.get("shippingCity"),
      state: formData.get("shippingState"),
      zip: formData.get("shippingZip"),
      country: formData.get("shippingCountry"),
    },
    notes: formData.get("notes"),
  })

  if (!validation.success) {
    console.error("[Action:createOrder] Validation failed:", validation.error)
    return { success: false, message: "Invalid form data. Please check your inputs." }
  }

  const args = validation.data

  try {
    // Calculate cart total
    const cartItems = JSON.parse(formData.get("cartItems") as string || "[]")
    const totalUSD = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    
    console.log(`[Action:createOrder] Cart has ${cartItems.length} items, total $${totalUSD}`)

    // Get LTC price and calculate total
    const ltcPrice = await getLtcPriceServer()
    if (!ltcPrice) {
      console.error("[Action:createOrder] Failed to get LTC price.")
      return { success: false, message: "Could not retrieve LTC exchange rate. Please try again." }
    }
    const totalLtc = totalUSD / ltcPrice
    console.log(`[Action:createOrder] Calculated LTC total: ${totalLtc} (Rate: ${ltcPrice})`)

    // Create order
    const orderId = Math.random().toString(36).substring(2, 8)
    console.log(`[Action:createOrder] Saving order ${orderId}...`)

    const order = await createOrder({
      id: orderId,
      status: "pending",
      customer: { name: args.fullName, email: args.email, phone: args.phone },
      shippingAddress: args.shippingAddress,
      items: cartItems,
      totalUSD: totalUSD,
      totalLtc: totalLtc,
      notes: args.notes || "",
    })

    console.log(`[Action:createOrder] Order ${orderId} saved successfully.`)

    revalidatePath("/")
    revalidatePath("/admin")
    revalidatePath("/catalog")

    return {
      success: true,
      redirectUrl: `/payment/${orderId}?token=${order.secureToken}`,
    }
  } catch (error) {
    console.error("[Action:createOrder] Error creating order:", error)
    return { success: false, message: "Failed to create order. Please try again." }
  }
}
