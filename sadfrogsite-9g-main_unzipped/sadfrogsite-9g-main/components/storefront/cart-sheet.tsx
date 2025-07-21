"use client"

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useLtcPrice } from "@/hooks/use-ltc-price";
import { useCart } from "@/hooks/use-cart";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { scrollToProducts } from "@/lib/scroll-utils";

export default function CartSheet({ subtotal }: { subtotal: number }) {
  const { items, updateItemQuantity, removeItem, clearCart } = useCart();
  const { ltcPrice, isLoading } = useLtcPrice();
  const subtotalInLtc = ltcPrice ? (subtotal / ltcPrice).toFixed(4) : "...";
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold mb-2">Your cart is empty</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-6">
          Looks like you haven't added any items to your cart yet.
        </p>
        <Button 
          asChild
          className="w-full"
          size="lg"
        >
          <Link href="/catalog">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto mobile-scroll">
        <div className="space-y-3 sm:space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3 p-3 bg-muted/30 rounded-lg border">
              {/* Product Image */}
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover rounded-md"
                />
                {item.stockStatus === "out-of-stock" && (
                  <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center">
                    <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                  </div>
                )}
              </div>
              
              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-xs sm:text-sm line-clamp-2 mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground mb-2">SKU: {item.sku}</p>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs sm:text-sm">${item.price.toFixed(2)}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0 mobile-touch-target"
                      onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="px-2 text-xs sm:text-sm font-medium min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0 mobile-touch-target"
                      onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= (item.stockLimit || 10)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    Total: ${(item.price * item.quantity).toFixed(2)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive mobile-touch-target"
                    onClick={() => removeItem(item.id)}
                    title="Remove item"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Summary */}
      <div className="border-t pt-4 mt-4">
        <div className="space-y-3">
          {/* Summary Details */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium text-green-600">Free</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm sm:text-base font-semibold">
              <span>Total (USD)</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Total (LTC approx.)</span>
              <span className="font-mono">
                {isLoading ? "Calculating..." : `~${subtotalInLtc} LTC`}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Link href="/checkout" className="block">
              <Button className="w-full" size="lg">
                <span className="hidden sm:inline">Proceed to Checkout</span>
                <span className="sm:hidden">Checkout</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCart}
              className="w-full"
            >
              Clear Cart
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>🔒 Secure Litecoin payments</p>
          </div>
        </div>
      </div>
    </div>
  );
}
