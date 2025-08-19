import { neon } from "@neondatabase/serverless"

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_BtwoqYx70zLb@ep-bitter-wave-afw39oiu-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

export const sql = neon(DATABASE_URL, {
  disableWarningInBrowsers: true,
})

export async function initializeDatabase(wipeData = false) {
  try {
    console.log("[DB] Initializing Neon database schema...")

    if (wipeData) {
      console.warn("[DB] WIPING all existing data (wipeData=true)")
      // The CASCADE option will automatically handle related data in other tables.
      await sql`TRUNCATE TABLE products, orders, order_items, admin_sessions, audit_logs RESTART IDENTITY CASCADE`
      console.log("[DB] All tables have been cleared.")
    } else {
      console.log("[DB] Preserving existing data (wipeData=false)")
    }

    // Create products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(200) NOT NULL,
        sku VARCHAR(50) UNIQUE NOT NULL,
        category VARCHAR(50) NOT NULL,
        stock_status VARCHAR(20) DEFAULT 'in-stock' CHECK (stock_status IN ('in-stock', 'out-of-stock', 'deleted')),
        image_url TEXT NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create orders table
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id VARCHAR(10) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'expired', 'confirming')),
        customer_name VARCHAR(100) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20),
        shipping_street VARCHAR(200) NOT NULL,
        shipping_city VARCHAR(100) NOT NULL,
        shipping_state VARCHAR(100) NOT NULL,
        shipping_zip VARCHAR(20) NOT NULL,
        shipping_country VARCHAR(100) NOT NULL,
        total_usd DECIMAL(10,2) NOT NULL CHECK (total_usd >= 0),
        payment_method VARCHAR(20) CHECK (payment_method IN ('manual', 'walletconnect')),
        tx_id VARCHAR(100),
        confirmations INTEGER DEFAULT 0,
        secure_token VARCHAR(64) NOT NULL,
        sender_address VARCHAR(100),
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create order_items table
    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        product_id VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        sku VARCHAR(50) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        image_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create product_images table for storing binary images (tolerate rare race on first creation)
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS product_images (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          data BYTEA NOT NULL,
          mime_type TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    } catch (error: any) {
      if (error && (error.code === '23505' || String(error.message || '').includes('pg_type_typname_nsp_index'))) {
        console.warn('[DB] product_images table creation raced; ignoring duplicate type/table error')
      } else {
        throw error
      }
    }

    // Create admin_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        session_id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        username VARCHAR(100) NOT NULL,
        login_time BIGINT NOT NULL,
        last_activity BIGINT NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        expires_at BIGINT NOT NULL
      )
    `

    // Create audit_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(50) NOT NULL,
        username VARCHAR(100) NOT NULL,
        action VARCHAR(50) NOT NULL,
        target_type VARCHAR(50) NOT NULL,
        target_id VARCHAR(100) NOT NULL,
        details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create subscribers table
    await sql`
      CREATE TABLE IF NOT EXISTS subscribers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Ensure additional columns exist
    await addSenderAddressColumn()
    await addNotesColumn()
    await addStockLimitColumn()
    await addFeaturedColumn()
    await addTotalLtcColumn()
    await addImageUrlsColumn()
    await addVariantsColumn()

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at)`
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC)`

    console.log("[DB] Schema verified/created successfully.")
  } catch (error) {
    console.error("[DB] CRITICAL: Database initialization failed:", error)
    throw error
  }
}

export async function fixProductConstraints() {
  try {
    console.log("[DB] Checking and fixing product constraints...")
    const constraintCheck = await sql`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conname = 'products_stock_status_check'
    `
    if (constraintCheck.length > 0) {
      const definition = constraintCheck[0].definition
      if (definition.includes("'deleted'")) {
        console.log("[DB] Constraint already includes 'deleted' - no changes needed")
        return
      }
      await sql`ALTER TABLE products DROP CONSTRAINT products_stock_status_check`
    }
    await sql`
      ALTER TABLE products 
      ADD CONSTRAINT products_stock_status_check 
      CHECK (stock_status IN ('in-stock', 'out-of-stock', 'deleted'))
    `
    console.log("[DB] Product constraints fixed successfully")
  } catch (error) {
    console.error("[DB] Error fixing constraints:", error)
  }
}

export async function addSenderAddressColumn() {
  try {
    console.log("[DB] Checking for sender_address column in orders table...")
    // This command safely adds the column only if it doesn't already exist.
    await sql`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS sender_address VARCHAR(100)
    `
    console.log("[DB] 'sender_address' column ensured to exist in 'orders' table.")
  } catch (error) {
    console.error("[DB] Error ensuring 'sender_address' column exists:", error)
  }
}

export async function addNotesColumn() {
  try {
    console.log("[DB] Checking for notes column in orders table...")
    // This command safely adds the column only if it doesn't already exist.
    await sql`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS notes TEXT
    `
    console.log("[DB] 'notes' column ensured to exist in 'orders' table.")
  } catch (error) {
    console.error("[DB] Error ensuring 'notes' column exists:", error)
  }
}

export async function addStockLimitColumn() {
  try {
    console.log("[DB] Checking for stock_limit column in products table...");
    await sql`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS stock_limit INTEGER
    `;
    console.log("[DB] 'stock_limit' column ensured to exist in 'products' table.");
  } catch (error) {
    console.error("[DB] Error ensuring 'stock_limit' column exists:", error);
  }
}

export async function addFeaturedColumn() {
  try {
    console.log("[DB] Checking for featured column in products table...");
    await sql`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false
    `;
    console.log("[DB] 'featured' column ensured to exist in 'products' table.");
  } catch (error) {
    console.error("[DB] Error ensuring 'featured' column exists:", error);
  }
}

export async function addTotalLtcColumn() {
  try {
    console.log("[DB] Checking for total_ltc column in orders table...");
    await sql`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS total_ltc DECIMAL(18,8) DEFAULT 0
    `;
    console.log("[DB] 'total_ltc' column ensured to exist in 'orders' table.");
  } catch (error) {
    console.error("[DB] Error ensuring 'total_ltc' column exists:", error);
  }
}

export async function addImageUrlsColumn() {
  try {
    console.log("[DB] Checking for image_urls column in products table...")
    await sql`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb
    `
    console.log("[DB] 'image_urls' column ensured to exist in 'products' table.")
  } catch (error) {
    console.error("[DB] Error ensuring 'image_urls' column exists:", error)
  }
}

export async function addVariantsColumn() {
  try {
    console.log("[DB] Checking for variants column in products table...")
    await sql`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb
    `
    console.log("[DB] 'variants' column ensured to exist in 'products' table.")
  } catch (error) {
    console.error("[DB] Error ensuring 'variants' column exists:", error)
  }
}

export async function resetDatabase() {
  try {
    console.log("[DB] === STARTING COMPLETE DATABASE RESET ===")
    console.warn("[DB] WARNING: This will permanently delete ALL data!")

    // Delete all data from all tables in the correct order (respecting foreign keys)
    await sql`TRUNCATE TABLE order_items RESTART IDENTITY CASCADE`
    console.log("[DB] Cleared order_items table")

    await sql`TRUNCATE TABLE orders RESTART IDENTITY CASCADE`
    console.log("[DB] Cleared orders table")

    await sql`TRUNCATE TABLE products RESTART IDENTITY CASCADE`
    console.log("[DB] Cleared products table")

    await sql`TRUNCATE TABLE admin_sessions RESTART IDENTITY CASCADE`
    console.log("[DB] Cleared admin_sessions table")

    await sql`TRUNCATE TABLE audit_logs RESTART IDENTITY CASCADE`
    console.log("[DB] Cleared audit_logs table")

    console.log("[DB] === DATABASE RESET COMPLETED SUCCESSFULLY ===")
    console.log("[DB] All tables have been cleared and reset to initial state")

    return { success: true, message: "Database reset completed successfully" }
  } catch (error) {
    console.error("[DB] CRITICAL ERROR during database reset:", error)
    throw new Error(`Database reset failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
