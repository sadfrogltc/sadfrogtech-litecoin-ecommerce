import { Loader2, CheckCircle2, AlertCircle, Clock, XCircle, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import copy from "copy-to-clipboard"
import { useState } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { useEffect } from "react"

export type PaymentStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "expired"
  | "confirming"
  | "error"
  | "detected"

interface PaymentStatusDisplayProps {
  status: PaymentStatus
  confirmations?: number
  txId?: string | null
  matchType?: string | null
}

export function PaymentStatusDisplay({ status, confirmations = 0, txId, matchType }: PaymentStatusDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [txDetails, setTxDetails] = useState<any>(null)
  const [txLoading, setTxLoading] = useState(false)
  const [txError, setTxError] = useState<string | null>(null)

  useEffect(() => {
    if (!showModal || !txId) return
    setTxLoading(true)
    setTxError(null)
    setTxDetails(null)
    // Fetch transaction details from Litecoin explorer
    fetch(`https://blockchair.com/litecoin/raw/transaction/${txId}`)
      .then(res => res.json())
      .then(data => {
        if (data.data && data.data[txId]) {
          setTxDetails(data.data[txId])
          console.log('[Litecoin] Full transaction data:', data.data[txId])
        } else {
          setTxError('Transaction not found or explorer error.')
          console.error('[Litecoin] Explorer error:', data)
        }
      })
      .catch(err => {
        setTxError('Failed to fetch transaction details.')
        console.error('[Litecoin] Fetch error:', err)
      })
      .finally(() => setTxLoading(false))
  }, [showModal, txId])

  const statusInfo = {
    pending: {
      icon: <Clock className="h-8 w-8 text-muted-foreground" />,
      text: "Awaiting payment...",
      description: "Use your wallet to complete the transaction.",
    },
    detected: {
      icon: <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />,
      text: "Payment Detected!",
      description: `Your payment was detected in the Litecoin network. Waiting for confirmation... (${confirmations}/1)`,
    },
    confirming: {
      icon: <Loader2 className="h-8 w-8 animate-spin text-blue-500" />,
      text: "Payment detected, confirming...",
      description: `Your transaction is being confirmed on the Litecoin network. (${confirmations}/1)`,
    },
    paid: {
      icon: <CheckCircle2 className="h-8 w-8 text-green-500" />,
      text: "Payment Confirmed!",
      description: "Your order is paid. A confirmation email has been sent.",
    },
    expired: {
      icon: <XCircle className="h-8 w-8 text-destructive" />,
      text: "Order Expired",
      description: "The payment window has closed. Please create a new order.",
    },
    error: {
      icon: <AlertCircle className="h-8 w-8 text-destructive" />,
      text: "Error",
      description: "An error occurred. Please contact support.",
    },
    processing: {
      icon: <Loader2 className="h-8 w-8 animate-spin text-purple-500" />,
      text: "Processing Order",
      description: "Your order is being prepared for shipment.",
    },
    shipped: {
      icon: <CheckCircle2 className="h-8 w-8 text-green-500" />,
      text: "Order Shipped",
      description: "Your order is on its way!",
    },
    delivered: {
      icon: <CheckCircle2 className="h-8 w-8 text-green-500" />,
      text: "Order Delivered",
      description: "Your order has been delivered. Enjoy!",
    },
    cancelled: {
      icon: <XCircle className="h-8 w-8 text-destructive" />,
      text: "Order Cancelled",
      description: "This order has been cancelled.",
    },
  }

  const currentStatus = statusInfo[status] || statusInfo.pending

  return (
    <div className="text-center py-6 px-4 bg-muted/50 rounded-md flex flex-col items-center gap-2">
      {currentStatus.icon}
      <p className="font-semibold text-lg">{currentStatus.text}</p>
      <p className="text-sm text-muted-foreground">{currentStatus.description}</p>
      {txId && (
        <div className="mt-2 w-full">
          <p className="text-xs text-muted-foreground">Transaction ID:</p>
          <div className="font-mono text-xs p-2 bg-background rounded-md break-all flex items-center justify-between gap-2">
            <span>{txId}</span>
            <Button asChild variant="ghost" size="icon" className="h-6 w-6 ml-2">
              <Link href={`https://blockchair.com/litecoin/transaction/${txId}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 ml-2"
              onClick={() => {
                try {
                  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(txId)
                      .then(() => {
                        setCopied(true);
                        toast.success("TXID copied to clipboard!");
                        setTimeout(() => setCopied(false), 1500);
                      })
                      .catch(() => {
                        toast.error("Clipboard access is not available in your browser.");
                      });
                  } else if (copy(txId)) {
                    setCopied(true);
                    toast.success("TXID copied to clipboard!");
                    setTimeout(() => setCopied(false), 1500);
                  } else {
                    throw new Error("Clipboard not available");
                  }
                } catch (e) {
                  toast.error("Clipboard access is not available in your browser.");
                }
              }}
              title={copied ? "Copied!" : "Copy TXID"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 12h8m-7 8h6a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-6 w-6 ml-2"
              onClick={() => setShowModal(true)}
              title="View Transaction Details"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0A9 9 0 11 3 12a9 9 0 0118 0z" /></svg>
            </Button>
          </div>
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Transaction Details</DialogTitle>
                <DialogDescription>Full details for TXID: <span className="font-mono">{txId}</span></DialogDescription>
              </DialogHeader>
              {txLoading && <div className="text-center py-4">Loading...</div>}
              {txError && <div className="text-destructive text-sm py-2">{txError}</div>}
              {txDetails && (
                <pre className="text-xs bg-muted p-2 rounded max-h-64 overflow-auto text-left">
                  {JSON.stringify(txDetails, null, 2)}
                </pre>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
      {matchType === "fallback" && (
        <div className="mt-4 p-2 bg-yellow-100 text-yellow-800 rounded text-sm">
          <b>Heads up:</b> We detected your payment, but it was not sent from the address you entered. This can happen if your wallet uses a change address or multiple inputs. If you have concerns, please contact support.
        </div>
      )}
    </div>
  )
}
