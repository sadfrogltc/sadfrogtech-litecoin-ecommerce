import { Resend } from 'resend';
import type { Order } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendEmail({ to, subject, html, text, from }: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}) {
  return resend.emails.send({
    from: from || 'SadFrogTech <noreply@sadfrog.tech>',
    to,
    subject,
    html,
    text,
  });
}

// Email templates for different order status changes
export async function sendOrderStatusEmail(order: Order, newStatus: string, previousStatus: string, notes?: string) {
  if (!order.customer?.email) {
    console.log(`[Email] No customer email found for order ${order.id}`);
    return;
  }

  // Generate product details HTML and text
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

  // Generate notes section if notes are provided
  const notesHtml = notes ? `
    <div style="background-color: #fff3cd; padding: 20px; border-radius: 6px; border-left: 4px solid #ffc107; margin-bottom: 25px;">
      <h3 style="color: #856404; margin-top: 0; margin-bottom: 10px;">📝 Admin Notes</h3>
      <p style="margin: 0; color: #856404; font-style: italic; line-height: 1.6;">${notes}</p>
    </div>
  ` : '';

  const notesText = notes ? `\n\nAdmin Notes:\n${notes}` : '';

  const statusEmails = {
    pending: {
      subject: `Order Confirmed - Awaiting Payment (#${order.id})`,
      text: `Your order #${order.id} has been confirmed and is awaiting payment.

Order Details:
- Order ID: ${order.id}
- Total: $${order.totalUSD} (${order.totalLtc} LTC)
- Status: Pending Payment

Products Ordered:
${productDetailsText}

Please complete your payment to proceed with your order. You have 30 minutes to complete the payment.

Thank you for choosing SadFrogTech!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #333; border-bottom: 3px solid #ffc107; padding-bottom: 10px; margin-bottom: 30px;">
              Order Confirmed - Awaiting Payment ⏳
            </h1>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #ffc107; margin-top: 0;">Order Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; font-weight: bold; width: 150px;">Order ID:</td>
                  <td style="padding: 8px;">${order.id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Total:</td>
                  <td style="padding: 8px; font-weight: bold; color: #ffc107;">$${order.totalUSD} (${order.totalLtc} LTC)</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Status:</td>
                  <td style="padding: 8px; color: #ffc107; font-weight: bold;">Pending Payment</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #ffc107; margin-top: 0;">Products Ordered</h2>
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
            
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 6px; border-left: 4px solid #ffc107;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6;">
                Please complete your payment to proceed with your order. You have 30 minutes to complete the payment.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px;">
              Thank you for choosing SadFrogTech!
            </div>
          </div>
        </div>
      `
    },
    confirming: {
      subject: `Payment Detected - Confirming Order (#${order.id})`,
      text: `Great news! We've detected your payment for order #${order.id} and are confirming it.

Order Details:
- Order ID: ${order.id}
- Total: $${order.totalUSD} (${order.totalLtc} LTC)
- Status: Confirming Payment

Products Ordered:
${productDetailsText}

Your payment is being confirmed on the blockchain. This usually takes a few minutes. You'll receive another update once the payment is fully confirmed.

Thank you for your patience!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #333; border-bottom: 3px solid #17a2b8; padding-bottom: 10px; margin-bottom: 30px;">
              Payment Detected - Confirming Order 🔍
            </h1>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #17a2b8; margin-top: 0;">Order Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; font-weight: bold; width: 150px;">Order ID:</td>
                  <td style="padding: 8px;">${order.id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Total:</td>
                  <td style="padding: 8px; font-weight: bold; color: #17a2b8;">$${order.totalUSD} (${order.totalLtc} LTC)</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Status:</td>
                  <td style="padding: 8px; color: #17a2b8; font-weight: bold;">Confirming Payment</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #17a2b8; margin-top: 0;">Products Ordered</h2>
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
            
            <div style="background-color: #e7f3ff; padding: 20px; border-radius: 6px; border-left: 4px solid #17a2b8;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6;">
                Your payment is being confirmed on the blockchain. This usually takes a few minutes. You'll receive another update once the payment is fully confirmed.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px;">
              Thank you for your patience! - SadFrogTech
            </div>
          </div>
        </div>
      `
    },
    paid: {
      subject: `Payment Confirmed - Order #${order.id}`,
      text: `Payment confirmed! Your order #${order.id} has been paid successfully.

Order Details:
- Order ID: ${order.id}
- Total: $${order.totalUSD} (${order.totalLtc} LTC)
- Status: Paid
- Transaction ID: ${order.txId || 'N/A'}

Products Ordered:
${productDetailsText}

Your order will be processed and shipped soon. You'll receive updates as your order progresses.

Thank you for your purchase!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #333; border-bottom: 3px solid #28a745; padding-bottom: 10px; margin-bottom: 30px;">
              Payment Confirmed! ✅
            </h1>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #28a745; margin-top: 0;">Order Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; font-weight: bold; width: 150px;">Order ID:</td>
                  <td style="padding: 8px;">${order.id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Total:</td>
                  <td style="padding: 8px; font-weight: bold; color: #28a745;">$${order.totalUSD} (${order.totalLtc} LTC)</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Status:</td>
                  <td style="padding: 8px; color: #28a745; font-weight: bold;">Paid</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Transaction ID:</td>
                  <td style="padding: 8px; font-family: monospace; font-size: 12px;">${order.txId || 'N/A'}</td>
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
                Your order will be processed and shipped soon. You'll receive updates as your order progresses.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px;">
              Thank you for your purchase! - SadFrogTech
            </div>
          </div>
        </div>
      `
    },
    processing: {
      subject: `Your Order is Being Processed (#${order.id})`,
      text: `Great news! Your order #${order.id} is now being processed.

Order Details:
- Order ID: ${order.id}
- Total: $${order.totalUSD} (${order.totalLtc} LTC)
- Status: Processing

Products Ordered:
${productDetailsText}

We're preparing your items for shipment. You'll receive another update when your order ships.

Thank you for choosing SadFrogTech!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; margin-bottom: 30px;">
              Your Order is Being Processed! 🚀
            </h1>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #007bff; margin-top: 0;">Order Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; font-weight: bold; width: 150px;">Order ID:</td>
                  <td style="padding: 8px;">${order.id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Total:</td>
                  <td style="padding: 8px; font-weight: bold; color: #007bff;">$${order.totalUSD} (${order.totalLtc} LTC)</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Status:</td>
                  <td style="padding: 8px; color: #007bff; font-weight: bold;">Processing</td>
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
            
            <div style="background-color: #e7f3ff; padding: 20px; border-radius: 6px; border-left: 4px solid #007bff;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6;">
                We're preparing your items for shipment. You'll receive another update when your order ships.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px;">
              Thank you for choosing SadFrogTech!
            </div>
          </div>
        </div>
      `
    },
    shipped: {
      subject: `Your Order Has Shipped! (#${order.id})`,
      text: `Exciting news! Your order #${order.id} has been shipped.

Order Details:
- Order ID: ${order.id}
- Total: $${order.totalUSD} (${order.totalLtc} LTC)
- Status: Shipped

Products Ordered:
${productDetailsText}

Your package is on its way! You should receive it soon.

Thank you for choosing SadFrogTech!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #333; border-bottom: 3px solid #17a2b8; padding-bottom: 10px; margin-bottom: 30px;">
              Your Order Has Shipped! 🚚
            </h1>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #17a2b8; margin-top: 0;">Order Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; font-weight: bold; width: 150px;">Order ID:</td>
                  <td style="padding: 8px;">${order.id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Total:</td>
                  <td style="padding: 8px; font-weight: bold; color: #17a2b8;">$${order.totalUSD} (${order.totalLtc} LTC)</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Status:</td>
                  <td style="padding: 8px; color: #17a2b8; font-weight: bold;">Shipped</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #17a2b8; margin-top: 0;">Products Ordered</h2>
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
            
            <div style="background-color: #e7f3ff; padding: 20px; border-radius: 6px; border-left: 4px solid #17a2b8;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6;">
                Your package is on its way! You should receive it soon.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px;">
              Thank you for choosing SadFrogTech!
            </div>
          </div>
        </div>
      `
    },
    delivered: {
      subject: `Your Order Has Been Delivered! (#${order.id})`,
      text: `Your order #${order.id} has been successfully delivered!

Order Details:
- Order ID: ${order.id}
- Total: $${order.totalUSD} (${order.totalLtc} LTC)
- Status: Delivered

Products Ordered:
${productDetailsText}

We hope you love your purchase! If you have any questions or need support, please don't hesitate to contact us.

We'd love your feedback! Please leave a review for your order:
${process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com"}/review/${order.id}?token=${order.secureToken}

Thank you for choosing SadFrogTech!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #333; border-bottom: 3px solid #28a745; padding-bottom: 10px; margin-bottom: 30px;">
              Your Order Has Been Delivered! 📦
            </h1>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #28a745; margin-top: 0;">Order Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; font-weight: bold; width: 150px;">Order ID:</td>
                  <td style="padding: 8px;">${order.id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Total:</td>
                  <td style="padding: 8px; font-weight: bold; color: #28a745;">$${order.totalUSD} (${order.totalLtc} LTC)</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Status:</td>
                  <td style="padding: 8px; color: #28a745; font-weight: bold;">Delivered</td>
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
            
            <div style="background-color: #e7f3ff; padding: 20px; border-radius: 6px; border-left: 4px solid #28a745; margin-bottom: 25px;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6;">
                We hope you love your purchase! If you have any questions or need support, please don't hesitate to contact us.
              </p>
            </div>
            <div style="background-color: #fffbe6; padding: 20px; border-radius: 6px; border-left: 4px solid #ffc107; margin-bottom: 25px;">
              <h2 style="color: #ffc107; margin-top: 0;">We'd Love Your Feedback!</h2>
              <p style="margin: 0; font-size: 16px; line-height: 1.6;">
                Please let us know how we did by leaving a review for your order:
              </p>
              <p style="margin: 16px 0;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com"}/review/${order.id}?token=${order.secureToken}" style="display:inline-block;padding:12px 24px;background:#ffc107;color:#222;text-decoration:none;border-radius:6px;font-weight:bold;">
                  Leave a Review
                </a>
              </p>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px;">
              Thank you for choosing SadFrogTech!
            </div>
          </div>
        </div>
      `
    },
    cancelled: {
      subject: `Your Order Has Been Cancelled (#${order.id})`,
      text: `Your order #${order.id} has been cancelled.

Order Details:
- Order ID: ${order.id}
- Total: $${order.totalUSD} (${order.totalLtc} LTC)
- Status: Cancelled

Products Ordered:
${productDetailsText}

If you have any questions about this cancellation, please contact our support team.

Thank you for your understanding.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #333; border-bottom: 3px solid #dc3545; padding-bottom: 10px; margin-bottom: 30px;">
              Your Order Has Been Cancelled
            </h1>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #dc3545; margin-top: 0;">Order Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; font-weight: bold; width: 150px;">Order ID:</td>
                  <td style="padding: 8px;">${order.id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Total:</td>
                  <td style="padding: 8px; font-weight: bold; color: #dc3545;">$${order.totalUSD} (${order.totalLtc} LTC)</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Status:</td>
                  <td style="padding: 8px; color: #dc3545; font-weight: bold;">Cancelled</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #dc3545; margin-top: 0;">Products Ordered</h2>
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
            
            <div style="background-color: #f8d7da; padding: 20px; border-radius: 6px; border-left: 4px solid #dc3545;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6;">
                If you have any questions about this cancellation, please contact our support team.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px;">
              Thank you for your understanding. - SadFrogTech
            </div>
          </div>
        </div>
      `
    },
    expired: {
      subject: `Order Expired - Payment Timeout (#${order.id})`,
      text: `Your order #${order.id} has expired due to payment timeout.

Order Details:
- Order ID: ${order.id}
- Total: $${order.totalUSD} (${order.totalLtc} LTC)
- Status: Expired

Products Ordered:
${productDetailsText}

The payment window for this order has expired. If you'd like to place a new order, please visit our website.

Thank you for your interest in SadFrogTech!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #333; border-bottom: 3px solid #6c757d; padding-bottom: 10px; margin-bottom: 30px;">
              Order Expired - Payment Timeout ⏰
            </h1>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #6c757d; margin-top: 0;">Order Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; font-weight: bold; width: 150px;">Order ID:</td>
                  <td style="padding: 8px;">${order.id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Total:</td>
                  <td style="padding: 8px; font-weight: bold; color: #6c757d;">$${order.totalUSD} (${order.totalLtc} LTC)</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Status:</td>
                  <td style="padding: 8px; color: #6c757d; font-weight: bold;">Expired</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #6c757d; margin-top: 0;">Products Ordered</h2>
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
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #6c757d;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6;">
                The payment window for this order has expired. If you'd like to place a new order, please visit our website.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px;">
              Thank you for your interest in SadFrogTech!
            </div>
          </div>
        </div>
      `
    }
  };

  const emailTemplate = statusEmails[newStatus as keyof typeof statusEmails];
  
  if (emailTemplate) {
    try {
      await sendEmail({
        to: order.customer.email,
        subject: emailTemplate.subject,
        text: emailTemplate.text + notesText,
        html: emailTemplate.html + notesHtml
      });
      console.log(`[Email] Status update email sent to ${order.customer.email} for order ${order.id} (${previousStatus} → ${newStatus})`);
    } catch (error) {
      console.error(`[Email] Failed to send status update email for order ${order.id}:`, error);
    }
  }
}

// Send admin notification for status changes
export async function sendAdminStatusNotification(order: Order, newStatus: string, previousStatus: string, notes?: string) {
  // Generate product details HTML and text for admin
  const productDetailsHtml = order.items.map(item => 
    `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.title}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.sku}</td>
      <td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
      <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">$${item.price.toFixed(2)}</td>
      <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`
  ).join('');

  const productDetailsText = order.items.map(item => 
    `- ${item.title} (SKU: ${item.sku}) x${item.quantity} - $${item.price.toFixed(2)} each = $${(item.price * item.quantity).toFixed(2)}`
  ).join('\n');

  // Generate notes section if notes are provided
  const notesHtml = notes ? `
    <div style="background-color: #fff3cd; padding: 20px; border-radius: 6px; border-left: 4px solid #ffc107; margin-bottom: 25px;">
      <h3 style="color: #856404; margin-top: 0; margin-bottom: 10px;">📝 Admin Notes Added</h3>
      <p style="margin: 0; color: #856404; font-style: italic; line-height: 1.6;">${notes}</p>
    </div>
  ` : '';

  const notesText = notes ? `\n\nADMIN NOTES ADDED:\n${notes}` : '';

  // Format timestamps
  const orderDate = order.createdAt.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const statusChangeTime = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  try {
    await sendEmail({
      to: process.env.ADMIN_EMAIL || 'sadfrogltc@gmail.com',
      subject: `Order Status Updated: ${order.id} (${previousStatus} → ${newStatus})`,
      text: `ADMIN NOTIFICATION - Order Status Change

ORDER DETAILS:
Order ID: ${order.id}
Order Date: ${orderDate}
Status Change Time: ${statusChangeTime}
Previous Status: ${previousStatus}
New Status: ${newStatus}

CUSTOMER INFORMATION:
Name: ${order.customer?.name}
Email: ${order.customer?.email}
Phone: ${order.customer?.phone || 'Not provided'}

SHIPPING ADDRESS:
${order.shippingAddress.street}
${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}
${order.shippingAddress.country}

PAYMENT INFORMATION:
Total USD: $${order.totalUSD.toFixed(2)}
Total LTC: ${order.totalLtc} LTC
Payment Method: ${order.paymentMethod || 'Litecoin'}
Transaction ID: ${order.txId || 'Not available'}
Confirmations: ${order.confirmations || 0}
Sender Address: ${order.senderAddress || 'Not available'}

PRODUCTS ORDERED:
${productDetailsText}

ORDER SUMMARY:
- Total Items: ${order.items.reduce((sum, item) => sum + item.quantity, 0)}
- Unique Products: ${order.items.length}
- Order Value: $${order.totalUSD.toFixed(2)} (${order.totalLtc} LTC)${notesText}

This is an automated notification from the SadFrogTech order management system.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; margin-bottom: 30px;">
              ADMIN NOTIFICATION - Order Status Change
            </h1>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #007bff; margin-top: 0;">ORDER DETAILS</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; font-weight: bold; width: 150px;">Order ID:</td>
                  <td style="padding: 8px;">${order.id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Order Date:</td>
                  <td style="padding: 8px;">${orderDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Status Change Time:</td>
                  <td style="padding: 8px;">${statusChangeTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Previous Status:</td>
                  <td style="padding: 8px; color: #dc3545;">${previousStatus}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">New Status:</td>
                  <td style="padding: 8px; color: #28a745; font-weight: bold;">${newStatus}</td>
                </tr>
              </table>
            </div>

            ${notesHtml}

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #007bff; margin-top: 0;">CUSTOMER INFORMATION</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; font-weight: bold; width: 150px;">Name:</td>
                  <td style="padding: 8px;">${order.customer?.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Email:</td>
                  <td style="padding: 8px;"><a href="mailto:${order.customer?.email}" style="color: #007bff;">${order.customer?.email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Phone:</td>
                  <td style="padding: 8px;">${order.customer?.phone || 'Not provided'}</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #007bff; margin-top: 0;">SHIPPING ADDRESS</h2>
              <div style="padding: 8px; line-height: 1.6;">
                ${order.shippingAddress.street}<br>
                ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}<br>
                ${order.shippingAddress.country}
              </div>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #007bff; margin-top: 0;">PAYMENT INFORMATION</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; font-weight: bold; width: 150px;">Total USD:</td>
                  <td style="padding: 8px; font-weight: bold; color: #28a745;">$${order.totalUSD.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Total LTC:</td>
                  <td style="padding: 8px; font-weight: bold; color: #28a745;">${order.totalLtc} LTC</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Payment Method:</td>
                  <td style="padding: 8px;">${order.paymentMethod || 'Litecoin'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Transaction ID:</td>
                  <td style="padding: 8px; font-family: monospace; font-size: 12px;">${order.txId || 'Not available'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Confirmations:</td>
                  <td style="padding: 8px;">${order.confirmations || 0}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Sender Address:</td>
                  <td style="padding: 8px; font-family: monospace; font-size: 12px;">${order.senderAddress || 'Not available'}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #007bff; margin-top: 0;">PRODUCTS ORDERED</h2>
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

            <div style="background-color: #e7f3ff; padding: 20px; border-radius: 6px; border-left: 4px solid #007bff;">
              <h3 style="color: #007bff; margin-top: 0;">ORDER SUMMARY</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Total Items:</strong> ${order.items.reduce((sum, item) => sum + item.quantity, 0)}</li>
                <li><strong>Unique Products:</strong> ${order.items.length}</li>
                <li><strong>Order Value:</strong> $${order.totalUSD.toFixed(2)} (${order.totalLtc} LTC)</li>
              </ul>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px;">
              This is an automated notification from the SadFrogTech order management system.
            </div>
          </div>
        </div>
      `
    });
    console.log(`[Email] Admin notification sent for order ${order.id} status change (${previousStatus} → ${newStatus})`);
  } catch (error) {
    console.error(`[Email] Failed to send admin notification for order ${order.id}:`, error);
  }
} 