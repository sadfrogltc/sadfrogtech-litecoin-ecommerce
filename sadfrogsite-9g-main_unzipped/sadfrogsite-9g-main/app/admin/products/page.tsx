import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getProducts } from "@/lib/data"
import { ProductsTable } from "@/components/admin/products-table"
import { Plus, ArrowLeft } from "lucide-react"

export default async function AdminProductsPage() {
  console.log("[Admin Products] Loading products")

  try {
    const products = await getProducts()
    console.log(`[Admin Products] Loaded ${products.length} products`)

    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Products</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your store's product catalog</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/admin/products/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Product Catalog</CardTitle>
            <CardDescription className="text-sm">{products.length} products in your store</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
              <ProductsTable products={products} />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    console.error("[Admin Products] Error loading products:", error)
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Products</h2>
            <p className="text-sm sm:text-base text-red-600">Error loading products. Please try again.</p>
          </div>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    )
  }
}
