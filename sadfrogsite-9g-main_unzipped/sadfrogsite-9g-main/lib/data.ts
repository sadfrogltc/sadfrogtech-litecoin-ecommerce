import { sql, initializeDatabase, fixProductConstraints, addSenderAddressColumn } from "./neon"
import type { Product, Order, AuditLog } from "@/types"
import crypto from "crypto"

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

let dbInitializationPromise: Promise<void> | null = null

export async function ensureDbInitialized() {
  if (!dbInitializationPromise) {
    console.log("[Data] Starting database initialization process...")
    dbInitializationPromise = (async () => {
      try {
        await initializeDatabase()
        await fixProductConstraints()
        await addSenderAddressColumn() // This will add the missing column
        console.log("[Data] Database initialization process completed successfully.")
      } catch (error) {
        console.error("[Data] Database initialization process failed:", error)
        dbInitializationPromise = null
        throw error
      }
    })()
  } else {
    console.log("[Data] Waiting for existing database initialization process to complete...")
  }
  await dbInitializationPromise
}

export async function getProducts(
  filters: { query?: string; category?: string; sort?: string } = {},
): Promise<Product[]> {
  await ensureDbInitialized()
  console.log("[Data] getProducts: Fetching products with server-side filters:", filters)

  // Start with the base query using a tagged template literal
  let query = sql`
    SELECT id, title, sku, category, stock_status, image_url, description, price, stock_limit, featured
    FROM products 
    WHERE stock_status != 'deleted'
  `

  // Dynamically add WHERE clauses in a safe way
  const conditions = []
  if (filters.category && filters.category !== "all") {
    conditions.push(sql`category = ${filters.category}`)
  }
  if (filters.query) {
    // Use ILIKE for case-insensitive search
    conditions.push(sql`(title ILIKE ${"%" + filters.query + "%"} OR description ILIKE ${"%" + filters.query + "%"})`)
  }

  if (conditions.length > 0) {
    // Manually join conditions with AND for Neon
    const [first, ...rest] = conditions;
    let whereClause = first;
    for (const cond of rest) {
      whereClause = sql`${whereClause} AND ${cond}`;
    }
    query = sql`${query} AND ${whereClause}`;
  }

  // Dynamically add the ORDER BY clause
  const sort = filters.sort || "title-asc"
  let orderByClause
  switch (sort) {
    case "price-asc":
      orderByClause = sql`ORDER BY price ASC`
      break
    case "price-desc":
      orderByClause = sql`ORDER BY price DESC`
      break
    case "title-desc":
      orderByClause = sql`ORDER BY title DESC`
      break
    default: // 'title-asc'
      orderByClause = sql`ORDER BY title ASC`
      break
  }

  query = sql`${query} ${orderByClause}`

  // Execute the final, safely constructed query
  const products = await query

  if (!Array.isArray(products)) {
    console.error("[Data] getProducts: The database query did not return a valid array. Result:", products)
    return [] // Return empty array to prevent a crash
  }

  console.log(`[Data] getProducts: Found ${products.length} products.`)
  return products.map((product: any) => ({
    id: product.id,
    title: product.title,
    sku: product.sku,
    category: product.category,
    stockStatus: product.stock_status as "in-stock" | "out-of-stock",
    imageUrl: product.image_url,
    description: product.description,
    price: Number.parseFloat(product.price),
    stockLimit: product.stock_limit !== null && product.stock_limit !== undefined ? Number(product.stock_limit) : undefined,
    featured: product.featured === true || product.featured === 'true',
  }))
}

export async function getProductById(id: string): Promise<Product | undefined> {
  await ensureDbInitialized()
  const products = await sql`
    SELECT id, title, sku, category, stock_status, image_url, description, price, stock_limit, featured
    FROM products 
    WHERE id = ${id} AND stock_status != 'deleted'
  `
  if (products.length === 0) return undefined
  const product = products[0]
  return {
    id: product.id,
    title: product.title,
    sku: product.sku,
    category: product.category,
    stockStatus: product.stock_status as "in-stock" | "out-of-stock",
    imageUrl: product.image_url,
    description: product.description,
    price: Number.parseFloat(product.price),
    stockLimit: product.stock_limit !== null && product.stock_limit !== undefined ? Number(product.stock_limit) : undefined,
    featured: product.featured === true || product.featured === 'true',
  }
}

export async function saveOrder(order: Order): Promise<void> {
  await ensureDbInitialized()
  const orderResult = await sql`
    INSERT INTO orders (
      order_id, status, customer_name, customer_email, customer_phone,
      shipping_street, shipping_city, shipping_state, shipping_zip, shipping_country,
      total_usd, total_ltc, payment_method, tx_id, confirmations, secure_token, expires_at, notes
    ) VALUES (
      ${order.id}, ${order.status}, ${order.customer.name}, ${order.customer.email}, ${order.customer.phone || null},
      ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, 
      ${order.shippingAddress.zip}, ${order.shippingAddress.country},
      ${order.totalUSD}, ${order.totalLtc}, ${order.paymentMethod || null}, ${order.txId || null}, 
      ${order.confirmations || 0}, ${order.secureToken}, ${new Date(Date.now() + 60 * 60 * 1000)}, ${order.notes || null}
    )
    RETURNING id
  `
  const dbOrderId = orderResult[0].id
  for (const item of order.items) {
    await sql`
      INSERT INTO order_items (order_id, product_id, title, sku, price, quantity, image_url)
      VALUES (${dbOrderId}, ${item.id}, ${item.title}, ${item.sku}, ${item.price}, ${item.quantity}, ${item.imageUrl})
    `
  }
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  await ensureDbInitialized()
  const orderResult = await sql`
    SELECT 
      o.id as internal_id, -- internal UUID
      o.order_id, 
      o.status, 
      o.customer_name, 
      o.customer_email, 
      o.customer_phone,
      o.shipping_street, 
      o.shipping_city, 
      o.shipping_state, 
      o.shipping_zip, 
      o.shipping_country,
      o.total_usd,
      o.total_ltc,
      o.payment_method,
      o.tx_id,
      o.confirmations,
      o.secure_token,
      o.created_at,
      o.expires_at,
      o.sender_address,
      o.notes
    FROM orders o
    WHERE o.order_id = ${id}
  `

  if (orderResult.length === 0) {
    console.log(`[Data] getOrderById: No order found with ID ${id}`)
    return undefined
  }

  const order = orderResult[0]
  const itemsResult = await sql`
    SELECT product_id, title, sku, price, quantity, image_url
    FROM order_items
    WHERE order_id = ${order.internal_id} -- use the internal UUID here!
  `

  const items = itemsResult.map((item: any) => ({
    id: item.product_id,
    title: item.title,
    sku: item.sku,
    price: Number.parseFloat(item.price),
    quantity: item.quantity,
    imageUrl: item.image_url,
    category: "", // Not available in order_items, set as empty
    stockStatus: "in-stock" as const, // Default to in-stock
    description: "", // Not available in order_items, set as empty
  }))

  return {
    id: order.order_id, // always use the public order_id as id
    createdAt: order.created_at instanceof Date ? order.created_at.toISOString() : order.created_at,
    expiresAt: order.expires_at instanceof Date ? order.expires_at.toISOString() : order.expires_at,
    status: order.status,
    customer: {
      name: order.customer_name,
      email: order.customer_email,
      phone: order.customer_phone || undefined,
    },
    shippingAddress: {
      street: order.shipping_street,
      city: order.shipping_city,
      state: order.shipping_state,
      zip: order.shipping_zip,
      country: order.shipping_country,
    },
    items,
    totalUSD: Number.parseFloat(order.total_usd),
    totalLtc: Number.parseFloat(order.total_ltc),
    paymentMethod: order.payment_method as "manual" | null,
    txId: order.tx_id || undefined,
    confirmations: order.confirmations || undefined,
    secureToken: order.secure_token,
    senderAddress: order.sender_address || undefined,
    notes: order.notes || undefined,
  }
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined> {
  await ensureDbInitialized()
  const existingOrder = await getOrderById(id)
  if (!existingOrder) {
    console.log(`[Data] updateOrder: No order found with ID ${id}`)
    return undefined
  }

  // Build the update query dynamically
  const updateFields: string[] = []
  const updateValues: any[] = []

  if (updates.status !== undefined) {
    updateFields.push(`status = $${updateValues.length + 1}`)
    updateValues.push(updates.status)
  }
  if (updates.customer !== undefined) {
    updateFields.push(`customer_name = $${updateValues.length + 1}`, `customer_email = $${updateValues.length + 2}`, `customer_phone = $${updateValues.length + 3}`)
    updateValues.push(updates.customer.name, updates.customer.email, updates.customer.phone || null)
  }
  if (updates.shippingAddress !== undefined) {
    updateFields.push(
      `shipping_street = $${updateValues.length + 1}`,
      `shipping_city = $${updateValues.length + 2}`,
      `shipping_state = $${updateValues.length + 3}`,
      `shipping_zip = $${updateValues.length + 4}`,
      `shipping_country = $${updateValues.length + 5}`
    )
    updateValues.push(
      updates.shippingAddress.street,
      updates.shippingAddress.city,
      updates.shippingAddress.state,
      updates.shippingAddress.zip,
      updates.shippingAddress.country
    )
  }
  if (updates.totalUSD !== undefined) {
    updateFields.push(`total_usd = $${updateValues.length + 1}`)
    updateValues.push(updates.totalUSD)
  }
  if (updates.totalLtc !== undefined) {
    updateFields.push(`total_ltc = $${updateValues.length + 1}`)
    updateValues.push(updates.totalLtc)
  }
  if (updates.paymentMethod !== undefined) {
    updateFields.push(`payment_method = $${updateValues.length + 1}`)
    updateValues.push(updates.paymentMethod)
  }
  if (updates.txId !== undefined) {
    updateFields.push(`tx_id = $${updateValues.length + 1}`)
    updateValues.push(updates.txId)
  }
  if (updates.confirmations !== undefined) {
    updateFields.push(`confirmations = $${updateValues.length + 1}`)
    updateValues.push(updates.confirmations)
  }
  if (updates.senderAddress !== undefined) {
    updateFields.push(`sender_address = $${updateValues.length + 1}`)
    updateValues.push(updates.senderAddress)
  }
  if (updates.notes !== undefined) {
    updateFields.push(`notes = $${updateValues.length + 1}`)
    updateValues.push(updates.notes)
  }

  if (updateFields.length === 0) {
    console.log(`[Data] updateOrder: No updates provided for order ${id}`)
    return existingOrder
  }

  const setClause = updateFields.join(", ")
  const query = `UPDATE orders SET ${setClause} WHERE order_id = $${updateValues.length + 1}`

  // Debug log for query and parameters
  console.log("[Data] updateOrder: Final query:", query, "with values:", [...updateValues, id])

  try {
    await sql.query(query, [...updateValues, id])
  } catch (error) {
    console.error(`[Data] updateOrder: Failed to update order ${id}. Query failed.`, error)
    throw error
  }

  return getOrderById(id)
}

export async function getAllOrders(): Promise<Order[]> {
  await ensureDbInitialized()
  console.log("[Data] getAllOrders: Fetching all orders from the database.")

  const ordersResult = await sql`
    SELECT 
      o.order_id, 
      o.status, 
      o.customer_name, 
      o.customer_email, 
      o.created_at, 
      o.expires_at,
      o.total_usd,
      o.total_ltc,
      o.payment_method,
      o.tx_id,
      o.confirmations,
      o.secure_token,
      o.sender_address,
      o.notes
    FROM orders o
    ORDER BY o.created_at DESC
  `

  console.log(`[Data] getAllOrders: Raw query result returned ${ordersResult.length} orders.`)
  if (ordersResult.length > 0) {
    console.log("[Data] getAllOrders: First raw order from DB:", ordersResult[0])
  }

  const mappedOrders = ordersResult.map((order: any) => ({
    id: order.order_id,
    createdAt: order.created_at instanceof Date ? order.created_at.toISOString() : order.created_at,
    expiresAt: order.expires_at instanceof Date ? order.expires_at.toISOString() : order.expires_at,
    status: order.status as Order["status"],
    customer: { name: order.customer_name, email: order.customer_email },
    totalUSD: Number.parseFloat(order.total_usd),
    totalLtc: Number.parseFloat(order.total_ltc),
    paymentMethod: order.payment_method as "manual" | null,
    txId: order.tx_id || undefined,
    confirmations: order.confirmations || undefined,
    secureToken: order.secure_token,
    senderAddress: order.sender_address || undefined,
    notes: order.notes || undefined,
    shippingAddress: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
    items: [], // Not included in list view
  }))

  console.log(`[Data] getAllOrders: Mapped ${mappedOrders.length} orders successfully.`)
  if (mappedOrders.length > 0) {
    console.log("[Data] getAllOrders: First mapped order:", mappedOrders[0])
  }

  return mappedOrders
}

export async function createProduct(product: Omit<Product, "id">): Promise<Product> {
  await ensureDbInitialized()
  const result = await sql`
    INSERT INTO products (title, sku, category, stock_status, image_url, description, price, stock_limit, featured)
    VALUES (${product.title}, ${product.sku}, ${product.category}, ${product.stockStatus}, ${product.imageUrl}, ${product.description}, ${product.price}, ${product.stockLimit ?? null}, ${product.featured ?? false})
    RETURNING id, title, sku, category, stock_status, image_url, description, price, stock_limit, featured
  `
  const newProduct = result[0]
  return {
    id: newProduct.id,
    title: newProduct.title,
    sku: newProduct.sku,
    category: newProduct.category,
    stockStatus: newProduct.stock_status as "in-stock" | "out-of-stock",
    imageUrl: newProduct.image_url,
    description: newProduct.description,
    price: Number.parseFloat(newProduct.price),
    stockLimit: newProduct.stock_limit !== null && newProduct.stock_limit !== undefined ? Number(newProduct.stock_limit) : undefined,
    featured: newProduct.featured === true || newProduct.featured === 'true',
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
  await ensureDbInitialized()
  const existingProduct = await getProductById(id)
  if (!existingProduct) return undefined
  const result = await sql`
    UPDATE products 
    SET 
      title = ${updates.title || existingProduct.title},
      sku = ${updates.sku || existingProduct.sku},
      category = ${updates.category || existingProduct.category},
      stock_status = ${updates.stockStatus || existingProduct.stockStatus},
      image_url = ${updates.imageUrl !== undefined ? updates.imageUrl : existingProduct.imageUrl},
      description = ${updates.description || existingProduct.description},
      price = ${updates.price !== undefined ? updates.price : existingProduct.price},
      stock_limit = ${updates.stockLimit !== undefined ? updates.stockLimit : existingProduct.stockLimit ?? null},
      featured = ${updates.featured !== undefined ? updates.featured : existingProduct.featured ?? false},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING id, title, sku, category, stock_status, image_url, description, price, stock_limit, featured
  `
  if (result.length === 0) return undefined
  const product = result[0]
  return {
    id: product.id,
    title: product.title,
    sku: product.sku,
    category: product.category,
    stockStatus: product.stock_status as "in-stock" | "out-of-stock",
    imageUrl: product.image_url,
    description: product.description,
    price: Number.parseFloat(product.price),
    stockLimit: product.stock_limit !== null && product.stock_limit !== undefined ? Number(product.stock_limit) : undefined,
    featured: product.featured === true || product.featured === 'true',
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  await ensureDbInitialized()
  const result = await sql`
    UPDATE products 
    SET stock_status = 'deleted', updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id} AND stock_status != 'deleted'
  `
  return result.length > 0
}

export async function getCategories(): Promise<string[]> {
  await ensureDbInitialized()
  const result = await sql`
    SELECT DISTINCT category FROM products WHERE stock_status != 'deleted' ORDER BY category
  `
  return result.map((row: any) => row.category)
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  await ensureDbInitialized()
  console.log("[Data] getAuditLogs: Fetching all audit logs.")
  try {
    const logs = await sql`
      SELECT id, user_id, username, action, target_type, target_id, details, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 100;
    `
    console.log(`[Data] getAuditLogs: Found ${logs.length} log entries.`)
    return logs.map((log: any) => ({
      ...log,
      created_at: new Date(log.created_at).toISOString(),
      details: log.details || null,
    }))
  } catch (error) {
    console.error("[Data] getAuditLogs: Failed to fetch audit logs:", error)
    return []
  }
}

export async function createOrder(orderData: {
  id: string
  status: string
  customer: { name: string; email: string; phone: string }
  shippingAddress: { street: string; city: string; state: string; zip: string; country: string }
  items: any[]
  totalUSD: number
  totalLtc: number
  notes: string
}): Promise<Order> {
  await ensureDbInitialized()
  
  // Generate secure token
  const secureToken = crypto.randomBytes(32).toString("hex")
  
  const order: Order = {
    id: orderData.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    status: orderData.status as Order["status"],
    customer: orderData.customer,
    shippingAddress: orderData.shippingAddress,
    items: orderData.items,
    totalUSD: orderData.totalUSD,
    totalLtc: orderData.totalLtc,
    paymentMethod: null,
    secureToken: secureToken,
  }

  await saveOrder(order)
  return order
}

export async function getOrderBySenderAddress(address: string): Promise<Order | undefined> {
  await ensureDbInitialized();
  const orders = await sql`
    SELECT * FROM orders WHERE sender_address = ${address} LIMIT 1
  `;
  if (orders.length === 0) return undefined;
  return getOrderById(orders[0].order_id);
}
