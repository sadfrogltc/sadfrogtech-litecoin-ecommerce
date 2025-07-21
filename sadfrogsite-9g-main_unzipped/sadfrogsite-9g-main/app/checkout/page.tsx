"use client"

import { CheckoutForm, OrderSummary } from "@/components/checkout/checkout-form"
import CartSummary from "@/components/checkout/cart-summary"
import { Header } from "@/components/storefront/header"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCart } from "@/hooks/use-cart"
import { useRouter } from "next/navigation"
import { useState, useMemo, useEffect } from "react"

export default function CheckoutPage() {
  console.log("[Checkout Page] Rendering.")
  const { items, cartTotal } = useCart()
  const [country, setCountry] = useState("");
  const [shippingMethod, setShippingMethod] = useState("USPS");
  const [ltcPrice, setLtcPrice] = useState<number | null>(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [countryRates, setCountryRates] = useState<any>({});
  const [grandTotal, setGrandTotal] = useState(cartTotal);

  // Import getCountryRates and getZone from checkout-form
  // (Assume they are exported for this purpose)
  // import { getCountryRates, getZone } from "@/components/checkout/checkout-form"

  useEffect(() => {
    fetch("/api/ltc-price")
      .then(res => res.json())
      .then(data => setLtcPrice(data?.rate || null));
  }, []);

  useEffect(() => {
    // You would need to import getCountryRates from the checkout-form or move it to a shared util
    // For now, assume getCountryRates is available
    if (country) {
      const rates = getCountryRates(country);
      setCountryRates(rates);
      setShippingCost(rates[shippingMethod]?.price || 0);
    } else {
      setCountryRates({});
      setShippingCost(0);
    }
  }, [country, shippingMethod]);

  useEffect(() => {
    setGrandTotal(cartTotal + shippingCost);
  }, [cartTotal, shippingCost]);

  const grandTotalLtc = useMemo(() => ltcPrice ? (grandTotal / ltcPrice).toFixed(6) : "...", [grandTotal, ltcPrice]);
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          <div className="lg:pr-8 order-2 lg:order-1">
            <button
              type="button"
              className="mb-4 flex items-center gap-2 text-sm text-primary hover:underline"
              onClick={() => router.back()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 sm:mb-6">Guest Checkout</h1>
            <CheckoutForm
              country={country}
              setCountry={setCountry}
              shippingMethod={shippingMethod}
              setShippingMethod={setShippingMethod}
            />
          </div>
          <div className="bg-muted/50 rounded-lg order-1 lg:order-2 lg:h-[calc(100vh-12rem)] lg:sticky lg:top-24">
            <ScrollArea className="h-full max-h-[500px] lg:max-h-none">
              <OrderSummary
                items={items}
                cartTotal={cartTotal}
                shippingCost={shippingCost}
                grandTotal={grandTotal}
                ltcPrice={ltcPrice}
                grandTotalLtc={grandTotalLtc}
                country={country}
                countryRates={countryRates}
                shippingMethod={shippingMethod}
              />
            </ScrollArea>
          </div>
        </div>
      </main>
    </div>
  )
}
