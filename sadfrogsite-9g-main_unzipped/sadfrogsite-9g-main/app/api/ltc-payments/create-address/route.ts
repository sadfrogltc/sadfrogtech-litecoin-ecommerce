import { NextResponse } from "next/server"
import { getNewLtcAddress } from "@/lib/ltc-node"
import { updateOrder } from "@/lib/data"

export async function POST(request: Request) {
  try {
    const { label } = await request.json().catch(() => ({}))
    const address = await getNewLtcAddress(label)
    // Extract orderId from label if label is 'order-<orderId>'
    let orderId = null
    if (label && label.startsWith('order-')) {
      orderId = label.replace('order-', '')
    }
    if (orderId) {
      await updateOrder(orderId, { senderAddress: address })
    }
    return NextResponse.json({ address })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
} 