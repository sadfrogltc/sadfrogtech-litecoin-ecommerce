import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductForm } from "../../product-form"
import { getProductById } from "@/lib/data"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import { notFound } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface EditProductPageProps {
  params: { id: string }
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const resolvedParams = typeof params.then === "function" ? await params : params;
  console.log(`[Edit Product Page] === LOADING EDIT PAGE ===`)
  console.log(`[Edit Product Page] Product ID from params: ${resolvedParams.id}`)

  let product = null
  let error = null

  try {
    product = await getProductById(resolvedParams.id)
    console.log(`[Edit Product Page] Product lookup result:`, product)
  } catch (err) {
    console.error(`[Edit Product Page] Error loading product:`, err)
    error = err instanceof Error ? err.message : "Unknown error"
  }

  if (!product) {
    console.error(`[Edit Product Page] Product not found with ID: ${resolvedParams.id}`)
    if (error) {
      console.error(`[Edit Product Page] Error details: ${error}`)
    }
    notFound()
  }

  console.log(`[Edit Product Page] Successfully loaded product: ${product.title}`)

  return (
    <>
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>There was an issue loading the product, but we found it: {error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
          <CardDescription>
            Update the details for &quot;{product.title}&quot;
            <br />
            <span className="text-xs text-muted-foreground">Product ID: {product.id}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm product={product} />
        </CardContent>
      </Card>
    </>
  )
}
