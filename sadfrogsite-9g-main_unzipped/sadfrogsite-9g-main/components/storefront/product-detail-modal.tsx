"use client"

import { useMemo, useState } from "react"
import { Product } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useLtcPrice } from "@/hooks/use-ltc-price"
import { useCart } from "@/hooks/use-cart"
import { ShoppingCart, X, Star, Package, Tag, Info } from "lucide-react"
import { toast } from "sonner"

interface ProductDetailModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

export function ProductDetailModal({ product, isOpen, onClose }: ProductDetailModalProps) {
  const { addItem, items } = useCart()
  const { ltcPrice, isLoading } = useLtcPrice()
  const [quantity, setQuantity] = useState(1)
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null)

  if (!product) return null

  const handleAddToCart = () => {
    // Add the specified quantity to cart
    const selectedVariant = selectedVariantIndex != null && product.variants ? product.variants[selectedVariantIndex] : undefined
    const productForCart = selectedVariant
      ? { ...product, title: `${product.title} (${selectedVariant.name})` } // reflect variant in title
      : product
    for (let i = 0; i < quantity; i++) {
      addItem(productForCart)
    }
    toast.success(`${quantity} ${quantity === 1 ? 'item' : 'items'} added to cart`)
    onClose()
    setQuantity(1) // Reset quantity
  }

  const priceInLtc = ltcPrice ? (product.price / ltcPrice).toFixed(6) : "..."
  const totalPriceInLtc = ltcPrice ? ((product.price * quantity) / ltcPrice).toFixed(6) : "..."

  const cartItem = items.find((item) => item.id === product.id)
  const currentQty = cartItem ? cartItem.quantity : 0
  const variantStockLimit = (selectedVariantIndex != null && product.variants && product.variants[selectedVariantIndex]?.stockLimit) || undefined
  const baseStockLimit = product.stockLimit
  const effectiveStockLimit = typeof variantStockLimit === 'number' ? variantStockLimit : baseStockLimit
  const availableStock = typeof effectiveStockLimit === 'number' ? effectiveStockLimit - currentQty : undefined
  const variantStockStatus = (selectedVariantIndex != null && product.variants && product.variants[selectedVariantIndex]?.stockStatus) || undefined
  const isOutOfStock = (variantStockStatus ? variantStockStatus !== 'in-stock' : product.stockStatus !== 'in-stock') || (typeof effectiveStockLimit === 'number' && availableStock <= 0)
  const isLowStock = typeof availableStock === 'number' && availableStock > 0 && availableStock <= 5
  const maxQuantity = typeof availableStock === 'number' ? availableStock : 99

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const galleryImages = useMemo(() => {
    if (selectedVariantIndex != null && product.variants && product.variants[selectedVariantIndex]) {
      const v = product.variants[selectedVariantIndex]
      return [product.imageUrl, ...(v.imageUrls || [])].filter(Boolean)
    }
    return [product.imageUrl, ...(product.imageUrls || [])].filter(Boolean)
  }, [product, selectedVariantIndex])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl font-bold">{product.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Images */}
          <div className="space-y-4">
            {(galleryImages && galleryImages.length > 1) ? (
              <div className="relative">
                <Carousel className="w-full">
                  <CarouselContent>
                    {galleryImages.map((url, idx) => (
                      <CarouselItem key={idx}>
                        <div className="aspect-square overflow-hidden rounded-lg border">
                          <img
                            src={url as string}
                            alt={`${product.title} ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="-left-4" />
                  <CarouselNext className="-right-4" />
                </Carousel>
              </div>
            ) : (
              product.imageUrl && (
                <div className="aspect-square overflow-hidden rounded-lg border">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )
            )}

            {/* Variant selectors */}
            {product.variants && product.variants.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, idx) => (
                  <button
                    key={v.id}
                    aria-label={`Select ${v.name}`}
                    className={`px-3 py-1 rounded-full border text-sm ${selectedVariantIndex === idx ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                    onClick={() => setSelectedVariantIndex(idx)}
                  >
                    {v.name || `Option ${idx + 1}`}
                  </button>
                ))}
                <button
                  className={`px-3 py-1 rounded-full border text-sm ${selectedVariantIndex === null ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                  onClick={() => setSelectedVariantIndex(null)}
                >
                  Default
                </button>
              </div>
            )}

            {/* Product Tags */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {product.category}
              </Badge>
              <Badge variant={product.stockStatus === "in-stock" ? "default" : "destructive"} className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {isOutOfStock ? "Out of Stock" : "In Stock"}
              </Badge>
              {isLowStock && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  Low Stock
                </Badge>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Price Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Price per item:</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      {isLoading ? "Loading..." : `~${priceInLtc} LTC`}
                    </div>
                  </div>
                </div>
                
                {!isOutOfStock && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Quantity:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                      >
                        -
                      </Button>
                      <span className="w-12 text-center font-medium">{quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(quantity + 1)}
                        disabled={quantity >= maxQuantity}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                )}

                {!isOutOfStock && quantity > 1 && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-medium">Total:</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">${(product.price * quantity).toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        {isLoading ? "Loading..." : `~${totalPriceInLtc} LTC`}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Product Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">SKU:</span>
                    <p className="text-muted-foreground">{product.sku}</p>
                  </div>
                  <div>
                    <span className="font-medium">Category:</span>
                    <p className="text-muted-foreground">{product.category}</p>
                  </div>
                  <div>
                    <span className="font-medium">Stock Status:</span>
                    <p className={product.stockStatus === "in-stock" ? "text-green-600" : "text-red-600"}>
                      {isOutOfStock ? "Out of Stock" : "In Stock"}
                    </p>
                  </div>
                  {typeof product.stockLimit === 'number' && (
                    <div>
                      <span className="font-medium">Stock Limit:</span>
                      <p className="text-muted-foreground">{product.stockLimit}</p>
                    </div>
                  )}
                </div>

                {typeof availableStock === 'number' && !isOutOfStock && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Available:</strong> {availableStock} items remaining
                      {isLowStock && " - Order soon!"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add to Cart */}
            <Card>
              <CardContent className="pt-6">
                <Button 
                  onClick={handleAddToCart} 
                  className="w-full" 
                  size="lg" 
                  disabled={isOutOfStock}
                  title={isOutOfStock ? 'Out of Stock' : undefined}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {isOutOfStock 
                    ? 'Out of Stock' 
                    : quantity > 1 
                      ? `Add ${quantity} to Cart` 
                      : 'Add to Cart'
                  }
                </Button>
                
                {currentQty > 0 && (
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    You have {currentQty} {currentQty === 1 ? 'item' : 'items'} in your cart
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 