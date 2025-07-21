// Add global declaration for window.litescribe
export {};
declare global {
  interface Window {
    litescribe?: any;
  }
}
// Litescribe Wallet API Implementation
// This script integrates with the Litescribe API to broadcast transactions and retrieve TXIDs
// Dependencies (mocked or assumed; replace with actual implementations)
import randomstring from "randomstring"
import { ethErrors, serializeError } from "eth-rpc-errors"
import { EventEmitter } from "events"

// Mock createPersistStore (replace with your actual storage utility)
async function createPersistStore({ name, template }: { name: string; template: OpenApiStore }): Promise<OpenApiStore> {
  // Mock implementation using localStorage or similar
  return Promise.resolve(template)
}

// Mock BroadcastChannelMessage (simplified for this example; replace with actual implementation)
class BroadcastChannelMessage {
  private channel: string
  private listeners: { [event: string]: (data: any) => void } = {}
  constructor(channel: string) {
    this.channel = channel
  }
  connect() {
    // Mock connection logic
    return this
  }
  on(event: string, handler: (data: any) => void) {
    this.listeners[event] = handler
    return this
  }
  async request(data: any): Promise<any> {
    // Mock request logic; replace with actual broadcast channel communication
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (data.method === "pushTx" || data.method === "pushPsbt") {
          resolve("82f1c2a966dc6440738d5c85ab7ba9d2bf72d2110d596382d93563ce05d7276e") // Mock TXID
        } else {
          resolve({}) // Mock response for other methods
        }
      }, 500)
    })
  }
  // Simulate background message handling
  emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event](data)
    }
  }
}

// Mock ReadyPromise (simplified for this example; replace with actual implementation)
class ReadyPromise {
  private checks: boolean[] = []
  private requiredChecks: number
  constructor(requiredChecks: number) {
    this.requiredChecks = requiredChecks
    this.checks = new Array(requiredChecks).fill(false)
  }
  check(index: number) {
    this.checks[index] = true
  }
  uncheck(index: number) {
    this.checks[index] = false
  }
  async call<T>(fn: () => Promise<T>): Promise<T> {
    // Mock: Assume ready for simplicity
    return fn()
  }
}

// Constants
const OPENAPI_URL_MAINNET = "https://litescribe.io/api"
const OPENAPI_URL_TESTNET = "https://testnet.litescribe.io/api"
const VERSION = "0.1"
const CHANNEL = "LITESCRIBE"

// Types
interface OpenApiStore {
  host: string
  deviceId: string
}
enum API_STATUS {
  FAILED = -1,
  SUCCESS = 0,
}
interface ApiResponse {
  status: number
  message: string
  result: any // TXID (string) or other data
}
interface TxHistoryItem {
  txId: string
  amount: string
  confirmations: number
}
interface Balance {
  confirmed: number
  unconfirmed: number
  total: number
}
interface Inscription {
  inscriptionId: string
  inscriptionNumber: string
  address: string
  outputValue: string
  content: string
  contentLength: string
  contentType: string
  preview: string
  timestamp: number
  offset: number
  genesisTransaction: string
  location: string
}
interface InscriptionList {
  total: number
  list: Inscription[]
}

// OpenApiService for API calls
class OpenApiService {
  private store: OpenApiStore
  private clientAddress = ""
  private addressFlag = 0
  constructor() {
    // Use testnet or mainnet based on env
    const isTestnet = typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_TESTNET === "true";
    this.store = { host: isTestnet ? OPENAPI_URL_TESTNET : OPENAPI_URL_MAINNET, deviceId: randomstring.generate(12) }
  }
  async init(): Promise<void> {
    const isTestnet = typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_TESTNET === "true";
    this.store = await createPersistStore({
      name: "openapi",
      template: {
        host: isTestnet ? OPENAPI_URL_TESTNET : OPENAPI_URL_MAINNET,
        deviceId: randomstring.generate(12),
      },
    })
    // Set networkType based on env
    const networkType = isTestnet ? "TESTNET" : "MAINNET";
    this.store.host = networkType === "MAINNET" ? OPENAPI_URL_MAINNET : OPENAPI_URL_TESTNET
  }
  private async getRespData(res: Response): Promise<any> {
    if (!res) throw new Error("Network error, no response")
    if (res.status !== 200) throw new Error(`Network error with status: ${res.status}`)
    let jsonRes: ApiResponse
    try {
      jsonRes = await res.json()
    } catch (e) {
      throw new Error("Network error, json parse error")
    }
    if (!jsonRes) throw new Error("Network error, no response data")
    if (jsonRes.status === API_STATUS.FAILED) {
      throw new Error(jsonRes.message)
    }
    return jsonRes.result
  }
  private async httpPost(route: string, params: any): Promise<any> {
    const url = `${this.store.host}${route}`
    const headers = new Headers({
      "X-Client": "Litescribe Wallet",
      "X-Version": VERSION,
      "x-address": this.clientAddress,
      "x-flag": this.addressFlag.toString(),
      "x-channel": CHANNEL,
      "x-udid": this.store.deviceId,
      "Content-Type": "application/json;charset=utf-8",
    })
    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        mode: "cors",
        cache: "default",
        body: JSON.stringify(params),
      })
      return this.getRespData(res)
    } catch (e: any) {
      throw new Error(`Network error: ${e.message}`)
    }
  }
  private async httpGet(route: string, params: any): Promise<any> {
    let url = `${this.store.host}${route}`
    let c = 0
    for (const id in params) {
      url += c === 0 ? `?${id}=${params[id]}` : `&${id}=${params[id]}`
      c++
    }
    const headers = new Headers({
      "X-Client": "Litescribe Wallet",
      "X-Version": VERSION,
      "x-address": this.clientAddress,
      "x-flag": this.addressFlag.toString(),
      "x-channel": CHANNEL,
      "x-udid": this.store.deviceId,
    })
    try {
      const res = await fetch(url, { method: "GET", headers, mode: "cors", cache: "default" })
      return this.getRespData(res)
    } catch (e: any) {
      throw new Error(`Network error: ${e.message}`)
    }
  }
  async pushTx(rawtx: string): Promise<string> {
    return this.httpPost("/tx/broadcast", { rawtx })
  }
  async pushPsbt(psbtHex: string): Promise<string> {
    return this.httpPost("/tx/broadcast", { rawtx: psbtHex }) // Assuming PSBT is broadcasted similarly
  }
  async getAddressRecentHistory(address: string): Promise<TxHistoryItem[]> {
    return this.httpGet("/address/recent-history", { address })
  }
}

// PushEventHandlers for handling events
class PushEventHandlers {
  [key: string]: any;
  constructor(private provider: LitescribeProvider) {}
  accountsChanged(accounts: string[]) {
    this.provider.emit("accountsChanged", accounts)
  }
  networkChanged({ network }: { network: string }) {
    this.provider.emit("networkChanged", network)
  }
}

// LitescribeProvider implementing window.litescribe
class LitescribeProvider extends EventEmitter {
  private _selectedAddress: string | null = null
  private _network: string | null = null
  private _isConnected = false
  private _initialized = false
  private _isUnlocked = false
  private _state: {
    accounts: string[] | null
    isConnected: boolean
    isUnlocked: boolean
    initialized: boolean
    isPermanentlyDisconnected: boolean
  } = {
    accounts: null,
    isConnected: false,
    isUnlocked: false,
    initialized: false,
    isPermanentlyDisconnected: false,
  }
  private _pushEventHandlers: PushEventHandlers
  private _requestPromise: ReadyPromise
  private _bcm: BroadcastChannelMessage
  constructor({ maxListeners = 100 } = {}) {
    super()
    this.setMaxListeners(maxListeners)
    this._bcm = new BroadcastChannelMessage(CHANNEL)
    this._requestPromise = new ReadyPromise(2) // Assuming 2 checks for tabCheckin and visibility
    this._pushEventHandlers = new PushEventHandlers(this)
    this.initialize()
  }
  private async initialize(): Promise<void> {
    document.addEventListener("visibilitychange", this._requestPromiseCheckVisibility)
    this._bcm.connect().on("message", this._handleBackgroundMessage)
    // Mock tabCheckin (replace with actual logic)
    const origin = window.top?.location.origin || ""
    const icon = (document.querySelector('head > link[rel~="icon"]') as HTMLLinkElement)?.href || ""
    const name =
      document.title || (document.querySelector('head > meta[name="title"]') as HTMLMetaElement)?.content || origin
    this._bcm.request({ method: "tabCheckin", params: { icon, name, origin } })
    try {
      const { network, accounts, isUnlocked }: any = await this._request({ method: "getProviderState" })
      if (isUnlocked) {
        this._isUnlocked = true
        this._state.isUnlocked = true
      }
      this.emit("connect", {})
      this._pushEventHandlers.networkChanged({ network })
      this._pushEventHandlers.accountsChanged(accounts)
    } catch (e) {
      console.error("Initialization failed", e)
    } finally {
      this._initialized = true
      this._state.initialized = true
      this.emit("_initialized")
    }
    this.keepAlive()
  }
  private async keepAlive(): Promise<void> {
    try {
      await this._request({ method: "keepAlive", params: {} })
      setTimeout(() => this.keepAlive(), 1000)
    } catch (e) {
      console.error("Keep alive failed", e)
    }
  }
  private _requestPromiseCheckVisibility = () => {
    if (document.visibilityState === "visible") {
      this._requestPromise.check(1)
    } else {
      this._requestPromise.uncheck(1)
    }
  }
  private _handleBackgroundMessage = ({ event, data }: { event: string; data: any }) => {
    console.log(`[push event] ${event}`, data)
    if (this._pushEventHandlers[event]) {
      this._pushEventHandlers[event](data)
    }
    this.emit(event, data)
  }
  private async _request(data: any): Promise<any> {
    if (!data) {
      throw ethErrors.rpc.invalidRequest()
    }
    this._requestPromiseCheckVisibility()
    return this._requestPromise.call(async () => {
      console.log("[request]", JSON.stringify(data, null, 2))
      try {
        const res = await this._bcm.request(data)
        console.log("[request: success]", data.method, res)
        return res
      } catch (err: any) {
        console.log("[request: error]", data.method, serializeError(err))
        throw serializeError(err)
      }
    })
  }
  // Public Methods
  async requestAccounts(): Promise<string[]> {
    return this._request({ method: "requestAccounts" })
  }
  async getAccounts(): Promise<string[]> {
    return this._request({ method: "getAccounts" })
  }
  async getNetwork(): Promise<string> {
    return this._request({ method: "getNetwork" })
  }
  async switchNetwork(network: string): Promise<void> {
    return this._request({ method: "switchNetwork", params: { network } })
  }
  async getPublicKey(): Promise<string> {
    return this._request({ method: "getPublicKey" })
  }
  async getBalance(): Promise<Balance> {
    return this._request({ method: "getBalance" })
  }
  async getInscriptions(cursor = 0, size = 20): Promise<InscriptionList> {
    return this._request({ method: "getInscriptions", params: { cursor, size } })
  }
  async sendLitecoin(toAddress: string, satoshis: number, options?: { feeRate?: number }): Promise<string> {
    // Attempt to send via extension/provider
    const response = await this._request({
      method: "sendLitecoin",
      params: {
        toAddress,
        satoshis,
        feeRate: options?.feeRate,
        type: "SEND_LITECOIN",
      },
    });
    // If response is a valid TXID, return it
    if (typeof response === "string" && /^[a-f0-9]{64}$/i.test(response)) {
      return response;
    }
    // Fallback: try to find the TXID by polling recent transactions
    // (This should rarely be needed, but covers extension bugs)
    const openApiService = new OpenApiService();
    await openApiService.init();
    let attempts = 0;
    const maxAttempts = 10;
    const pollInterval = 2000;
    while (attempts < maxAttempts) {
      try {
        const history = await openApiService.getAddressRecentHistory(toAddress);
        const tx = history.find((item) => {
          // Match by amount (as string, in LTC)
          return (
            Math.abs(Number(item.amount) - satoshis / 1e8) < 0.00000001 &&
            typeof item.txId === "string" &&
            /^[a-f0-9]{64}$/i.test(item.txId)
          );
        });
        if (tx && tx.txId) {
          return tx.txId;
        }
      } catch (e) {
        // Ignore and retry
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      attempts++;
    }
    throw new Error(
      "The wallet did not return a valid transaction ID and it could not be found on the blockchain. Please check your wallet and try again."
    );
  }
  async sendInscription(
    toAddress: string,
    inscriptionId: string,
    options?: { feeRate?: number },
  ): Promise<{ txid: string }> {
    return this._request({
      method: "sendInscription",
      params: {
        toAddress,
        inscriptionId,
        feeRate: options?.feeRate,
        type: "SEND_INSCRIPTION",
      },
    })
  }
  async signMessage(text: string, type = "ecdsa"): Promise<string> {
    return this._request({ method: "signMessage", params: { text, type } })
  }
  async pushTx(rawtx: string): Promise<string> {
    return this._request({ method: "pushTx", params: { rawtx } })
  }
  async signPsbt(psbtHex: string, options?: any): Promise<string> {
    return this._request({ method: "signPsbt", params: { psbtHex, type: "SIGN_TX", options } })
  }
  async pushPsbt(psbtHex: string): Promise<string> {
    return this._request({ method: "pushPsbt", params: { psbtHex } })
  }
}

// Broadcast transaction with TXID retrieval and UI handling
async function broadcastTransaction(
  rawtx: string,
  paymentAddress: string,
  expectedAmount: string,
  maxAttempts = 10,
  pollInterval = 1000,
): Promise<string> {
  const openApiService = new OpenApiService()
  await openApiService.init()
  const button = document.getElementById("sendButton") as HTMLButtonElement
  const loading = document.getElementById("loading") as HTMLElement
  button.disabled = true
  button.textContent = "Processing..."
  loading.style.display = "block"
  try {
    // Step 1: Try broadcasting via pushTx
    let txId: string
    try {
      txId = await window.litescribe.pushTx(rawtx)
      if (txId) {
        console.log(`Transaction broadcasted successfully: ${txId}`)
        return txId
      } else {
        console.warn("TXID not returned, initiating polling...")
      }
    } catch (e: any) {
      console.error(`Broadcast failed: ${e.message}`)
      throw new Error(`Failed to broadcast transaction: ${e.message}`)
    }
    // Step 2: Fallback polling with /address/recent-history
    let attempts = 0
    while (attempts < maxAttempts) {
      try {
        const history = await openApiService.getAddressRecentHistory(paymentAddress)
        const tx = history.find((item) => Number.parseFloat(item.amount) === Number.parseFloat(expectedAmount))
        if (tx && tx.txId) {
          console.log(`TXID found via history: ${tx.txId}`)
          return tx.txId
        }
      } catch (e: any) {
        console.warn(`History check failed: ${e.message}`)
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval))
      attempts++
    }
    throw new Error("TXID not found after polling")
  } catch (e: any) {
    alert(`Error: ${e.message}`)
    throw e
  } finally {
    button.disabled = false
    button.textContent = "Send Transaction"
    loading.style.display = "none"
  }
}

// Debounce function to prevent multiple clicks
function debounce(func: (...args: any[]) => Promise<any>, wait: number) {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = async () => {
      clearTimeout(timeout)
      await func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Initialize Litescribe provider
// Only run this in the browser (client-side)
if (typeof window !== "undefined" && typeof document !== "undefined") {
const provider = new LitescribeProvider()
if (!window.litescribe) {
  window.litescribe = new Proxy(provider, { deleteProperty: () => true })
  Object.defineProperty(window, "litescribe", {
    value: new Proxy(provider, { deleteProperty: () => true }),
    writable: false,
  })
}
window.dispatchEvent(new Event("litescribe#initialized"))

// Example usage with event listeners and UI
document.addEventListener("DOMContentLoaded", () => {
  // Event listeners
  window.litescribe.on("accountsChanged", (accounts: string[]) => {
    console.log("Accounts changed:", accounts)
  })
  window.litescribe.on("networkChanged", (network: string) => {
    console.log("Network changed:", network)
  })

  // Button for broadcasting transaction
  const button = document.getElementById("sendButton") as HTMLButtonElement
  if (button) {
    button.addEventListener(
      "click",
      debounce(async () => {
        const rawtx = "0200000000010135bd7d..." // Replace with actual raw transaction
        const paymentAddress = "Lc5bWY7WtVXX7HuAURJdQgfqXzbohnVQgh"
        const expectedAmount = "1.01" // Expected LTC amount
        try {
          const txId = await broadcastTransaction(rawtx, paymentAddress, expectedAmount)
          alert(`Transaction successful: ${txId}`)
        } catch (e) {
          console.error(e)
        }
      }, 500),
    )
  }

  // Example: Connect and fetch balance
  async function initWallet() {
    try {
      const accounts = await window.litescribe.requestAccounts()
      console.log("Connected accounts:", accounts)
      const balance = await window.litescribe.getBalance()
      console.log("Balance:", balance)
      const inscriptions = await window.litescribe.getInscriptions(0, 10)
      console.log("Inscriptions:", inscriptions)
    } catch (e) {
      console.error("Wallet initialization failed:", e)
    }
  }
  initWallet()
})
}
