"use server"

import { createProduct, updateProduct, deleteProduct, getProducts } from "@/lib/data"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const productSchema = z.object({
  productId: z.string().optional(),
  isUpdate: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0.01, "Price must be positive."),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  stockStatus: z.enum(["in-stock", "out-of-stock"]),
  imageUrl: z.string().url("Must be a valid URL.").or(z.literal("")).or(z.string().startsWith("/")),
  imageUrls: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return [] as string[]
      try {
        const parsed = JSON.parse(val)
        return Array.isArray(parsed) ? (parsed as string[]) : []
      } catch {
        return [] as string[]
      }
    }),
  customerInstructions: z.string().optional(),
  requireCustomerInstructions: z.union([z.boolean(), z.string()]).transform(val => {
    if (typeof val === "boolean") return val;
    if (val === "true") return true;
    if (val === "false") return false;
    return false;
  }).optional().default(false),
  variants: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return [] as Array<{ id: string; name: string; imageUrls: string[] }>
      try {
        const parsed = JSON.parse(val)
        return Array.isArray(parsed) ? (parsed as Array<{ id: string; name: string; imageUrls: string[] }>) : []
      } catch {
        return [] as Array<{ id: string; name: string; imageUrls: string[] }>
      }
    }),
  stockLimit: z.coerce.number().int().positive("Stock limit must be a positive integer.").optional().or(z.literal("")).transform(val => val === "" ? undefined : val),
  featured: z.union([z.boolean(), z.string()]).transform(val => {
    if (typeof val === "boolean") return val;
    if (val === "true") return true;
    if (val === "false") return false;
    return false;
  }).optional().default(false),
})

export async function saveProductAction(prevState: any, formData: FormData) {
  console.log("[Product Action] === STARTING SAVE PRODUCT ACTION ===")
  console.log("[Product Action] Form data received:")
  for (const [key, value] of formData.entries()) {
    console.log(`  ${key}: ${value}`)
  }

  try {
    const rawData = Object.fromEntries(formData.entries())
    // Parse stockLimit as number if present
    if ("stockLimit" in rawData) {
      const val = rawData.stockLimit
      rawData.stockLimit = val === "" ? undefined : Number(val)
      if (isNaN(rawData.stockLimit)) rawData.stockLimit = undefined
    }
    console.log("[Product Action] Raw form data object:", rawData)

    const validatedFields = productSchema.safeParse(rawData)

    if (!validatedFields.success) {
      console.log("[Product Action] Validation failed:", validatedFields.error.flatten().fieldErrors)
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { productId, isUpdate, ...productData } = validatedFields.data
    const isUpdateOperation = isUpdate === "true"

    console.log("[Product Action] Parsed data:")
    console.log("  - Product ID:", productId)
    console.log("  - Is Update:", isUpdateOperation)
    console.log("  - Product Data:", productData)

    // Check for SKU conflicts
    const existingProducts = await getProducts()
    const skuConflict = existingProducts.find(
      (p) => p.sku === productData.sku && (!isUpdateOperation || p.id !== productId),
    )

    if (skuConflict) {
      console.log(
        `[Product Action] SKU conflict detected: ${productData.sku} already exists for product ${skuConflict.id}`,
      )
      return {
        success: false,
        errors: {
          sku: [
            `SKU "${productData.sku}" is already in use by product "${skuConflict.title}". Please use a different SKU.`,
          ],
        },
      }
    }

    if (isUpdateOperation) {
      if (!productId) {
        console.error("[Product Action] Update operation requested but no product ID provided")
        return {
          success: false,
          errors: { _form: "Product ID is required for updates" },
        }
      }

      console.log(`[Product Action] Updating product ${productId}`)
      const updatedProduct = await updateProduct(productId, productData)

      if (!updatedProduct) {
        console.error(`[Product Action] Update failed - product ${productId} not found`)
        return {
          success: false,
          errors: { _form: "Failed to update product. The product may have been deleted or the ID is incorrect." },
        }
      }

      console.log(`[Product Action] Successfully updated product ${productId}`)
    } else {
      console.log(`[Product Action] Creating new product`)
      const newProduct = await createProduct(productData)
      console.log(`[Product Action] Successfully created new product:`, newProduct)
    }

    revalidatePath("/admin/products")
    revalidatePath("/") // also revalidate home page

    console.log("[Product Action] === SAVE PRODUCT ACTION COMPLETED SUCCESSFULLY ===")
    return { success: true, errors: {} }
  } catch (error) {
    console.error("[Product Action] === SAVE PRODUCT ACTION FAILED ===")
    console.error("[Product Action] Error details:", error)
    console.error("[Product Action] Error stack:", error instanceof Error ? error.stack : "No stack trace")

    // Handle specific database constraint errors
    if (error instanceof Error && error.message.includes("duplicate key value violates unique constraint")) {
      if (error.message.includes("products_sku_key")) {
        return {
          success: false,
          errors: { sku: ["This SKU is already in use. Please choose a different SKU."] },
        }
      }
    }

    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred."
    return {
      success: false,
      errors: { _form: errorMessage },
    }
  }
}

export async function deleteProductAction(id: string) {
  try {
    console.log(`[Product Action] Deleting product ${id}`)
    await deleteProduct(id)
    revalidatePath("/admin/products")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error(`[Product Action] Failed to delete product ${id}:`, error)
    return { success: false, error: "Failed to delete product." }
  }
}
