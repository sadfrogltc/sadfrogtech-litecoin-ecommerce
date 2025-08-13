"use client"

import LitecoinPayment from "@/components/payment/litecoin-payment"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const mockOrder = {
  id: "test-order-123",
  amount: 50.00, // $50 USD
  currency: "USD"
}

export default function TestLtcPaymentPage() {
  const handlePaymentComplete = (txid?: string) => {
    console.log("Payment completed!", { txid })
    alert("Payment completed successfully!")
  }

  const rpcHost = process.env.LTC_RPC_HOST || 'Not set';
  const rpcWallet = process.env.LTC_RPC_WALLET || 'Not set';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Litecoin Payment System Test</h1>
            <p className="text-lg text-gray-600 mb-4">
              Test the complete Litecoin payment system using your own node
            </p>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline">LTC/USD Conversion</Badge>
              <Badge variant="outline">Real-time Monitoring</Badge>
              <Badge variant="outline">QR Code Payment</Badge>
              <Badge variant="outline">Custom Node</Badge>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Payment Component */}
            <div>
              <LitecoinPayment 
                order={mockOrder} 
                onPaymentComplete={handlePaymentComplete}
              />
            </div>

            {/* System Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Features</CardTitle>
                  <CardDescription>What makes this payment system unique</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Direct Litecoin node integration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Real-time USD/LTC price conversion</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Automatic payment detection (10s polling)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">QR code generation for mobile payments</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">1-block confirmation requirement</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">No third-party payment processors</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Test Instructions</CardTitle>
                  <CardDescription>How to test the payment system</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                    <div>
                      <p className="font-medium">Generate Payment Address</p>
                      <p className="text-gray-600">Click the button to create a unique LTC address for this test order</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                    <div>
                      <p className="font-medium">Send Litecoin</p>
                      <p className="text-gray-600">Use any LTC wallet to send the exact amount shown to the generated address</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</div>
                    <div>
                      <p className="font-medium">Monitor Payment</p>
                      <p className="text-gray-600">The system will automatically detect your payment and show progress</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">4</div>
                    <div>
                      <p className="font-medium">Confirmation</p>
                      <p className="text-gray-600">Wait for 1 block confirmation (usually 2-3 minutes) for completion</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Technical Details</CardTitle>
                  <CardDescription>Behind the scenes information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium">Node Configuration:</p>
                    <p className="text-gray-600 font-mono text-xs">Host: {rpcHost}:9333</p>
                    <p className="text-gray-600 font-mono text-xs">Wallet: {rpcWallet}</p>
                  </div>
                  <div>
                    <p className="font-medium">Price Source:</p>
                    <p className="text-gray-600">LiveCoinWatch API (cached for 5 minutes)</p>
                  </div>
                  <div>
                    <p className="font-medium">Payment Monitoring:</p>
                    <p className="text-gray-600">RPC calls to your Litecoin node every 10 seconds</p>
                  </div>
                  <div>
                    <p className="font-medium">Confirmation:</p>
                    <p className="text-gray-600">Requires 1 block confirmation for security</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 