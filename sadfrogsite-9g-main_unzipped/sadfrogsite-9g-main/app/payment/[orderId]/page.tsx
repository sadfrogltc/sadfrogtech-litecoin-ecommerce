import { getOrderById } from "@/lib/data"
import { notFound } from "next/navigation"
import BackButton from "@/components/ui/back-button"
import PaymentStatusRedirectWrapper from "@/components/payment/payment-status-redirect-wrapper"
import CheckoutTimer from "@/components/payment/checkout-timer"
import SessionRecovery from "@/components/payment/session-recovery"

export default async function PaymentPage({ params, searchParams }: any) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const orderId = resolvedParams.orderId;
  const token = resolvedSearchParams.token;

  if (!token) {
    notFound()
  }

  try {
    const order = await getOrderById(orderId)
    if (!order || order.secureToken !== token) {
      notFound()
    }

    // Check if order has expired
    const isExpired = order.status === "expired" || new Date() > order.expiresAt
    
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <BackButton />
            {isExpired ? (
              <SessionRecovery orderId={order.id} originalItems={order.items} />
            ) : (
              <>
                <CheckoutTimer expiresAt={order.expiresAt} orderId={order.id} />
            <PaymentStatusRedirectWrapper order={order} token={token} />
              </>
            )}
          </div>
        </main>
      </div>
    )
  } catch (error) {
    console.error("[Payment Page] Error loading order:", error)
    notFound()
  }
}
