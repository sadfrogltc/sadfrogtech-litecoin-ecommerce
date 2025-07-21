"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Filter, DollarSign, Package, Clock, Star } from "lucide-react"

interface QuickFiltersProps {
  onFilterChange: (filters: QuickFilterState) => void
  activeFilters: QuickFilterState
}

export interface QuickFilterState {
  priceRange: string
  availability: string
  sortBy: string
}

export function QuickFilters({ onFilterChange, activeFilters }: QuickFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleFilterChange = (key: keyof QuickFilterState, value: string) => {
    const newFilters = { ...activeFilters, [key]: value }
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    onFilterChange({
      priceRange: "",
      availability: "",
      sortBy: ""
    })
  }

  const hasActiveFilters = Object.values(activeFilters).some(value => value !== "")

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Quick Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Price Range */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Price Range
            </h4>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Under $50", value: "under-50" },
                { label: "$50 - $100", value: "50-100" },
                { label: "$100 - $200", value: "100-200" },
                { label: "Over $200", value: "over-200" }
              ].map((filter) => (
                <Button
                  key={filter.value}
                  variant={activeFilters.priceRange === filter.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange("priceRange", 
                    activeFilters.priceRange === filter.value ? "" : filter.value
                  )}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Availability
            </h4>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "In Stock", value: "in-stock" },
                { label: "Low Stock", value: "low-stock" },
                { label: "Out of Stock", value: "out-of-stock" }
              ].map((filter) => (
                <Button
                  key={filter.value}
                  variant={activeFilters.availability === filter.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange("availability", 
                    activeFilters.availability === filter.value ? "" : filter.value
                  )}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Sort By
            </h4>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Newest", value: "newest" },
                { label: "Price: Low to High", value: "price-asc" },
                { label: "Price: High to Low", value: "price-desc" },
                { label: "Name A-Z", value: "name-asc" },
                { label: "Most Popular", value: "popular" }
              ].map((filter) => (
                <Button
                  key={filter.value}
                  variant={activeFilters.sortBy === filter.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange("sortBy", 
                    activeFilters.sortBy === filter.value ? "" : filter.value
                  )}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All Filters
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Show Less" : "Show More"}
            </Button>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="pt-4 border-t space-y-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Special Filters
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    Featured Products
                  </Button>
                  <Button variant="outline" size="sm">
                    On Sale
                  </Button>
                  <Button variant="outline" size="sm">
                    New Arrivals
                  </Button>
                  <Button variant="outline" size="sm">
                    Best Sellers
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 