"use client"

import Link from "next/link"
import { ShoppingCart, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import CartSheet from "./cart-sheet"
import { useCart } from "@/hooks/use-cart"
import Image from "next/image"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { usePathname } from "next/navigation"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useState } from "react"
import { Settings } from "lucide-react"

export function Header() {
  const { items } = useCart()
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const pathname = usePathname();
  const [open, setOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Image src="/sadfrog-logo.png" alt="SadFrogTech Logo" width={32} height={32} />
          <span className="hidden sm:inline">SadFrogTech</span>
          <span className="sm:hidden">SFT</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {/* SadFrog Ordinals Button and Modal */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="font-semibold">SadFrog Ordinals</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-gradient-to-br from-green-50 via-white to-blue-50 p-0 overflow-hidden">
              <div className="flex flex-col items-center p-6">
                <Image src="/sadfrog-logo.png" alt="SadFrog Ordinals" width={64} height={64} className="rounded-full mb-2 shadow-md" />
                <DialogHeader className="w-full items-center">
                  <DialogTitle className="text-2xl text-center mb-1">SadFrog Ordinals</DialogTitle>
                  <DialogDescription className="text-center mb-4">
                    SadFrog Ordinals collections are coming soon.
                  </DialogDescription>
                </DialogHeader>
                <div className="w-full border-t border-gray-200 my-2" />
                <div className="flex flex-col gap-4 w-full mt-2">
                  <div aria-disabled="true" className="flex items-center gap-4 bg-white border border-blue-200 rounded-lg px-4 py-3 shadow-sm opacity-50 cursor-not-allowed">
                    <Image src="/sadfrog-logo.png" alt="Sad Frog" width={40} height={40} className="rounded-full border" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-blue-700 text-lg">Sad Frog</span>
                      <span className="text-xs text-muted-foreground">Coming soon</span>
                    </div>
                  </div>
                  <div aria-disabled="true" className="flex items-center gap-4 bg-white border border-green-200 rounded-lg px-4 py-3 shadow-sm opacity-50 cursor-not-allowed">
                    <Image src="https://ord.chikun.market/content/34e038e8f37e5ade2fde16bf9f09fda2a59a270d8c984cbd27e6354b6d9ee80bi0" alt="SadFrogPFP - Wave II" width={40} height={40} className="rounded-full border" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-green-700 text-lg">SadFrogPFP - Wave II</span>
                      <span className="text-xs text-muted-foreground">Coming soon</span>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Admin Panel Button */}
          {/* <Link href="/admin/login" passHref>
            <Button variant="outline" size="sm" className="font-semibold flex items-center gap-2" aria-label="Admin Panel">
              <Settings className="h-4 w-4" />
              <span>Admin Panel</span>
            </Button>
          </Link> */}
          
          {/* Show 'Catalog' on home, 'Home' on catalog */}
          {pathname === "/" ? (
            <Link href="/catalog" passHref legacyBehavior>
              <Button variant="outline" size="sm" className="font-semibold">
                Catalog
              </Button>
            </Link>
          ) : pathname === "/catalog" ? (
            <Link href="/" passHref legacyBehavior>
              <Button variant="outline" size="sm" className="font-semibold">
                Home
              </Button>
            </Link>
          ) : null}
        </div>

        {/* Mobile Menu Button and Cart */}
        <div className="flex items-center gap-2">
          {/* Cart */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-6 w-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                )}
                <span className="sr-only">Cart</span>
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

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Image src="/sadfrog-logo.png" alt="SadFrogTech" width={24} height={24} />
                  Menu
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                {/* Navigation Links */}
                {pathname === "/" ? (
                  <Link href="/catalog" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start">
                      Catalog
                    </Button>
                  </Link>
                ) : pathname === "/catalog" ? (
                  <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start">
                      Home
                    </Button>
                  </Link>
                ) : null}
                
                {/* SadFrog Ordinals */}
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      SadFrog Ordinals
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md bg-gradient-to-br from-green-50 via-white to-blue-50 p-0 overflow-hidden">
                    <div className="flex flex-col items-center p-6">
                      <Image src="/sadfrog-logo.png" alt="SadFrog Ordinals" width={64} height={64} className="rounded-full mb-2 shadow-md" />
                      <DialogHeader className="w-full items-center">
                        <DialogTitle className="text-2xl text-center mb-1">SadFrog Ordinals</DialogTitle>
                        <DialogDescription className="text-center mb-4">
                          SadFrog Ordinals collections are coming soon.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="w-full border-t border-gray-200 my-2" />
                      <div className="flex flex-col gap-4 w-full mt-2">
                        <div aria-disabled="true" className="flex items-center gap-4 bg-white border border-blue-200 rounded-lg px-4 py-3 shadow-sm opacity-50 cursor-not-allowed">
                          <Image src="/sadfrog-logo.png" alt="Sad Frog" width={40} height={40} className="rounded-full border" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-blue-700 text-lg">Sad Frog</span>
                            <span className="text-xs text-muted-foreground">Coming soon</span>
                          </div>
                        </div>
                        <div aria-disabled="true" className="flex items-center gap-4 bg-white border border-green-200 rounded-lg px-4 py-3 shadow-sm opacity-50 cursor-not-allowed">
                          <Image src="https://ord.chikun.market/content/34e038e8f37e5ade2fde16bf9f09fda2a59a270d8c984cbd27e6354b6d9ee80bi0" alt="SadFrogPFP - Wave II" width={40} height={40} className="rounded-full border" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-green-700 text-lg">SadFrogPFP - Wave II</span>
                            <span className="text-xs text-muted-foreground">Coming soon</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {/* Admin Panel */}
                {/* <Link href="/admin/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Panel
                  </Button>
                </Link> */}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
