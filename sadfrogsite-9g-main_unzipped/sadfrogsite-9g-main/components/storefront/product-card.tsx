"use client"

import { useState } from "react"
import { Product } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useLtcPrice } from "@/hooks/use-ltc-price"
import { useCart } from "@/hooks/use-cart"
import { ShoppingCart, Eye } from "lucide-react"
import { ProductDetailModal } from "./product-detail-modal"

export function ProductCard({ product }: { product: Product }) {
  const { addItem, items } = useCart()
  const { ltcPrice, isLoading } = useLtcPrice()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleAddToCart = () => {
    addItem(product)
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const priceInLtc = ltcPrice ? (product.price / ltcPrice).toFixed(4) : "..."

  const cartItem = items.find((item) => item.id === product.id)
  const currentQty = cartItem ? cartItem.quantity : 0
  const availableStock = typeof product.stockLimit === 'number' ? product.stockLimit - currentQty : undefined
  const isOutOfStock = product.stockStatus !== 'in-stock' || (typeof product.stockLimit === 'number' && availableStock <= 0)
  const isLowStock = typeof availableStock === 'number' && availableStock > 0 && availableStock <= 5

  return (
    <>
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={handleOpenModal}>
        <CardHeader className="flex-1 p-4 sm:p-6">
          <CardTitle className="line-clamp-2 text-sm sm:text-base">{product.title}</CardTitle>
          <div className="text-xs text-muted-foreground mb-1">SKU: {product.sku}</div>
          <div className="text-xs text-muted-foreground mb-1">Category: {product.category}</div>
          <div className={`text-xs mb-2 ${product.stockStatus === "in-stock" ? "text-green-600" : "text-red-600"}`}>
            {isOutOfStock ? "Out of Stock" : product.stockStatus === "in-stock" ? "In Stock" : "Out of Stock"}
            {typeof product.stockLimit === 'number' && !isOutOfStock && (
              <span className="ml-2 text-xs text-yellow-600">{isLowStock ? `Only ${availableStock} left` : `(Limit: ${product.stockLimit})`}</span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">{product.description}</p>
        </CardHeader>
        <CardContent className="flex-1 p-4 sm:p-6 pt-0">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg sm:text-2xl font-bold">${product.price.toFixed(2)}</div>
            <p className="text-xs sm:text-sm font-mono text-muted-foreground">{isLoading ? "Loading..." : `~${priceInLtc} LTC`}</p>
          </div>
          {product.imageUrl && (
            <div className="aspect-square overflow-hidden rounded-lg mb-4 relative group">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenModal()
                  }}
                  variant="secondary"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs"
                >
                  <Eye className="h-3 w-3 mr-1 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">View Details</span>
                  <span className="sm:hidden">View</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 sm:p-6 pt-0">
          <div className="flex gap-2 w-full">
            <Button 
              onClick={(e) => {
                e.stopPropagation()
                handleAddToCart()
              }} 
              className="flex-1" 
              size="sm"
              disabled={isOutOfStock} 
              title={isOutOfStock ? 'Out of Stock' : undefined}
            >
              <ShoppingCart className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
              <span className="sm:hidden">{isOutOfStock ? 'Out' : 'Add'}</span>
            </Button>
            <Button 
              onClick={(e) => {
                e.stopPropagation()
                handleOpenModal()
              }} 
              variant="outline" 
              size="sm"
              title="View Details"
            >
              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Product Detail Modal */}
      <ProductDetailModal 
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
