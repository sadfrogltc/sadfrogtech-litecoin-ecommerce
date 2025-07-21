import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllOrders } from "@/lib/data"
import { OrdersTable } from "@/components/admin/orders-table"
import { Package, DollarSign, Clock, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Code } from "lucide-react"
import { toast } from "sonner"
import ClearOrdersButton from "@/components/admin/clear-orders-button"
import CleanupExpiredOrdersButton from "@/components/admin/cleanup-expired-orders-button"

export default async function AdminOrdersPage() {
  console.log("[Admin Orders] Loading orders")

  const orders = await getAllOrders()
  console.log(`[Admin Orders] Loaded ${orders.length} orders`)

  // Calculate stats
  const totalRevenue = orders
    .filter((order) => ["paid", "shipped", "delivered"].includes(order.status))
    .reduce((sum, order) => sum + order.totalUSD, 0)

  const pendingOrders = orders.filter((order) => ["pending", "confirming"].includes(order.status)).length
  const paidOrders = orders.filter((order) => ["paid", "shipped", "delivered"].includes(order.status)).length
  const processingOrders = orders.filter((order) => order.status === "processing").length
  const expiredOrders = orders.filter((order) => order.status === "expired").length

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Order Management</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Manage and track customer orders</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex gap-2">
            <CleanupExpiredOrdersButton />
            <ClearOrdersButton />
          </div>
        </div>
      </div>

      {orders.length === 0 && (
        <Alert>
          <Package className="h-4 w-4" />
          <AlertTitle>No Orders Found</AlertTitle>
          <AlertDescription>
            No orders have been placed yet. Orders will appear here once customers start making purchases.
          </AlertDescription>
        </Alert>
      )}

      {/* Order Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{pendingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Processing</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{processingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Expired</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{expiredOrders}</div>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Debug Section */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Code className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Developer Debug: View Raw Order Data</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-2 sm:p-4 bg-gray-900 text-white rounded-md max-h-96 overflow-auto text-xs sm:text-sm">
              <pre>
                <code>{JSON.stringify(orders, null, 2)}</code>
              </pre>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">All Orders</CardTitle>
          <CardDescription className="text-sm">
            {orders.length > 0 ? "Click on any order to view details and manage status" : "No orders to display"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <OrdersTable orders={orders} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
