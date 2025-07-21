"use client"

import { useState } from "react"
import { toast } from "sonner"

export function useCopyToClipboard(): [boolean, (text: string) => Promise<boolean>] {
  const [isCopied, setIsCopied] = useState(false)

  const copy = async (text: string) => {
    if (!navigator?.clipboard) {
      console.warn("[useCopyToClipboard] Clipboard not supported")
      toast.error("Clipboard access is not available in your browser.")
      return false
    }

    try {
      await navigator.clipboard.writeText(text)
      console.log("[useCopyToClipboard] Copied text:", text)
      setIsCopied(true)
      toast.success("Copied to clipboard!")
      setTimeout(() => setIsCopied(false), 2000)
      return true
    } catch (error) {
      console.error("[useCopyToClipboard] Copy failed:", error)
      toast.error("Failed to copy to clipboard.")
      setIsCopied(false)
      return false
    }
  }

  return [isCopied, copy]
}
