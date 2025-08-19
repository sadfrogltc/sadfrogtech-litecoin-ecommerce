"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"

interface ImageUploadMultiProps {
  values: string[]
  onChange: (urls: string[]) => void
}

export function ImageUploadMulti({ values, onChange }: ImageUploadMultiProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [previews, setPreviews] = useState<string[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsUploading(true)
    try {
      const uploaded: string[] = []
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
      const fileArr = Array.from(files)
      const totalSize = fileArr.reduce((sum, f) => sum + f.size, 0)
      let uploadedBytes = 0
      setProgress(0)
      setPreviews(fileArr.map((f) => URL.createObjectURL(f)))

      for (const file of fileArr) {
        if (!allowed.includes(file.type)) {
          toast.error(`Unsupported type: ${file.name}`)
          continue
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`Too large (>5MB): ${file.name}`)
          continue
        }
        const formData = new FormData()
        formData.append("file", file)

        // XHR for per-file progress; aggregate to overall
        const xhr = new XMLHttpRequest()
        const resPromise = new Promise<Response>((resolve, reject) => {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const fileProgress = event.loaded
              const overall = ((uploadedBytes + fileProgress) / totalSize) * 100
              setProgress(Math.max(0, Math.min(100, Math.round(overall))))
            }
          }
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              uploadedBytes += file.size
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
        uploaded.push(url)
      }
      const next = [...values, ...uploaded]
      onChange(next)
      toast.success(`${uploaded.length} image(s) uploaded.`)
    } catch (err) {
      console.error(err)
      toast.error("Upload failed")
    } finally {
      setIsUploading(false)
      setProgress(0)
      setTimeout(() => {
        // Revoke object URLs to avoid memory leaks
        previews.forEach((u) => URL.revokeObjectURL(u))
        setPreviews([])
      }, 500)
    }
  }

  const handleDropZoneDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDropZoneDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const dt = e.dataTransfer
    if (dt && dt.files && dt.files.length > 0) {
      void handleFiles(dt.files)
    }
  }

  const onItemDragStart = (idx: number) => (e: React.DragEvent<HTMLDivElement>) => {
    setDragIndex(idx)
    e.dataTransfer.effectAllowed = "move"
  }

  const onItemDragOver = (idx: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (overIndex !== idx) setOverIndex(idx)
  }

  const onItemDrop = (idx: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setOverIndex(null)
    if (dragIndex === null || dragIndex === idx) return
    const next = [...values]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(idx, 0, moved)
    onChange(next)
    setDragIndex(null)
  }

  const onItemDragEnd = () => {
    setDragIndex(null)
    setOverIndex(null)
  }

  const removeAt = (idx: number) => {
    const next = values.filter((_, i) => i !== idx)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Additional Images</Label>
        <Input type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} />
        <div
          className="mt-2 border-2 border-dashed rounded-md p-4 text-sm text-muted-foreground hover:bg-muted/30 cursor-copy"
          onDragOver={handleDropZoneDragOver}
          onDrop={handleDropZoneDrop}
        >
          Drag & drop images here to upload
        </div>
        <Button type="button" variant="secondary" disabled={isUploading}>
          {isUploading ? "Uploading..." : "Upload Selected"}
        </Button>
      </div>
      {(values.length > 0 || previews.length > 0) && (
        <div className="grid grid-cols-3 gap-3">
          {previews.map((url, idx) => (
            <div key={`preview-${idx}`} className="relative border rounded overflow-hidden opacity-80">
              <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-24 object-cover" />
            </div>
          ))}
          {values.map((url, idx) => (
            <div
              key={idx}
              className={`relative border rounded overflow-hidden ${overIndex === idx ? "ring-2 ring-primary" : ""}`}
              draggable
              onDragStart={onItemDragStart(idx)}
              onDragOver={onItemDragOver(idx)}
              onDrop={onItemDrop(idx)}
              onDragEnd={onItemDragEnd}
              title="Drag to reorder"
            >
              <img src={url} alt={`Image ${idx + 1}`} className="w-full h-24 object-cover" />
              <Button type="button" size="sm" variant="destructive" className="absolute top-1 right-1" onClick={() => removeAt(idx)}>
                Remove
              </Button>
              <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1 rounded">Drag</span>
            </div>
          ))}
        </div>
      )}
      {isUploading && (
        <div className="pt-2">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
        </div>
      )}
    </div>
  )
}


