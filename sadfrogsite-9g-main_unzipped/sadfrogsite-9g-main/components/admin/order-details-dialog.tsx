"use client"

import type { Order } from "@/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, User, MapPin, CreditCard, Clock } from "lucide-react"
import Image from "next/image"

interface OrderDetailsDialogProps {
  order: Order
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrderDetailsDialog({ order, open, onOpenChange }: OrderDetailsDialogProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "delivered":
        return "text-green-600 bg-green-50"
      case "pending":
      case "confirming":
        return "text-yellow-600 bg-yellow-50"
      case "processing":
      case "shipped":
        return "text-blue-600 bg-blue-50"
      case "expired":
      case "cancelled":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order #{order.id}
          </DialogTitle>
          <DialogDescription>
            Created on {new Date(order.createdAt).toLocaleDateString()} at{" "}
            {new Date(order.createdAt).toLocaleTimeString()}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={getStatusColor(order.status)} variant="secondary">
                {order.status.toUpperCase()}
              </Badge>
              {order.txId && (
                <>
                  <div className="text-sm font-medium">Transaction ID:</div>
                  <div className="text-xs font-mono bg-muted p-2 rounded mt-1 break-all">{order.txId}</div>
                  <a
                    href={`https://litecoinspace.org/tx/${order.txId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs mt-1 block"
                  >
                    View on LitecoinSpace
                  </a>
                </>
              )}
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="font-medium">{order.customer.name}</div>
                <div className="text-sm text-muted-foreground">{order.customer.email}</div>
                {order.customer.phone && <div className="text-sm text-muted-foreground">{order.customer.phone}</div>}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <div>{order.shippingAddress.street}</div>
                <div>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                </div>
                <div>{order.shippingAddress.country}</div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Total (USD):</span>
                <span className="font-medium">${order.totalUSD.toFixed(2)}</span>
              </div>
              {typeof order.totalLtc === "number" && (
                <div className="flex justify-between">
                  <span>Total (LTC):</span>
                  <span className="font-mono text-sm">{order.totalLtc.toFixed(8)} LTC</span>
                </div>
              )}
              {order.paymentMethod && (
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="capitalize">{order.paymentMethod}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
            <CardDescription>{order.items.length} item(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Image
                    src={item.imageUrl || "/placeholder.svg"}
                    alt={item.title}
                    width={60}
                    height={60}
                    className="rounded-md object-cover"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
                    <div className="text-sm text-muted-foreground">Quantity: {item.quantity}</div>
                    {item.customerInstructionsAnswer && (
                      <div className="text-xs mt-2">
                        <span className="font-medium">Customer Instructions:</span>
                        <div className="mt-1 whitespace-pre-wrap bg-muted p-2 rounded text-muted-foreground">
                          {item.customerInstructionsAnswer}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${item.price.toFixed(2)} each</div>
                    <div className="text-sm text-muted-foreground">
                      Total: ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
