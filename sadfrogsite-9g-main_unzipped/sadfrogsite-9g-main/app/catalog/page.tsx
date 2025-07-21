import { ProductGrid } from "@/components/storefront/product-grid"
import { ProductFilters } from "@/components/storefront/product-filters"
import { Suspense } from "react"
import { getProducts, getCategories } from "@/lib/data"
import { ProductFiltersSkeleton } from "@/components/storefront/product-filters-skeleton"
import { ProductGridSkeleton } from "@/components/storefront/product-grid-skeleton"
import type { Product } from "@/types"
import ClientHeader from "@/components/storefront/client-header"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

async function ProductGridWrapper({ query, category, sort }: { query?: string; category?: string; sort?: string }) {
  const products: Product[] = await getProducts({ query, category, sort })
  return <ProductGrid products={products} />
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: {
    q?: string
    category?: string
    sort?: string
  }
}) {
  // Await searchParams if it's a promise (Next.js 14+ dynamic API)
  const params = typeof searchParams?.then === "function" ? await searchParams : searchParams || {};
  const { q, category, sort } = params as { q?: string; category?: string; sort?: string };
  const categories = await getCategories();

  return (
    <div className="bg-background text-foreground min-h-screen">
      <ClientHeader />
      <main className="container mx-auto px-4 py-8 sm:py-16" id="catalog-products">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Catalog</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Product Catalog</h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">Browse our complete collection of tech gadgets and apparel.</p>
        </div>
        
        {/* Mobile Filter Button */}
        <div className="md:hidden mb-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <Filter className="mr-2 h-4 w-4" />
                Filters & Categories
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Filters & Categories</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <Suspense fallback={<ProductFiltersSkeleton />}>
                  <ProductFilters categories={categories} />
                </Suspense>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        <div className="grid md:grid-cols-[240px_1fr] gap-6 lg:gap-8 items-start">
          {/* Desktop Filters */}
          <aside className="hidden md:block sticky top-24">
            <Suspense fallback={<ProductFiltersSkeleton />}>
              <ProductFilters categories={categories} />
            </Suspense>
          </aside>
          
          {/* Products Section */}
          <section>
            <Suspense fallback={<ProductGridSkeleton />}>
              <ProductGridWrapper query={q} category={category} sort={sort} />
            </Suspense>
          </section>
        </div>
      </main>
    </div>
  )
} 