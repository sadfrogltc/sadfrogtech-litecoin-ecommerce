import { PhantomProvider } from "@/phantom/PhantomProvider"

declare global {
  interface Window {
    solana?: PhantomProvider
  }
}

export {} 