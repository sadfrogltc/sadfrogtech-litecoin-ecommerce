"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [inputUrl, setInputUrl] = useState(value || "")
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowed.includes(file.type)) {
      toast.error("Unsupported file type")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large (max 5MB)")
      return
    }
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const uploadSelected = async () => {
    if (!selectedFile) return
    try {
      setIsUploading(true)
      setProgress(0)

      const formData = new FormData()
      formData.append("file", selectedFile)

      const xhr = new XMLHttpRequest()
      const resPromise = new Promise<Response>((resolve, reject) => {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100))
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(new Response(xhr.response, { status: xhr.status, headers: new Headers({ "Content-Type": xhr.getResponseHeader("Content-Type") || "application/json" }) }))
          } else {
            reject(new Error(`Upload failed (${xhr.status})`))
          }
        }
        xhr.onerror = () => reject(new Error("Network error"))
        xhr.open("POST", "/api/upload")
        xhr.send(formData)
      })

      const res = await resPromise
      const { url } = await res.json()
      setInputUrl(url)
      onChange(url)
      toast.success("Image uploaded!")
      setSelectedFile(null)
    } catch (err) {
      console.error(err)
      toast.error("Upload failed")
    } finally {
      setIsUploading(false)
      setProgress(0)
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUrl])

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
        <div className="flex items-center gap-2">
          <Input type="file" accept="image/*" onChange={handleFileSelect} />
          <Button type="button" variant="secondary" disabled={isUploading || !selectedFile} onClick={uploadSelected}>
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
        {(previewUrl || inputUrl) && (
          <div className="pt-2">
            <Label className="text-xs">Preview</Label>
            <div className="mt-1 border rounded overflow-hidden w-32 h-32">
              <img src={previewUrl || inputUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          </div>
        )}
        {isUploading && (
          <div className="pt-2">
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
          </div>
        )}
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
