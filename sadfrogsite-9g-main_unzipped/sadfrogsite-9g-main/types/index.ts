export interface Product {
  id: string
  title: string
  sku: string
  category: string
  stockStatus: "in-stock" | "out-of-stock"
  imageUrl: string
  imageUrls?: string[]
  description: string
  price: number // in USD
  stockLimit?: number // Optional: maximum available quantity
  featured?: boolean // Mark as featured for homepage
  // Customer instructions: optional admin-provided prompt shown to the buyer
  customerInstructions?: string
  requireCustomerInstructions?: boolean
  variants?: Array<{
    id: string
    name: string // e.g., color name
    imageUrls: string[]
    stockLimit?: number
    stockStatus?: "in-stock" | "out-of-stock"
  }>
}

export interface CartItem extends Product {
  quantity: number
  selectedVariant?: { id: string; name: string }
  customerInstructionsAnswer?: string
}

export interface Order {
  id: string // Unique order ID e.g., QYk8ro
  createdAt: string // ISO date string
  expiresAt: string // ISO date string
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "expired" | "confirming"
  customer: {
    name: string
    email: string
    phone?: string
  }
  shippingAddress: {
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  items: CartItem[]
  totalUSD: number
  totalLtc: number
  paymentMethod: "manual" | null
  txId?: string
  confirmations?: number
  secureToken: string // For one-time access link
  senderAddress?: string // The address the user sent funds FROM
  notes?: string // Admin notes and comments about the order
}

export interface AuditLog {
  id: string
  user_id: string
  username: string
  action: string
  target_type: string
  target_id: string
  details: Record<string, any> | null
  created_at: string
}
