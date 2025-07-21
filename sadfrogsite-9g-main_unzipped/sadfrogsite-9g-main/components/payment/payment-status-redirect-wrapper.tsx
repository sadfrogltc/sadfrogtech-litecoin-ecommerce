"use client"
import OrderStatusRedirect from "@/components/payment/order-status-redirect"
import LitecoinPayment from "@/components/payment/litecoin-payment"

export default function PaymentStatusRedirectWrapper({ order, token }: { order: any, token: string }) {
  return (
    <>
      <OrderStatusRedirect orderId={order.id} token={token} />
      <LitecoinPayment order={{ id: order.id, amount: order.totalUSD, currency: "USD" }} />
    </>
  )
} 