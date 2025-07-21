import { NextResponse } from "next/server"
import { getReceivedByAddress, getAddressConfirmations, getAddressTransactions } from "@/lib/ltc-node"
import { getOrderBySenderAddress, updateOrder } from "@/lib/data"
import { sendEmail } from '@/lib/email';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")
  const minconf = parseInt(searchParams.get("minconf") || "1", 10)
  if (!address) {
    return NextResponse.json({ error: "Missing address param" }, { status: 400 })
  }
  try {
    console.log(`[API] Checking payment for address: ${address}, minconf: ${minconf}`)
    const received = await getReceivedByAddress(address, minconf)
    const confirmations = await getAddressConfirmations(address)
    const txids = await getAddressTransactions(address, minconf)
    console.log(`[API] Received: ${received}, Confirmations: ${confirmations}, Txids:`, txids)

    // Update order in DB if payment detected
    if (received > 0 && txids.length > 0) {
      const order = await getOrderBySenderAddress(address)
      if (order && order.status !== "paid") {
        await updateOrder(order.id, {
          status: "paid", // Always mark as paid if txid is present and amount is correct
          txId: txids[0],
          confirmations,
          senderAddress: address,
        })
        console.log(`[API] Updated order ${order.id} to status paid (txid detected)`)

        // --- EMAIL LOGIC ---
        // Generate product details for emails
        const productDetailsHtml = order.items.map(item => 
          `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.title}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.sku}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">$${item.price.toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">$${(item.price * item.quantity).toFixed(2)}</td>
          </tr>`
        ).join('');

        const productDetailsText = order.items.map(item => 
          `- ${item.title} (SKU: ${item.sku}) x${item.quantity} - $${item.price.toFixed(2)} each = $${(item.price * item.quantity).toFixed(2)}`
        ).join('\n');

        // Send receipt to user
        if (order.customer?.email) {
          await sendEmail({
            to: order.customer.email,
            subject: `Your SadFrog Order Receipt (#${order.id})`,
            text: `Thank you for your payment!

Order ID: ${order.id}
Amount: ${order.totalLtc} LTC
Status: Paid
Transaction ID: ${txids[0]}

Products Ordered:
${productDetailsText}

If you have any questions, contact support.`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <h1 style="color: #333; border-bottom: 3px solid #28a745; padding-bottom: 10px; margin-bottom: 30px;">
                    Thank you for your payment! ✅
                  </h1>
                  
                  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                    <h2 style="color: #28a745; margin-top: 0;">Order Details</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px; font-weight: bold; width: 150px;">Order ID:</td>
                        <td style="padding: 8px;">${order.id}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px; font-weight: bold;">Amount:</td>
                        <td style="padding: 8px; font-weight: bold; color: #28a745;">${order.totalLtc} LTC</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px; font-weight: bold;">Status:</td>
                        <td style="padding: 8px; color: #28a745; font-weight: bold;">Paid</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px; font-weight: bold;">Transaction ID:</td>
                        <td style="padding: 8px; font-family: monospace; font-size: 12px;">${txids[0]}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                    <h2 style="color: #28a745; margin-top: 0;">Products Ordered</h2>
                    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                      <thead>
                        <tr style="background-color: #e9ecef;">
                          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: bold;">Product</th>
                          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: bold;">SKU</th>
                          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: bold;">Qty</th>
                          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: bold;">Price</th>
                          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: bold;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${productDetailsHtml}
                      </tbody>
                    </table>
                  </div>
                  
                  <div style="background-color: #e7f3ff; padding: 20px; border-radius: 6px; border-left: 4px solid #28a745;">
                    <p style="margin: 0; font-size: 16px; line-height: 1.6;">
                      If you have any questions, contact support.
                    </p>
                  </div>
                  
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px;">
                    Thank you for your purchase! - SadFrogTech
                  </div>
                </div>
              </div>
            `
          });
        }
        // Send notification to admin
        await sendEmail({
          to: process.env.ADMIN_EMAIL || 'sadfrogltc@gmail.com',
          subject: `New Paid Order (#${order.id})`,
          text: `A new order has been paid.

Order ID: ${order.id}
Customer: ${order.customer?.name} (${order.customer?.email})
Amount: ${order.totalLtc} LTC
Status: Paid
Transaction ID: ${txids[0]}

Products Ordered:
${productDetailsText}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
              <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1 style="color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; margin-bottom: 30px;">
                  New Paid Order
                </h1>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                  <h2 style="color: #007bff; margin-top: 0;">Order Details</h2>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px; font-weight: bold; width: 150px;">Order ID:</td>
                      <td style="padding: 8px;">${order.id}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; font-weight: bold;">Customer:</td>
                      <td style="padding: 8px;">${order.customer?.name} (<a href="mailto:${order.customer?.email}" style="color: #007bff;">${order.customer?.email}</a>)</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; font-weight: bold;">Amount:</td>
                      <td style="padding: 8px; font-weight: bold; color: #28a745;">${order.totalLtc} LTC</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; font-weight: bold;">Status:</td>
                      <td style="padding: 8px; color: #28a745; font-weight: bold;">Paid</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; font-weight: bold;">Transaction ID:</td>
                      <td style="padding: 8px; font-family: monospace; font-size: 12px;">${txids[0]}</td>
                    </tr>
                  </table>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                  <h2 style="color: #007bff; margin-top: 0;">Products Ordered</h2>
                  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                    <thead>
                      <tr style="background-color: #e9ecef;">
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: bold;">Product</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: bold;">SKU</th>
                        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: bold;">Qty</th>
                        <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: bold;">Price</th>
                        <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: bold;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${productDetailsHtml}
                    </tbody>
                  </table>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px;">
                  This is an automated notification from the SadFrogTech order management system.
                </div>
              </div>
            </div>
          `
        });
        // --- END EMAIL LOGIC ---
      }
    }

    return NextResponse.json({ received, confirmations, txids })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
} 