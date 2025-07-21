"use client"

import Image from "next/image"
import Link from "next/link"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Product } from "@/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { deleteProductAction } from "@/app/admin/products/actions"

interface ProductsTableProps {
  products: Product[]
}

export function ProductsTable({ products }: ProductsTableProps) {
  const [isDeleting, startDeleteTransition] = useTransition()
  const router = useRouter()

  const handleDelete = (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return
    }

    startDeleteTransition(async () => {
      const result = await deleteProductAction(productId)
      if (result.success) {
        toast.success("Product deleted successfully")
        // Revalidation is handled by the server action
      } else {
        toast.error(result.error || "Failed to delete product")
      }
    })
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No products found</p>
        <Button asChild className="mt-4">
          <Link href="/admin/products/new">Add your first product</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto mobile-scroll">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px] min-w-[80px]">Image</TableHead>
            <TableHead className="min-w-[150px]">Name</TableHead>
            <TableHead className="min-w-[100px] hidden sm:table-cell">Status</TableHead>
            <TableHead className="min-w-[80px] hidden md:table-cell">Price</TableHead>
            <TableHead className="min-w-[100px] hidden lg:table-cell">Category</TableHead>
            <TableHead className="w-[70px] min-w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <Image
                  src={product.imageUrl || "/placeholder.svg"}
                  alt={product.title}
                  width={48}
                  height={48}
                  className="rounded-md object-cover sm:w-16 sm:h-16"
                />
              </TableCell>
              <TableCell>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{product.title}</div>
                  <div className="text-xs text-muted-foreground truncate">SKU: {product.sku}</div>
                  <div className="sm:hidden text-xs text-muted-foreground">
                    ${product.price.toFixed(2)} • {product.category}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge variant={product.stockStatus === "in-stock" ? "default" : "destructive"}>
                  <span className="hidden md:inline">{product.stockStatus}</span>
                  <span className="md:hidden">{product.stockStatus === "in-stock" ? "In" : "Out"}</span>
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">${product.price.toFixed(2)}</TableCell>
              <TableCell className="hidden lg:table-cell">{product.category}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 mobile-touch-target">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/products/${product.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(product.id)}
                      disabled={isDeleting}
                      className="text-red-600"
                    >
                      {isDeleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      {isDeleting ? "Deleting..." : "Delete"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
