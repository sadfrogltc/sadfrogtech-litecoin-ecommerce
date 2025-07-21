import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllOrders, getProducts } from "@/lib/data"
import { DollarSign, Package, ShoppingCart, TrendingUp, ArrowLeft, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { SessionMonitor } from "@/components/admin/session-monitor"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MassEmailSection } from '@/components/admin/mass-email-section';

export default async function AdminDashboard() {
  console.log("[Admin Dashboard] Loading dashboard data")

  try {
    const [orders, products] = await Promise.all([getAllOrders(), getProducts()])

    const totalRevenue = orders
      .filter((order) => ["paid", "shipped", "delivered"].includes(order.status))
      .reduce((sum, order) => sum + order.totalUSD, 0)

    const pendingOrders = orders.filter((order) => ["pending", "confirming"].includes(order.status)).length

    const paidOrders = orders.filter((order) => ["paid", "shipped", "delivered"].includes(order.status)).length

    const outOfStockProducts = products.filter((product) => product.stockStatus === "out-of-stock").length

    console.log(`[Admin Dashboard] Loaded ${orders.length} orders and ${products.length} products`)

    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Overview of your store's performance</p>
          </div>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/catalog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Store
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard
            title="Total Revenue"
            value={`$${totalRevenue.toFixed(2)}`}
            description={`From ${paidOrders} paid orders`}
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          />
          <StatsCard
            title="Total Orders"
            value={orders.length.toString()}
            description={`${pendingOrders} pending`}
            icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
          />
          <StatsCard
            title="Products"
            value={products.length.toString()}
            description={`${outOfStockProducts} out of stock`}
            icon={<Package className="h-4 w-4 text-muted-foreground" />}
          />
          <StatsCard
            title="Conversion Rate"
            value={orders.length > 0 ? `${((paidOrders / orders.length) * 100).toFixed(1)}%` : "0%"}
            description="Orders to payments"
            icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <RecentOrdersCard orders={orders.slice(0, 5)} />
          <SessionMonitor />
        </div>

        {/* Mass Email Section */}
        <MassEmailSection />
      </div>
    )
  } catch (error) {
    console.error("[Admin Dashboard] Error loading data:", error)

    // Check if this is a database connection error
    const isDbError =
      error instanceof Error &&
      (error.message.includes("Failed to fetch") ||
        error.message.includes("database") ||
        error.message.includes("connection"))

    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-sm sm:text-base text-red-600">Error loading dashboard data</p>
          </div>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/catalog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Store
            </Link>
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Dashboard Error</AlertTitle>
          <AlertDescription>
            {isDbError ? (
              <>
                There was a problem connecting to the database. This might be temporary.
                <br />
                <Button asChild variant="outline" size="sm" className="mt-2 bg-transparent">
                  <Link href="/admin">Refresh Dashboard</Link>
                </Button>
              </>
            ) : (
              <>
                An unexpected error occurred while loading the dashboard.
                <br />
                <span className="text-xs font-mono mt-1 block">
                  {error instanceof Error ? error.message : "Unknown error"}
                </span>
              </>
            )}
          </AlertDescription>
        </Alert>

        {/* Show empty stats cards as fallback */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard
            title="Total Revenue"
            value="$0.00"
            description="Unable to load"
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          />
          <StatsCard
            title="Total Orders"
            value="0"
            description="Unable to load"
            icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
          />
          <StatsCard
            title="Products"
            value="0"
            description="Unable to load"
            icon={<Package className="h-4 w-4 text-muted-foreground" />}
          />
          <StatsCard
            title="Conversion Rate"
            value="0%"
            description="Unable to load"
            icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
      </div>
    )
  }
}

function StatsCard({
  title,
  value,
  description,
  icon,
}: {
  title: string
  value: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-lg sm:text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function RecentOrdersCard({ orders }: { orders: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Recent Orders</CardTitle>
        <CardDescription className="text-sm">Latest customer orders</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium truncate">#{order.id}</p>
                  <p className="text-xs text-muted-foreground truncate">{order.customer.name}</p>
                </div>
                <div className="text-right ml-2">
                  <p className="text-xs sm:text-sm font-medium">${order.totalUSD.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{order.status}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
