"use client"

import { useEffect, useState } from "react";
import LitecoinPayment from "@/components/payment/litecoin-payment"

export default function CartSummary({ cartTotal }: { cartTotal: number }) {
  // Removed all total displays as requested
  return (
    <div className="flex flex-col gap-2">
      <div className="mt-4">
        {/* Removed LitecoinPayment from cart summary. Payment UI now only appears on the payment screen. */}
      </div>
    </div>
  );
}
