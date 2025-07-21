import { randomUUID } from "crypto"

const RPC_USER = process.env.LTC_RPC_USER;
const RPC_PASS = process.env.LTC_RPC_PASS;
const RPC_HOST = process.env.LTC_RPC_HOST;
const RPC_PORT = process.env.LTC_RPC_PORT;
const RPC_WALLET = process.env.LTC_RPC_WALLET;

if (!RPC_USER || !RPC_PASS || !RPC_HOST || !RPC_PORT || !RPC_WALLET) {
  throw new Error("Litecoin RPC credentials are not fully set in environment variables.");
}

const RPC_URL = `http://${RPC_HOST}:${RPC_PORT}/wallet/${RPC_WALLET}`

async function rpcCall(method: string, params: any[] = []) {
  // Create base64 encoded credentials
  const credentials = Buffer.from(`${RPC_USER}:${RPC_PASS}`).toString('base64')
  console.log(`[LTC RPC] Calling method: ${method} with params:`, params)
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Basic ${credentials}`
    },
    body: JSON.stringify({
      jsonrpc: "1.0",
      id: randomUUID(),
      method,
      params,
    }),
  })
  const data = await res.json()
  console.log(`[LTC RPC] Response for ${method}:`, JSON.stringify(data, null, 2))
  if (data.error) {
    console.error(`[LTC RPC] Error:`, data.error)
    throw new Error(data.error.message)
  }
  return data.result
}

export async function getNewLtcAddress(label?: string): Promise<string> {
  return rpcCall("getnewaddress", [label || ""])
}

export async function getReceivedByAddress(address: string, minconf = 1): Promise<number> {
  return rpcCall("getreceivedbyaddress", [address, minconf])
} 

// Returns the number of confirmations for the latest transaction to the address
export async function getAddressConfirmations(address: string): Promise<number> {
  // Use listreceivedbyaddress to check for txids
  const results = await rpcCall("listreceivedbyaddress", [0, false, true, address]);
  if (results && results.length > 0 && results[0].txids && results[0].txids.length > 0) {
    const txid = results[0].txids[0];
    const tx = await rpcCall("gettransaction", [txid]);
    return tx.confirmations || 0;
  }
  return 0; // No txids, so no confirmations
} 

// Returns the list of txids for a given address using listreceivedbyaddress
export async function getAddressTransactions(address: string, minconf = 0): Promise<string[]> {
  // This uses listreceivedbyaddress to get txids and details
  const results = await rpcCall("listreceivedbyaddress", [minconf, false, true, address])
  if (results && results.length > 0) {
    console.log(`[LTC RPC] listreceivedbyaddress for ${address}:`, results[0])
    return results[0].txids || []
  }
  return []
} 