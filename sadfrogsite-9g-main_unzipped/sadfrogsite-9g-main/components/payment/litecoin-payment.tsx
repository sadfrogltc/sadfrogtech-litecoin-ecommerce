"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, RefreshCw, CheckCircle, Clock, AlertCircle, DollarSign } from "lucide-react"
import { toast } from "sonner"
import { QRCodeCanvas } from "qrcode.react"

interface LitecoinPaymentProps {
  order: {
    id: string
    amount: number
    currency: string
  }
  onPaymentComplete?: (txid?: string) => void
}

interface PaymentStatus {
  address: string
  expectedAmount: number
  received: number
  confirmed: boolean
  polling: boolean
  confirmations?: number
  txids?: string[]
}

export default function LitecoinPayment({ order, onPaymentComplete }: LitecoinPaymentProps) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ltcPrice, setLtcPrice] = useState<number | null>(null)
  const [priceLoading, setPriceLoading] = useState(true)

  // Calculate LTC amount based on USD price
  const ltcAmount = (typeof order.amount === 'number' && order.amount > 0 && ltcPrice)
    ? order.amount / ltcPrice
    : null;

  // Fetch LTC price
  const fetchLtcPrice = useCallback(async () => {
    setPriceLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/ltc-price")
      if (!response.ok) throw new Error("Failed to fetch LTC price")
      const data = await response.json()
      setLtcPrice(data.rate)
      console.log(`[LTC Payment] Current LTC price: $${data.rate}`)
    } catch (err: any) {
      setLtcPrice(null)
      setError("Failed to fetch current LTC price. Please check your connection and try again.")
      toast.error("Failed to fetch current LTC price.")
    } finally {
      setPriceLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLtcPrice()
  }, [fetchLtcPrice])

  useEffect(() => {
    console.log('[LitecoinPayment] order.amount:', order.amount, 'ltcPrice:', ltcPrice);
  }, [order.amount, ltcPrice]);

  // Generate new payment address
  const generateAddress = useCallback(async () => {
    if (!ltcAmount) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ltc-payments/create-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: `order-${order.id}` }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate payment address")
      }

      const { address } = await response.json()

      setPaymentStatus({
        address,
        expectedAmount: ltcAmount,
        received: 0,
        confirmed: false,
        polling: true,
      })

      toast.success("Payment address generated successfully")
    } catch (err: any) {
      setError(err.message || "Failed to generate payment address")
      toast.error("Failed to generate payment address")
    } finally {
      setLoading(false)
    }
  }, [order.id, ltcAmount])

  // Check payment status
  const checkPayment = useCallback(async (address: string) => {
    console.debug('[LitecoinPayment] checkPayment called for address:', address)
    try {
      const response = await fetch(`/api/ltc-payments/check-payment?address=${address}&minconf=0`)
      console.debug('[LitecoinPayment] checkPayment response status:', response.status)
      if (!response.ok) {
        throw new Error("Failed to check payment status")
      }
      const { received, confirmations, txids } = await response.json()
      console.debug('[LitecoinPayment] checkPayment received value:', received, 'confirmations:', confirmations, 'txids:', txids)
      setPaymentStatus(prev => {
        if (!prev) return prev
        const newStatus = {
          ...prev,
          received,
          confirmations,
          txids,
          confirmed: received >= prev.expectedAmount && confirmations >= 1,
        }
        console.debug('[LitecoinPayment] Payment status update:', newStatus)
        // If payment is confirmed, stop polling and notify
        if (newStatus.confirmed && !prev.confirmed) {
          console.debug('[LitecoinPayment] Payment confirmed!')
          toast.success("Payment received and confirmed!")
          onPaymentComplete?.()
        }
        return newStatus
      })
    } catch (err) {
      console.error("[LitecoinPayment] Failed to check payment:", err)
    }
  }, [onPaymentComplete])

  // Poll for payment status
  useEffect(() => {
    if (!paymentStatus?.polling || !paymentStatus.address) return
    console.debug('[LitecoinPayment] Starting polling for address:', paymentStatus.address)
    const interval = setInterval(() => {
      console.debug('[LitecoinPayment] Polling check for address:', paymentStatus.address)
      checkPayment(paymentStatus.address)
    }, 10000) // Check every 10 seconds
    return () => {
      console.debug('[LitecoinPayment] Stopping polling for address:', paymentStatus.address)
      clearInterval(interval)
    }
  }, [paymentStatus?.polling, paymentStatus?.address, checkPayment])

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!paymentStatus?.address) return

    try {
      await navigator.clipboard.writeText(paymentStatus.address)
      toast.success("Address copied to clipboard")
    } catch (err) {
      toast.error("Failed to copy address")
    }
  }

  // Get payment status display
  const getPaymentStatusDisplay = () => {
    if (!paymentStatus) return null

    const { received, expectedAmount, confirmed } = paymentStatus
    const progress = Math.min((received / expectedAmount) * 100, 100)

    if (confirmed) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          <span>Payment Confirmed</span>
        </div>
      )
    }

    if (received > 0) {
      return (
        <div className="flex items-center gap-2 text-yellow-600">
          <Clock className="h-5 w-5" />
          <span>Payment Detected ({received.toFixed(8)} LTC)</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 text-gray-600">
        <Clock className="h-5 w-5" />
        <span>Waiting for Payment</span>
      </div>
    )
  }

  if (priceLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Litecoin Payment</CardTitle>
          <CardDescription>Loading current LTC price...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !ltcPrice) {
    // LTC price fetch error
    return (
      <Card>
        <CardHeader>
          <CardTitle>Litecoin Payment</CardTitle>
          <CardDescription>
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchLtcPrice} disabled={priceLoading} className="w-full">
            <RefreshCw className={`h-4 w-4 mr-2 ${priceLoading ? 'animate-spin' : ''}`} />
            Retry Fetch Price
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!ltcAmount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Litecoin Payment</CardTitle>
          <CardDescription>
            Unable to calculate LTC amount. Please ensure you have items in your cart and try refreshing the page.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Pay with Litecoin</span>
          <Badge variant="secondary">LTC</Badge>
        </CardTitle>
        <CardDescription>
          Send exactly {ltcAmount.toFixed(8)} LTC to complete your payment
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Price Information */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Current Rate</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-blue-900">${ltcPrice?.toFixed(2)} USD/LTC</p>
              <p className="text-xs text-blue-700">1 LTC = ${ltcPrice?.toFixed(2)} USD</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchLtcPrice}
            disabled={priceLoading}
            className="mt-2 h-6 text-xs"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${priceLoading ? 'animate-spin' : ''}`} />
            Refresh Price
          </Button>
        </div>

        {!paymentStatus ? (
          <div className="space-y-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Order Total</p>
              <p className="text-2xl font-bold text-gray-900">${order.amount.toFixed(2)} USD</p>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Pay with Litecoin</p>
                <p className="text-xl font-semibold text-blue-600">{ltcAmount.toFixed(8)} LTC</p>
              </div>
            </div>
            
            <Button 
              onClick={generateAddress} 
              disabled={loading || !ltcPrice || !!error}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating Address...
                </>
              ) : (
                "Generate Payment Address"
              )}
            </Button>
            {error && (
              <Button onClick={generateAddress} disabled={loading} className="w-full mt-2" variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Retry Generate Address
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Payment Status */}
            {getPaymentStatusDisplay()}
            {/* Address and Confirmation Details */}
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <div>
                <strong>Payment Address:</strong>
                <div className="font-mono text-xs break-all">{paymentStatus.address}</div>
              </div>
              <div>
                <strong>Received:</strong> {paymentStatus.received.toFixed(8)} LTC
              </div>
              {paymentStatus.txids && paymentStatus.txids.length > 0 && (
                <div>
                  <strong>Transaction ID(s):</strong>
                  <ul className="font-mono text-xs break-all">
                    {paymentStatus.txids.map(txid => (
                      <li key={txid}>{txid}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <strong>Status:</strong> {paymentStatus.confirmed ? "Confirmed" : "Pending"}
              </div>
            </div>
            {/* Receipt Section */}
            {paymentStatus.confirmed && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-bold mb-2">Receipt</h3>
                <div><strong>Address:</strong> {paymentStatus.address}</div>
                <div><strong>Amount:</strong> {paymentStatus.received.toFixed(8)} LTC</div>
                {paymentStatus.txids && paymentStatus.txids.length > 0 && (
                  <div>
                    <strong>Transaction ID(s):</strong>
                    <ul className="font-mono text-xs break-all">
                      {paymentStatus.txids.map(txid => (
                        <li key={txid}>{txid}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-2 text-green-700 font-semibold">Payment Confirmed! You may save this receipt for your records.</div>
              </div>
            )}
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg border">
                <QRCodeCanvas
                  value={`litecoin:${paymentStatus.address}?amount=${paymentStatus.expectedAmount}`}
                  size={200}
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Payment Address:</label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <code className="text-xs break-all flex-1">{paymentStatus.address}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyAddress}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Payment Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Received: {paymentStatus.received.toFixed(8)} LTC</span>
                <span>Required: {paymentStatus.expectedAmount.toFixed(8)} LTC</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((paymentStatus.received / paymentStatus.expectedAmount) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Send exactly {paymentStatus.expectedAmount.toFixed(8)} LTC to the address above</p>
              <p>• Payment will be confirmed automatically</p>
              <p>• Please wait for 1 confirmation (usually 2-3 minutes)</p>
            </div>

            {/* Regenerate Button */}
            <Button
              variant="outline"
              onClick={generateAddress}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating New Address...
                </>
              ) : (
                "Generate New Address"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 