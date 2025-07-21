"use client"

import React from "react"

export default function ReceiptActions({
  orderId,
  senderAddress,
  totalLtc,
  txId,
}: {
  orderId: string
  senderAddress: string
  totalLtc: number
  txId: string
}) {
  return (
    <div className="mt-6 flex gap-4">
      <a href="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Return to Homepage</a>
      <button
        className="inline-block px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
        onClick={() => {
          const text = `Order ID: ${orderId}\nPayment Address: ${senderAddress}\nAmount Paid: ${totalLtc} LTC\nTransaction ID: ${txId}\nStatus: Paid`;
          const blob = new Blob([text], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `receipt-${orderId}.txt`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }}
      >
        Save as .txt
      </button>
    </div>
  )
} 