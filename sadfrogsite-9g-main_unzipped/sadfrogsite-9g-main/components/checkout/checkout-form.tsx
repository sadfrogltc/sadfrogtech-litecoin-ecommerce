"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import { checkoutSchema } from "@/lib/schemas"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createOrderAction } from "@/app/checkout/actions"
import { useTransition } from "react"
import { toast } from "sonner"
import { useCart } from "@/hooks/use-cart"
import { Loader2 } from "lucide-react"
import { countries } from "@/lib/countries"
import { useState, useMemo, useEffect } from "react"

// Advanced shipping zones for 50 countries
const shippingZones: Record<string, string> = {
  "United States": "North America",
  "Canada": "North America",
  "Mexico": "North America",
  "United Kingdom": "Europe",
  "Germany": "Europe",
  "France": "Europe",
  "Italy": "Europe",
  "Spain": "Europe",
  "Netherlands": "Europe",
  "Sweden": "Europe",
  "Poland": "Europe",
  "Belgium": "Europe",
  "Austria": "Europe",
  "Switzerland": "Europe",
  "Denmark": "Europe",
  "Australia": "Asia-Pacific",
  "Japan": "Asia-Pacific",
  "China": "Asia-Pacific",
  "India": "Asia-Pacific",
  "South Korea": "Asia-Pacific",
  "Singapore": "Asia-Pacific",
  "Hong Kong": "Asia-Pacific",
  "New Zealand": "Asia-Pacific",
  "Malaysia": "Asia-Pacific",
  "Thailand": "Asia-Pacific",
  "Brazil": "South America",
  "Argentina": "South America",
  "Chile": "South America",
  "Colombia": "South America",
  "Peru": "South America",
  "South Africa": "Africa",
  "Nigeria": "Africa",
  "Kenya": "Africa",
  "Egypt": "Africa",
  "Morocco": "Africa",
  "Saudi Arabia": "Middle East",
  "United Arab Emirates": "Middle East",
  "Israel": "Middle East",
  "Qatar": "Middle East",
  "Turkey": "Middle East",
  "Russia": "Eastern Europe & Central Asia",
  "Ukraine": "Eastern Europe & Central Asia",
  "Kazakhstan": "Eastern Europe & Central Asia",
  "Philippines": "Asia-Pacific",
  "Indonesia": "Asia-Pacific",
  "Vietnam": "Asia-Pacific",
  "Norway": "Europe",
  "Finland": "Europe",
  "Ireland": "Europe",
  "Portugal": "Europe",
};

// Advanced zone rates, defaulting to 'Standard' tier
const zoneRates: Record<string, Record<string, { price: number; eta: string; service: string; tracking: boolean }>> = {
  "North America": {
    USPS: { price: 0, eta: "2–4 business days", service: "Priority Mail", tracking: true },
    FedEx: { price: 8, eta: "1–3 business days", service: "Ground", tracking: true },
    UPS: { price: 10, eta: "1–4 business days", service: "Ground", tracking: true },
    DHL: { price: 12, eta: "2–3 business days", service: "Express", tracking: true },
  },
  "Europe": {
    USPS: { price: 30, eta: "5–9 business days", service: "International Priority", tracking: true },
    FedEx: { price: 40, eta: "3–7 business days", service: "International Economy", tracking: true },
    UPS: { price: 45, eta: "2–6 business days", service: "Worldwide Express", tracking: true },
    DHL: { price: 35, eta: "2–5 business days", service: "Express Worldwide", tracking: true },
  },
  "Asia-Pacific": {
    USPS: { price: 35, eta: "6–11 business days", service: "International Priority", tracking: true },
    FedEx: { price: 45, eta: "4–9 business days", service: "International Economy", tracking: true },
    UPS: { price: 50, eta: "3–7 business days", service: "Worldwide Express", tracking: true },
    DHL: { price: 40, eta: "2–6 business days", service: "Express Worldwide", tracking: true },
  },
  "South America": {
    USPS: { price: 40, eta: "7–13 business days", service: "International Priority", tracking: true },
    FedEx: { price: 50, eta: "5–11 business days", service: "International Economy", tracking: true },
    UPS: { price: 55, eta: "4–9 business days", service: "Worldwide Express", tracking: true },
    DHL: { price: 45, eta: "3–8 business days", service: "Express Worldwide", tracking: true },
  },
  "Africa": {
    USPS: { price: 45, eta: "9–18 business days", service: "International Priority", tracking: true },
    FedEx: { price: 55, eta: "6–14 business days", service: "International Economy", tracking: true },
    UPS: { price: 60, eta: "5–11 business days", service: "Worldwide Express", tracking: true },
    DHL: { price: 50, eta: "4–9 business days", service: "Express Worldwide", tracking: true },
  },
  "Middle East": {
    USPS: { price: 40, eta: "7–14 business days", service: "International Priority", tracking: true },
    FedEx: { price: 50, eta: "5–11 business days", service: "International Economy", tracking: true },
    UPS: { price: 55, eta: "4–9 business days", service: "Worldwide Express", tracking: true },
    DHL: { price: 45, eta: "3–8 business days", service: "Express Worldwide", tracking: true },
  },
  "Eastern Europe & Central Asia": {
    USPS: { price: 40, eta: "9–16 business days", service: "International Priority", tracking: true },
    FedEx: { price: 50, eta: "6–13 business days", service: "International Economy", tracking: true },
    UPS: { price: 55, eta: "5–10 business days", service: "Worldwide Express", tracking: true },
    DHL: { price: 45, eta: "4–9 business days", service: "Express Worldwide", tracking: true },
  },
  "Rest of World": {
    USPS: { price: 55, eta: "10–22 business days", service: "International Priority", tracking: true },
    FedEx: { price: 65, eta: "8–18 business days", service: "International Economy", tracking: true },
    UPS: { price: 70, eta: "7–16 business days", service: "Worldwide Express", tracking: true },
    DHL: { price: 60, eta: "6–14 business days", service: "Express Worldwide", tracking: true },
  },
};

// Country-specific overrides for special cases
const countryOverrides: Record<string, Record<string, { price: number; eta: string; service: string; tracking: boolean }>> = {
  Nigeria: {
    USPS: { price: 55, eta: "11–22 business days", service: "International Priority", tracking: false },
    FedEx: { price: 65, eta: "9–18 business days", service: "International Economy", tracking: true },
    UPS: { price: 70, eta: "7–14 business days", service: "Worldwide Express", tracking: true },
    DHL: { price: 60, eta: "6–11 business days", service: "Express Worldwide", tracking: true },
  },
  "New Zealand": {
    USPS: { price: 40, eta: "7–13 business days", service: "International Priority", tracking: true },
    FedEx: { price: 50, eta: "5–11 business days", service: "International Economy", tracking: true },
    UPS: { price: 55, eta: "4–9 business days", service: "Worldwide Express", tracking: true },
    DHL: { price: 45, eta: "3–8 business days", service: "Express Worldwide", tracking: true },
  },
};

function getZone(country: string): string {
  return shippingZones[country] || "Rest of World";
}

function getCountryRates(country: string): Record<string, { price: number; eta: string; service: string; tracking: boolean }> {
  return countryOverrides[country] || zoneRates[getZone(country)];
}

export function OrderSummary({
  items,
  cartTotal,
  shippingCost,
  grandTotal,
  ltcPrice,
  grandTotalLtc,
  country,
  countryRates,
  shippingMethod
}: {
  items: any[],
  cartTotal: number,
  shippingCost: number,
  grandTotal: number,
  ltcPrice: number | null,
  grandTotalLtc: string,
  country: string,
  countryRates: any,
  shippingMethod: string
}) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <div className="border rounded p-4 bg-muted">
      <div className="font-semibold mb-2 text-lg">Order Summary</div>
      {items.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-muted-foreground mb-1">{totalItems} item{totalItems !== 1 ? 's' : ''} in cart</div>
          <ul className="divide-y divide-border">
            {items.map(item => (
              <li key={item.id} className="py-1 flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                  <span className="truncate max-w-xs font-medium" title={item.title}>{item.title}</span>
                  <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                  <span className="text-xs text-muted-foreground">@ ${item.price.toFixed(2)} ea</span>
                </div>
                <span className="ml-2 font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex justify-between">
        <span>Cart Total:</span>
        <span>${cartTotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span>Shipping:</span>
        <span>{shippingCost === 0 && getZone(country) === "North America" && country === "United States" ? "Free" : `$${shippingCost.toFixed(2)}`}</span>
      </div>
      <div className="flex justify-between font-bold">
        <span>Grand Total:</span>
        <span>${grandTotal.toFixed(2)} {ltcPrice && <span className="text-xs text-muted-foreground">(~{grandTotalLtc} LTC)</span>}</span>
      </div>
      {country && (
        <div className="flex flex-col gap-1 text-xs mt-4">
          <div className="flex justify-between">
            <span>Shipping Method:</span>
            <span>{shippingMethod} {countryRates[shippingMethod]?.service ? `(${countryRates[shippingMethod]?.service})` : ''}</span>
          </div>
          <div className="flex justify-between">
            <span>Destination Country:</span>
            <span>{country}</span>
          </div>
          <div className="flex justify-between">
            <span>Estimated Delivery:</span>
            <span>{countryRates[shippingMethod]?.eta}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export function CheckoutForm() {
  const [isPending, startTransition] = useTransition()
  const { items, cartTotal, clearCart } = useCart()
  const [shippingMethod, setShippingMethod] = useState<"USPS" | "FedEx" | "UPS" | "DHL">("USPS")

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      email: "",
      shippingAddress: {
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "",
      },
      phone: "",
      notes: "",
    },
  })

  const country = form.watch("shippingAddress.country");
  const countryRates = country ? getCountryRates(country) : {};
  const availableCarriers = Object.keys(countryRates) as ("USPS" | "FedEx" | "UPS" | "DHL")[];
  const shippingCost = country ? (countryRates[shippingMethod]?.price || 0) : 0;
  const grandTotal = useMemo(() => cartTotal + shippingCost, [cartTotal, shippingCost]);
  const [ltcPrice, setLtcPrice] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/ltc-price")
      .then(res => res.json())
      .then(data => setLtcPrice(data?.rate || null));
  }, []);
  const grandTotalLtc = useMemo(() => ltcPrice ? (grandTotal / ltcPrice).toFixed(6) : "...", [grandTotal, ltcPrice]);

  function onSubmit(values: z.infer<typeof checkoutSchema>) {
    console.log("[CheckoutForm] Form submitted with values:", values)
    if (items.length === 0) {
      toast.error("Your cart is empty. Please add items before checking out.")
      return
    }

    startTransition(async () => {
      console.log("[CheckoutForm] Starting transition to create order.")
      
      // Create FormData object
      const formData = new FormData()
      formData.append("fullName", values.fullName)
      formData.append("email", values.email)
      formData.append("phone", values.phone ?? "")
      formData.append("shippingStreet", values.shippingAddress.street)
      formData.append("shippingCity", values.shippingAddress.city)
      formData.append("shippingState", values.shippingAddress.state)
      formData.append("shippingZip", values.shippingAddress.zip)
      formData.append("shippingCountry", values.shippingAddress.country)
      formData.append("notes", values.notes || "")
      formData.append("cartItems", JSON.stringify(items));
      formData.append("shippingMethod", String(shippingMethod !== undefined && shippingMethod !== null ? shippingMethod : 'USPS'));
      formData.append("shippingCost", String(shippingCost !== undefined && shippingCost !== null ? shippingCost : 0));

      const result = await createOrderAction(formData)

      if (result.success && result.redirectUrl) {
        console.log(`[CheckoutForm] Order created successfully. Redirecting to ${result.redirectUrl}`)
        toast.success("Order created! Redirecting to payment...")
        clearCart()
        window.location.href = result.redirectUrl
      } else {
        console.error("[CheckoutForm] Failed to create order:", result.message)
        toast.error(result.message || "Failed to create order. Please try again.")
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h2 className="text-xl font-semibold">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <h2 className="text-xl font-semibold">Shipping Address</h2>
        <FormField
          control={form.control}
          name="shippingAddress.street"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="shippingAddress.city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Anytown" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shippingAddress.state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State / Province</FormLabel>
                <FormControl>
                  <Input placeholder="CA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shippingAddress.zip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP / Postal Code</FormLabel>
                <FormControl>
                  <Input placeholder="12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="shippingAddress.country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <Select onValueChange={value => { field.onChange(value); setShippingMethod("USPS") }} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Shipping Method Selection */}
        {country && (
          <div className="space-y-2">
            <FormLabel>Shipping Method</FormLabel>
            <div className="flex flex-col gap-2">
              {availableCarriers.map((key) => {
                const method = countryRates[key];
                if (!method) return null;
                const isFree = method.price === 0 && getZone(country) === "North America" && country === "United States";
                return (
                  <label
                    key={key}
                    className={`flex flex-col md:flex-row md:items-center gap-1 md:gap-2 p-2 border rounded cursor-pointer ${
                      shippingMethod === key ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={key}
                        checked={shippingMethod === key}
                        onChange={() => setShippingMethod(key)}
                      />
                      <span className="font-medium">{key}</span>
                      <span className="text-xs text-muted-foreground">{method.service}</span>
                      {method.tracking && <span className="text-xs text-green-700 ml-2">Tracked</span>}
                    </div>
                    <div className="flex-1 flex justify-between md:justify-end gap-4">
                      <span className="text-xs text-muted-foreground">{method.eta}</span>
                      <span className="ml-auto font-semibold">{isFree ? "Free" : `$${method.price.toFixed(2)}`}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <h2 className="text-xl font-semibold">Optional Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number (Optional)</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="+1-555-555-5555" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Any special instructions for your order..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Proceed to Payment
        </Button>
      </form>
    </Form>
  )
}
