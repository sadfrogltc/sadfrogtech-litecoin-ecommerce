"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { Product, CartItem } from "@/types"

interface CartContextType {
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateItemQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  cartTotal: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    console.log("[Cart] Attempting to load cart from localStorage.")
    const storedCart = localStorage.getItem("sadfrog-cart")
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart)
        setItems(parsedCart)
        console.log("[Cart] Loaded cart from localStorage:", parsedCart)
      } catch (e) {
        console.error("[Cart] Failed to parse cart from localStorage", e)
        localStorage.removeItem("sadfrog-cart")
      }
    } else {
      console.log("[Cart] No cart found in localStorage.")
    }
  }, [])

  useEffect(() => {
    if (items.length > 0) {
      console.log("[Cart] Saving cart to localStorage:", items)
      localStorage.setItem("sadfrog-cart", JSON.stringify(items))
    } else {
      console.log("[Cart] Cart is empty, removing from localStorage.")
      localStorage.removeItem("sadfrog-cart")
    }
  }, [items])

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id)
      const maxQty = typeof product.stockLimit === 'number' ? product.stockLimit : 10
      if (existingItem) {
        const newQty = Math.min(maxQty, existingItem.quantity + quantity)
        const newItems = prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: newQty } : item,
        )
        console.log(`[Cart] Increased quantity for ${product.title}.`, newItems)
        return newItems
      }
      const initialQty = Math.min(maxQty, quantity)
      const newItems = [...prevItems, { ...product, quantity: initialQty }]
      console.log(`[Cart] Added new item ${product.title}.`, newItems)
      return newItems
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prevItems) => {
      const newItems = prevItems.filter((item) => item.id !== productId)
      console.log(`[Cart] Removed item ${productId}.`, newItems)
      return newItems
    })
  }, [])

  const updateItemQuantity = useCallback(
    (productId: string, quantity: number) => {
      setItems((prevItems) => {
        const product = prevItems.find((item) => item.id === productId)
        if (!product) return prevItems
        const maxQty = typeof product.stockLimit === 'number' ? product.stockLimit : 10
        if (quantity < 1) {
          return prevItems.filter((item) => item.id !== productId)
        }
        const newQty = Math.min(maxQty, quantity)
        const newItems = prevItems.map((item) =>
          item.id === productId ? { ...item, quantity: newQty } : item,
        )
        console.log(`[Cart] Updated quantity for ${productId} to ${newQty}.`, newItems)
        return newItems
      })
    },
    [],
  )

  const clearCart = useCallback(() => {
    console.log("[Cart] Clearing cart.")
    setItems([])
  }, [])

  const cartTotal = items.reduce((total, item) => total + item.price * item.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateItemQuantity, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
