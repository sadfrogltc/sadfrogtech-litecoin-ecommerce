"use client"

import { useState, useTransition } from "react"
import type { Order } from "@/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { updateOrderStatus, cancelOrderAction, permanentlyDeleteOrderAction } from "@/app/admin/orders/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2, Save, Trash2, XCircle } from "lucide-react"
import { ConfirmationDialog } from "./confirmation-dialog"

interface OrderEditDialogProps {
  order: Order
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusOptions = [
  { value: "pending", label: "Pending", description: "Awaiting payment" },
  { value: "confirming", label: "Confirming", description: "Payment detected, confirming" },
  { value: "paid", label: "Paid", description: "Payment confirmed" },
  { value: "processing", label: "Processing", description: "Order being prepared" },
  { value: "shipped", label: "Shipped", description: "Order shipped to customer" },
  { value: "delivered", label: "Delivered", description: "Order delivered" },
  { value: "cancelled", label: "Cancelled", description: "Order cancelled" },
  { value: "expired", label: "Expired", description: "Payment window expired" },
]

export function OrderEditDialog({ order, open, onOpenChange }: OrderEditDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState(order.status)
  const [notes, setNotes] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [confirmAction, setConfirmAction] = useState<"cancel" | "delete" | null>(null)

  const handleSave = () => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append("orderId", order.id)
      formData.append("status", selectedStatus)
      formData.append("notes", notes)

      const result = await updateOrderStatus(null, formData)
      console.log("Order update result:", result)

      if (result && result.success) {
        toast.success(result.message || "Order updated successfully")
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error((result && result.error) || "Failed to update order")
      }
    })
  }

  const handleConfirm = () => {
    if (!confirmAction) return

    startTransition(async () => {
      const actionToRun = confirmAction === "cancel" ? cancelOrderAction : permanentlyDeleteOrderAction
      const result = await actionToRun(order.id)

      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
      setConfirmAction(null)
    })
  }

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
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isPending && onOpenChange(isOpen)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Order #{order.id}</DialogTitle>
            <DialogDescription>Update status, add notes, or perform other actions.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Current Status</Label>
              <div className="mt-1">
                <Badge className={getStatusColor(order.status)} variant="secondary">
                  {order.status.toUpperCase()}
                </Badge>
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium">{order.customer.name}</div>
              <div className="text-xs text-muted-foreground">{order.customer.email}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Total: ${order.totalUSD !== undefined ? order.totalUSD.toFixed(2) : '-'}
                {typeof order.totalSol !== 'undefined' ? ` (${order.totalSol.toFixed(4)} SOL)` : ''}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this status change..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={isPending}
              />
            </div>

            <div className="pt-4 border-t space-y-4">
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                  Close
                </Button>
                <Button onClick={handleSave} disabled={isPending || selectedStatus === order.status}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
              <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg">
                <div>
                  <p className="font-medium text-destructive">Danger Zone</p>
                  <p className="text-xs text-destructive/80">These actions cannot be undone.</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmAction("cancel")}
                    disabled={isPending || order.status === "cancelled"}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmAction("delete")}
                    disabled={isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={confirmAction === "cancel" ? "Cancel this order?" : "Permanently Delete Order?"}
        description={
          confirmAction === "cancel" ? (
            `This will mark order #${order.id} as 'cancelled'. This is a soft delete and the order will be kept for records. Are you sure?`
          ) : (
            <div className="space-y-2">
              <p>
                You are about to permanently delete order <strong className="font-mono">#{order.id}</strong>.
              </p>
              <p className="font-bold text-destructive">This action is irreversible.</p>
              <p>All associated data will be removed from the database forever.</p>
            </div>
          )
        }
        confirmText={confirmAction === "cancel" ? "Yes, Cancel Order" : "Yes, Delete Permanently"}
        confirmVariant="destructive"
        isConfirming={isPending}
      />
    </>
  )
}
