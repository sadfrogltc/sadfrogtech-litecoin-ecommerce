"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Zap, Shield, Truck } from "lucide-react"
import Link from "next/link"
import { scrollToSection } from "@/lib/scroll-utils"
import { useCart } from "@/hooks/use-cart"
import { useState } from "react"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import CartSheet from "./cart-sheet"
import Image from "next/image"

export function HeroSection() {
  const { items } = useCart()
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Hero Content */}
          <div className="space-y-6 lg:space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="w-fit">
                <Zap className="h-3 w-3 mr-1" />
                Accepting Litecoin Payments
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                3D Printed Tech, Gadgets & <span className="text-primary">Accessories</span> — Uniquely Crafted for You
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
                Discover one-of-a-kind 3D printed gadgets, innovative tech, and stylish accessories—crafted with precision and passion. Shop exclusive designs, pay securely with Litecoin, and enjoy fast, private shipping worldwide.
              </p>
            </div>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/catalog" passHref legacyBehavior>
                <Button 
                  size="lg" 
                  className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto"
                >
                  <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Shop Now
                </Button>
              </Link>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 relative w-full sm:w-auto">
                    <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    View Cart
                    {itemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                        {itemCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="max-w-md w-full">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Your Cart ({itemCount} items)
                    </SheetTitle>
                  </SheetHeader>
                  <CartSheet subtotal={subtotal} />
                </SheetContent>
              </Sheet>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 lg:pt-8">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Secure Payments</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Litecoin blockchain</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Fast Shipping</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Worldwide delivery</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Instant Orders</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">No waiting time</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative order-first lg:order-last">
            <Card className="p-4 sm:p-6 bg-background/80 backdrop-blur-sm border-primary/20">
              <CardContent className="p-0">
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-3 sm:space-y-4">
                    <div className="flex justify-center">
                      <Image
                        src="/sadfrog-logo.png"
                        alt="SadFrogTech Logo"
                        width={120}
                        height={120}
                        className="mx-auto rounded-full shadow-lg sm:w-[150px] sm:h-[150px] lg:w-[200px] lg:h-[200px]"
                        priority
                      />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold mt-2">SadFrogTech</h3>
                    <p className="text-muted-foreground text-sm sm:text-base">Where innovation meets style</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-primary/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-20 h-20 sm:w-32 sm:h-32 bg-secondary/10 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
    </div>
  )
} 