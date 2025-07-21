"use client"

import { useState, useTransition, useEffect } from "react"
import type { Order } from "@/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Edit, XCircle, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { OrderDetailsDialog } from "./order-details-dialog"
import { OrderEditDialog } from "./order-edit-dialog"
import { cancelOrderAction, permanentlyDeleteOrderAction } from "@/app/admin/orders/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { ConfirmationDialog } from "./confirmation-dialog"
import OrderDateCell from "./OrderDateCell";

interface OrdersTableProps {
  orders: Order[]
}

export function OrdersTable({ orders: initialOrders }: OrdersTableProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [confirmingAction, setConfirmingAction] = useState<{ type: "cancel" | "delete"; order: Order } | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [loadingOrder, setLoadingOrder] = useState(false)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders")
        if (res.ok) {
          const data = await res.json()
          // Convert date strings to Date objects
          const ordersWithDates = data.orders.map((order: any) => ({
            ...order,
            createdAt: new Date(order.createdAt),
            expiresAt: new Date(order.expiresAt),
          }))
          setOrders(ordersWithDates)
        }
      } catch (err) {
        // Optionally handle error
      }
    }
    fetchOrders()
    const interval = setInterval(fetchOrders, 10000) // 10 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
      case "delivered":
        return "default"
      case "pending":
      case "confirming":
        return "secondary"
      case "processing":
      case "shipped":
        return "outline"
      case "expired":
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "delivered":
        return "text-green-600"
      case "pending":
      case "confirming":
        return "text-yellow-600"
      case "processing":
      case "shipped":
        return "text-blue-600"
      case "expired":
      case "cancelled":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const handleActionConfirm = () => {
    if (!confirmingAction) return

    const { type, order } = confirmingAction

    startTransition(async () => {
      try {
        let result
        if (type === "cancel") {
          result = await cancelOrderAction(order.id)
        } else {
          result = await permanentlyDeleteOrderAction(order.id)
        }

        if (result && result.success) {
          toast.success(result.message)
          router.refresh()
        } else {
          toast.error(result?.error || "An unexpected error occurred.")
        }
      } catch (err) {
        console.error("Failed to perform order action:", err)
        toast.error("A client-side error occurred. Please try again.")
      } finally {
        setConfirmingAction(null)
      }
    })
  }

  const handleViewDetails = async (orderId: string) => {
    setLoadingOrder(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      const order = await res.json()
      setSelectedOrder(order)
    } finally {
      setLoadingOrder(false)
    }
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No orders found</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[80px]">Order ID</TableHead>
              <TableHead className="min-w-[120px]">Customer</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[100px] hidden sm:table-cell">Total (USD)</TableHead>
              <TableHead className="min-w-[120px] hidden md:table-cell">Total (LTC)</TableHead>
              <TableHead className="min-w-[100px] hidden lg:table-cell">Date</TableHead>
              <TableHead className="text-right min-w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">#{order.id}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-sm">{order.customer.name}</div>
                    <div className="text-xs text-muted-foreground hidden sm:block">{order.customer.email}</div>
                    <div className="text-xs text-muted-foreground sm:hidden">{order.customer.email.split('@')[0]}...</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.status)} className={getStatusColor(order.status)}>
                    <span className="hidden sm:inline">{order.status}</span>
                    <span className="sm:hidden">{order.status.slice(0, 3)}</span>
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">${order.totalUSD.toFixed(2)}</TableCell>
                <TableCell className="font-mono text-sm hidden md:table-cell">{order.totalLtc !== undefined ? order.totalLtc.toFixed(4) : "-"} LTC</TableCell>
                <TableCell className="hidden lg:table-cell"><OrderDateCell date={order.createdAt} /></TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleViewDetails(order.id)}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingOrder(order)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit / Manage
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setConfirmingAction({ type: "cancel", order })}
                        disabled={order.status === "cancelled"}
                      >
                        <XCircle className="mr-2 h-4 w-4" /> Cancel Order
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        onClick={() => setConfirmingAction({ type: "delete", order })}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {loadingOrder && <div className="p-4 text-center">Loading order details...</div>}
      {selectedOrder && !loadingOrder && (
        <OrderDetailsDialog
          order={selectedOrder}
          open={!!selectedOrder}
          onOpenChange={(open) => !open && setSelectedOrder(null)}
        />
      )}

      {editingOrder && (
        <OrderEditDialog
          order={editingOrder}
          open={!!editingOrder}
          onOpenChange={(open) => !open && setEditingOrder(null)}
        />
      )}

      <ConfirmationDialog
        open={!!confirmingAction}
        onOpenChange={() => setConfirmingAction(null)}
        onConfirm={handleActionConfirm}
        title={confirmingAction?.type === "cancel" ? "Cancel Order?" : "Permanently Delete Order?"}
        description={
          confirmingAction?.type === "cancel"
            ? `This will mark order #${confirmingAction.order.id} as 'cancelled'. This is a soft delete and the order will be kept for records. Are you sure?`
            : `This will permanently delete order #${confirmingAction?.order.id} and all its data. This action is irreversible.`
        }
        confirmText={confirmingAction?.type === "cancel" ? "Yes, Cancel" : "Yes, Delete Permanently"}
        isConfirming={isPending}
      />
    </>
  )
}
