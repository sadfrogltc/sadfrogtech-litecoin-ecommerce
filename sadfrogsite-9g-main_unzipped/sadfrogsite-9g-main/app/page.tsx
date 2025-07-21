import { ProductGrid } from "@/components/storefront/product-grid"
import { ProductFilters } from "@/components/storefront/product-filters"
import { Header } from "@/components/storefront/header"
import { HeroSection } from "@/components/storefront/hero-section"
import { FeaturedProducts } from "@/components/storefront/featured-products"
import { NewsletterSignup } from "@/components/storefront/newsletter-signup"
import { Testimonials } from "@/components/storefront/testimonials"
import { BackToTop } from "@/components/storefront/back-to-top"
import { getProducts, getCategories } from "@/lib/data"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { Suspense } from "react"
import { ProductFiltersSkeleton } from "@/components/storefront/product-filters-skeleton"
import { ProductGridSkeleton } from "@/components/storefront/product-grid-skeleton"
import type { Product } from "@/types"

// This new wrapper component will fetch the products based on the filters.
// This allows the data fetching to be part of the Suspense boundary.
async function ProductGridWrapper({
  query,
  category,
  sort,
}: {
  query?: string
  category?: string
  sort?: string
}) {
  // Assuming getProducts can handle these filters.
  const products: Product[] = await getProducts({ query, category, sort })
  return <ProductGrid products={products} />
}

function isPromise<T>(value: any): value is Promise<T> {
  return value && typeof value.then === "function";
}

export default async function StorefrontPage({
  searchParams,
}: {
  searchParams?: {
    q?: string
    category?: string
    sort?: string
  }
}) {
  // Await searchParams if it's a promise (Next.js 15+ dynamic API)
  const params = isPromise(searchParams) ? await searchParams : searchParams || {};
  const { q, category, sort } = params as { q?: string; category?: string; sort?: string };

  // Categories can be fetched outside of Suspense as they are not dependent on search params.
  const categories = await getCategories()

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Featured Products */}
            <Suspense fallback={<ProductGridSkeleton />}>
        <FeaturedProducts products={await getProducts()} />
            </Suspense>

      {/* Testimonials */}
      <Testimonials />

      {/* Newsletter Signup */}
      <NewsletterSignup />

      {/* Back to Top Button */}
      <BackToTop />
      
      <footer className="py-6 mt-12 border-t">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} SadFrogTech. All Rights Reserved.</p>
          <p className="text-sm mt-2">Powered by Litecoin and Vercel.</p>
        </div>
      </footer>
    </div>
  )
}
