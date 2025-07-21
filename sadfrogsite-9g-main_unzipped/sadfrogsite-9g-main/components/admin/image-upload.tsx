"use client"

import type React from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [inputUrl, setInputUrl] = useState(value || "")

  const handleUrlSet = () => {
    if (!inputUrl.trim()) {
      onChange("")
      return
    }

    // Basic URL validation
    try {
      new URL(inputUrl)
      onChange(inputUrl)
      toast.success("Image URL set successfully!")
    } catch {
      toast.error("Please enter a valid URL")
    }
  }

  const handleClear = () => {
    setInputUrl("")
    onChange("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleUrlSet()
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL</Label>
        <div className="flex gap-2">
          <Input
            id="imageUrl"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button type="button" variant="outline" onClick={handleUrlSet}>
            Set
          </Button>
          {inputUrl && (
            <Button type="button" variant="outline" onClick={handleClear}>
              Clear
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Enter a direct link to an image (JPG, PNG, GIF, WebP)</p>
      </div>

      {/* Quick Examples */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Quick Examples:</Label>
        <div className="grid grid-cols-1 gap-1 text-xs">
          <button
            type="button"
            className="text-left text-blue-600 hover:underline"
            onClick={() => {
              const exampleUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop"
              setInputUrl(exampleUrl)
              onChange(exampleUrl)
              toast.success("Example URL set!")
            }}
          >
            • Tech gadget example
          </button>
          <button
            type="button"
            className="text-left text-blue-600 hover:underline"
            onClick={() => {
              const exampleUrl = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop"
              setInputUrl(exampleUrl)
              onChange(exampleUrl)
              toast.success("Example URL set!")
            }}
          >
            • Apparel example
          </button>
        </div>
      </div>
    </div>
  )
}
