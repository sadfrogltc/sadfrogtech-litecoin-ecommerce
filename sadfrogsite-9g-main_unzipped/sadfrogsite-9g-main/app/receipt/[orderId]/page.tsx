import { getOrderById } from "@/lib/data"
import { notFound } from "next/navigation"
import ReceiptActions from "@/components/receipt-actions"

export default async function ReceiptPage({ params, searchParams }: any) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const orderId = resolvedParams.orderId;
  const token = resolvedSearchParams.token;

  if (!token) notFound();

  try {
    const order = await getOrderById(orderId);
    if (!order || order.secureToken !== token) notFound();
    if (order.status !== 'paid') {
      return (
        <div className="max-w-xl mx-auto mt-12 p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          <h2 className="text-2xl font-bold mb-2">Receipt Unavailable</h2>
          <p>Your payment has not been confirmed yet. Please wait for confirmation and try again.</p>
        </div>
      );
    }
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 bg-white border border-gray-200 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Payment Receipt</h2>
        <div className="mb-2"><strong>Order ID:</strong> {order.id}</div>
        <div className="mb-2"><strong>Payment Address:</strong> <span className="font-mono text-xs break-all">{order.senderAddress || 'N/A'}</span></div>
        <div className="mb-2"><strong>Amount Paid:</strong> {order.totalLtc} LTC</div>
        <div className="mb-2"><strong>Transaction ID:</strong> <span className="font-mono text-xs break-all">{order.txId || 'N/A'}</span></div>
        <div className="mb-2"><strong>Status:</strong> <span className="text-green-700 font-semibold">Paid</span></div>
        <div className="mt-4 text-gray-600 text-sm">Thank you for your payment! Please save this receipt for your records.</div>
        <ReceiptActions
          orderId={order.id}
          senderAddress={order.senderAddress || 'N/A'}
          totalLtc={order.totalLtc}
          txId={order.txId || 'N/A'}
        />
      </div>
    );
  } catch (error) {
    notFound();
  }
} 