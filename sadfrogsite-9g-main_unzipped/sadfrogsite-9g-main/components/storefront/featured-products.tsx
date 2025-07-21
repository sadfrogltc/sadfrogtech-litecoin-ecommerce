"use client"

import { useState, useEffect } from "react"
import { Product } from "@/types"
import { ProductCard } from "./product-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Star, TrendingUp } from "lucide-react"
import Link from "next/link"
import { scrollToSection } from "@/lib/scroll-utils"

interface FeaturedProductsProps {
  products: Product[]
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Only show products where featured === true
  const featuredProducts = products.filter(p => p.featured === true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.ceil(featuredProducts.length / 3))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? Math.ceil(featuredProducts.length / 3) - 1 : prev - 1
    )
  }

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-8 bg-muted rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (featuredProducts.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-muted/30" id="products">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Featured
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              Popular
            </Badge>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Featured Products
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our most popular tech gadgets and apparel. 
            Handpicked for quality and innovation.
          </p>
        </div>

        {/* Products Grid */}
        <div className="relative">
          {/* Navigation Buttons */}
          {featuredProducts.length > 3 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-background shadow-lg"
                onClick={prevSlide}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-background shadow-lg"
                onClick={nextSlide}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Products */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link href="/catalog" passHref>
            <Button size="lg" variant="outline">
              View All Products
            </Button>
          </Link>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary">
                {products.length}+
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Products Available</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary">
                100%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Litecoin Payments</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary">
                24/7
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Order Processing</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
} 