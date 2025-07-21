"use client"

import { useState, useEffect, useCallback } from "react"

// Define a type for the Litescribe provider for better type safety
interface LitescribeProvider {
  isAvailable: boolean
  isConnected: boolean
  isConnecting: boolean
  userAddress: string | null
  connectWallet: () => Promise<void>
  sendTransaction: (params: { to: string; amountLTC: number }) => Promise<string | null>
  on: (event: string, callback: (...args: any[]) => void) => void
  removeListener: (event: string, callback: (...args: any[]) => void) => void
  sendLitecoin: (to: string, satoshis: number, options: { feeRate: number }) => Promise<string>
  getAccounts: () => Promise<string[]>
  requestAccounts: () => Promise<string[]>
  chain: string | undefined // Added for chain/network check
}

// Helper to convert LTC to satoshis
const ltcToSatoshis = (ltc: number): number => {
  return Math.round(ltc * 100_000_000)
}

export function useLiteScribe() {
  const [isAvailable, setIsAvailable] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [userAddress, setUserAddress] = useState<string | null>(null)

  const litescribe: LitescribeProvider | undefined =
    typeof window !== "undefined" ? (window as any).litescribe : undefined

  const updateConnectionStatus = useCallback(async () => {
    if (!litescribe) return
    try {
      const accounts = await litescribe.getAccounts()
      if (accounts && accounts.length > 0) {
        setUserAddress(accounts[0])
        setIsConnected(true)
      } else {
        setUserAddress(null)
        setIsConnected(false)
      }
    } catch (error) {
      console.error("[Wallet] Error getting accounts:", error)
      setUserAddress(null)
      setIsConnected(false)
    }
  }, [litescribe])

  useEffect(() => {
    if (litescribe) {
      setIsAvailable(true)
      console.log("[Wallet] LiteScribe wallet detected.")
      updateConnectionStatus()

      const handleAccountsChanged = (accounts: string[]) => {
        console.log("[Wallet] accountsChanged event:", accounts)
        if (accounts.length > 0) {
          setUserAddress(accounts[0])
          setIsConnected(true)
        } else {
          setUserAddress(null)
          setIsConnected(false)
        }
      }

      litescribe.on("accountsChanged", handleAccountsChanged)

      return () => {
        litescribe.removeListener("accountsChanged", handleAccountsChanged)
      }
    } else {
      setIsAvailable(false)
    }
  }, [litescribe, updateConnectionStatus])

  const connectWallet = useCallback(async () => {
    if (!litescribe) {
      console.error("[Wallet] Connect failed: Litescribe not available.");
      throw new Error("Litescribe extension is not available. Please install or enable it.");
    }
    if (litescribe.isConnecting) {
      throw new Error("Wallet is currently connecting. Please wait.");
    }
    setIsConnecting(true)
    try {
      // Improved network detection: accept chain or _network
      let network = litescribe.chain;
      if (!network && (litescribe as any)._network) {
        network = (litescribe as any)._network;
      }
      if (!network || network === "") {
        throw new Error("Litescribe extension is installed but not set up for any Litecoin network. Please open the extension and select a network.");
      }
      // Accept 'mainnet', 'testnet', 'livenet', or any string containing 'main', 'test', or 'live' as valid
      const valid = /mainnet|testnet|livenet|main|test|live/i.test(network);
      if (!valid) {
        throw new Error(`Litescribe extension network is not recognized: ${network}`);
      }
      console.log("[Wallet] Calling requestAccounts()...")
      const accounts = await litescribe.requestAccounts()
      console.log("[Wallet] requestAccounts() response:", accounts)
      if (accounts && accounts.length > 0) {
        setUserAddress(accounts[0])
        setIsConnected(true)
      }
    } catch (error) {
      console.error("[Wallet] Failed to connect wallet:", error)
      setIsConnected(false)
      throw error // propagate for UI feedback
    } finally {
      setIsConnecting(false)
    }
  }, [isAvailable])

  /**
   * Sends Litecoin using the Litescribe wallet extension.
   * @param {to: string, amountLTC: number, feeRate?: number} params - Recipient address, amount in LTC, and optional fee rate.
   * @returns {Promise<string|null>} The transaction ID (TXID) if successful.
   * @throws Error if the wallet is not connected, input is invalid, or the wallet returns an error.
   */
  const sendTransaction = useCallback(
    async ({ to, amountLTC, feeRate }: { to: string; amountLTC: number; feeRate?: number }): Promise<string | null> => {
      if (!isConnected || !window.litescribe || !window.litescribe.sendLitecoin) {
        throw new Error("Wallet is not connected or does not support this function.");
      }
      if (!userAddress) {
        throw new Error("User address not available. Please reconnect wallet.");
      }
      // Validate recipient address (mainnet and testnet)
      if (!/^(ltc1|tltc1)[0-9a-z]{39,59}$|^[LM3mn2][a-km-zA-HJ-NP-Z1-9]{26,33}$/.test(to)) {
        throw new Error("Invalid Litecoin address.");
      }
      // Convert LTC to satoshis
      const satoshis = Math.round(amountLTC * 1e8);
      let rawResponse: any = null;
      try {
        rawResponse = await window.litescribe.sendLitecoin(to, satoshis, feeRate ? { feeRate } : undefined);
        // Strict TXID validation: must be a 64-char hex string
        if (typeof rawResponse === "string" && /^[0-9a-fA-F]{64}$/.test(rawResponse)) {
          return rawResponse;
        }
        // If not a valid TXID, throw
        throw new Error(`The wallet did not return a valid transaction ID (TXID). This is required for payment confirmation. Raw response: ${JSON.stringify(rawResponse)}`);
      } catch (err: any) {
        // Log for developer
        console.error("[Litescribe] sendLitecoin error:", err, "Raw response:", rawResponse);
        // Show user-friendly error
        throw new Error(
          `The wallet did not return a valid transaction ID (TXID). This is required for payment confirmation.\n\nError: ${err?.message || err}\nRaw response: ${JSON.stringify(rawResponse)}`
        );
      }
    },
    [isConnected, userAddress]
  );

  return {
    isAvailable,
    isConnected,
    isConnecting,
    userAddress,
    connectWallet,
    sendTransaction,
    on: litescribe?.on.bind(litescribe),
    removeListener: litescribe?.removeListener.bind(litescribe),
  }
}
