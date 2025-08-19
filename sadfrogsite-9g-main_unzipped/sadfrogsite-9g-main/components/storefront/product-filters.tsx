"use client"

import type React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface ProductFiltersProps {
  categories: string[]
}

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "title-asc", label: "Alphabetical (A-Z)" },
  { value: "title-desc", label: "Alphabetical (Z-A)" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
]

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(name, value)
    } else {
      params.delete(name)
    }
    return params.toString()
  }

  const handleFilterChange = (name: string, value: string) => {
    const newQuery = createQueryString(name, value)
    console.log(`[ProductFilters] Updating filter. Name: ${name}, Value: ${value}. New query: ?${newQuery}`)
    router.push(pathname + "?" + newQuery)
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = formData.get("search") as string
    handleFilterChange("q", query)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter & Sort</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSearch} className="relative">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <Input
            id="search"
            name="search"
            placeholder="Search products..."
            defaultValue={searchParams.get("q") || ""}
            className="pr-10"
          />
          <Button type="submit" size="icon" variant="ghost" className="absolute right-0 top-0 h-full">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            onValueChange={(value) => handleFilterChange("category", value)}
            defaultValue={searchParams.get("category") || "all"}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sort">Sort by</Label>
          <Select
            onValueChange={(value) => handleFilterChange("sort", value)}
            defaultValue={searchParams.get("sort") || "newest"}
          >
            <SelectTrigger id="sort">
              <SelectValue placeholder="Sort products" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
