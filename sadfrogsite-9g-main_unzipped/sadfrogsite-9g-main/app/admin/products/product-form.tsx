"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useActionState, useEffect, useTransition } from "react"
import type { Product } from "@/types"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { saveProductAction } from "./actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { ImageUpload } from "@/components/admin/image-upload" // Add this import
import { ImageUploadMulti } from "@/components/admin/image-upload-multi"

const productSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().min(10, "Description is required."),
  price: z.coerce.number().min(0.01, "Price must be positive."),
  sku: z.string().min(3, "SKU is required."),
  category: z.string().min(3, "Category is required."),
  stockStatus: z.enum(["in-stock", "out-of-stock"]),
  imageUrl: z.string().url("Must be a valid URL.").or(z.literal("")).or(z.string().startsWith("/")),
  // Accept a JSON string for multiple images in the form layer
  imageUrls: z.string().optional(),
  customerInstructions: z.string().optional(),
  requireCustomerInstructions: z.union([z.boolean(), z.string()]).transform(val => {
    if (typeof val === "boolean") return val;
    if (val === "true") return true;
    if (val === "false") return false;
    return false;
  }).optional().default(false),
  stockLimit: z.coerce.number().int().positive("Stock limit must be a positive integer.").optional().or(z.literal("")).transform(val => val === "" ? undefined : val),
  featured: z.union([z.boolean(), z.string()]).transform(val => {
    if (typeof val === "boolean") return val;
    if (val === "true") return true;
    if (val === "false") return false;
    return false;
  }).optional().default(false),
  variants: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  product?: Product | null
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [state, formAction] = useActionState(saveProductAction, { success: false, errors: {} })

  console.log("[ProductForm] Rendering with product:", product)
  console.log("[ProductForm] Product is null/undefined:", product == null)

  const isEditing = product != null
  const productId = product?.id || null

  console.log("[ProductForm] Is editing:", isEditing)
  console.log("[ProductForm] Product ID:", productId)

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: product?.title || "",
      description: product?.description || "",
      price: product?.price || 0,
      sku: product?.sku || "",
      category: product?.category || "",
      stockStatus: product?.stockStatus || "in-stock",
      imageUrl: product?.imageUrl || "/placeholder.svg?height=500&width=500",
      imageUrls: product?.imageUrls ? JSON.stringify(product.imageUrls) : "",
      customerInstructions: product?.customerInstructions || "",
      requireCustomerInstructions: product?.requireCustomerInstructions ?? false,
      variants: product?.variants ? JSON.stringify(product.variants) : "",
      stockLimit: product?.stockLimit ?? "",
      featured: product?.featured ?? false,
    },
  })

  useEffect(() => {
    if (state.success) {
      toast.success(isEditing ? "Product updated successfully!" : "Product created successfully!")
      router.push("/admin/products")
    } else if (state.errors && Object.keys(state.errors).length > 0) {
      console.error("[ProductForm] Form errors:", state.errors)
      if (state.errors._form) {
        toast.error(state.errors._form)
      } else {
        toast.error("Please correct the errors in the form.")
      }
    }
  }, [state, router, isEditing])

  const onSubmit = (values: ProductFormData) => {
    console.log("[ProductForm] Form submitted with values:", values)
    console.log("[ProductForm] Is editing:", isEditing)
    console.log("[ProductForm] Product ID for update:", productId)

    const formData = new FormData()

    // Add all form values
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, String(value))
    })

    // Add operation type and product ID if editing
    if (isEditing && productId) {
      formData.append("productId", productId)
      formData.append("isUpdate", "true")
      console.log("[ProductForm] Added update fields - ID:", productId)
    } else {
      formData.append("isUpdate", "false")
      console.log("[ProductForm] Creating new product")
    }

    console.log("[ProductForm] FormData entries:")
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}: ${value}`)
    }

    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 grid gap-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Quantum Gadget" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={5} placeholder="Describe the product..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. QG-001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Gadgets" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stockStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="in-stock">In Stock</SelectItem>
                        <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stockLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Limit</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} step={1} placeholder="e.g. 100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="md:col-span-1">
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Image</FormLabel>
                  <FormControl>
                    <ImageUpload value={field.value} onChange={(url) => field.onChange(url)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrls"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Images</FormLabel>
                  <FormControl>
                    <ImageUploadMulti
                      values={(() => { try { return JSON.parse(field.value || "[]") } catch { return [] } })()}
                      onChange={(urls) => field.onChange(JSON.stringify(urls))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Customer Instructions */}
            <FormField
              control={form.control}
              name="customerInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Instructions (shown to buyer)</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="Describe what the customer should provide (e.g., custom text, measurements, etc.)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="requireCustomerInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Require Customer Instructions</FormLabel>
                  <FormControl>
                    <input type="checkbox" checked={field.value as boolean} onChange={e => field.onChange(e.target.checked)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Variants Editor */}
            <FormField
              control={form.control}
              name="variants"
              render={({ field }) => {
                const parsed = (() => { try { return JSON.parse(field.value || "[]") } catch { return [] } })() as Array<{ id: string; name: string; imageUrls: string[] }>
                const setParsed = (next: Array<{ id: string; name: string; imageUrls: string[] }>) => field.onChange(JSON.stringify(next))
                const upsert = (idx: number, patch: Partial<{ name: string; imageUrls: string[] }>) => {
                  const next = [...parsed]
                  next[idx] = { ...next[idx], ...patch }
                  setParsed(next)
                }
                const addVariant = () => setParsed([...(parsed || []), { id: Math.random().toString(36).slice(2,8), name: "", imageUrls: [] }])
                const removeVariant = (idx: number) => setParsed(parsed.filter((_, i) => i !== idx))
                return (
                  <FormItem>
                    <FormLabel>Variants (e.g., Colors)</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <Button type="button" variant="outline" onClick={addVariant}>Add Variant</Button>
                        {parsed.map((v, idx) => (
                          <div key={v.id} className="border rounded p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="Variant name (e.g., Red)"
                                value={v.name}
                                onChange={(e) => upsert(idx, { name: e.target.value })}
                              />
                              <Button type="button" variant="destructive" onClick={() => removeVariant(idx)}>Remove</Button>
                            </div>
                            <ImageUploadMulti
                              values={v.imageUrls || []}
                              onChange={(urls) => upsert(idx, { imageUrls: urls })}
                            />
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
            <FormField
              control={form.control}
              name="imageUrls"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Images (JSON array of URLs)</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder='["https://example.com/img1.jpg", "https://example.com/img2.jpg"]' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Featured Checkbox */}
            <FormField
              control={form.control}
              name="featured"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Featured on Homepage</FormLabel>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={e => field.onChange(e.target.checked)}
                      className="mr-2"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? isEditing
                ? "Saving Changes..."
                : "Creating Product..."
              : isEditing
                ? "Save Changes"
                : "Create Product"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
