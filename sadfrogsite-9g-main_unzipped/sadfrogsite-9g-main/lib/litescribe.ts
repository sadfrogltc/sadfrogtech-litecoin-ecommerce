import type { Order } from "@/types"

// Use both environment variables to ensure compatibility
const ADMIN_LTC_ADDRESS = process.env.ADMIN_LTC_ADDRESS || process.env.NEXT_PUBLIC_ADMIN_LTC_ADDRESS
export const REQUIRED_CONFIRMATIONS = 3

console.log(`[Litescribe] Initialized with admin address: ${ADMIN_LTC_ADDRESS ? "Set" : "NOT SET"}`)

// --- Primary Provider: Litecoinspace ---

async function findTxWithLitecoinspace(order: Order): Promise<{ txId: string; satoshis: number; confirmed: boolean } | null> {
  const expectedSatoshis = Math.round(order.totalLTC * 100_000_000);
  const tolerance = 2;

  // Helper to search a list of txs for a match to admin address and amount
  const searchTxs = (transactions: any[], confirmed: boolean, sender?: string) => {
    let bestMatch: { txid: string; value: number; diff: number; sender?: string } | null = null;
    for (const tx of transactions) {
      if (tx.vout && Array.isArray(tx.vout)) {
        for (const output of tx.vout) {
          if (output.scriptpubkey_address === ADMIN_LTC_ADDRESS) {
            const diff = Math.abs(output.value - expectedSatoshis);
            if (diff <= tolerance) {
              // If sender is specified, check that input matches
              if (sender) {
                if (tx.vin && Array.isArray(tx.vin) && tx.vin.some((vin: any) => vin.prevout && vin.prevout.scriptpubkey_address === sender)) {
                  if (!bestMatch || diff < bestMatch.diff) {
                    bestMatch = { txid: tx.txid, value: output.value, diff, sender };
                  }
                }
              } else {
                // No sender specified, fallback to any match
                if (!bestMatch || diff < bestMatch.diff) {
                  bestMatch = { txid: tx.txid, value: output.value, diff };
                }
              }
            }
          }
        }
      }
    }
    if (bestMatch) return { txId: bestMatch.txid, satoshis: bestMatch.value, confirmed };
    return null;
  };

  // 1. Try sender address if present
  if (order.senderAddress) {
    try {
      const url = `https://litecoinspace.org/api/address/${order.senderAddress}/txs`;
      const response = await fetch(url, { headers: { "User-Agent": "SadFrogTech-Ecommerce/1.0" }, signal: AbortSignal.timeout(10000) });
      if (response.ok) {
        const transactions = await response.json();
        const match = searchTxs(transactions, true, order.senderAddress);
        if (match) {
          console.log(`[Litescribe:LS] Matched tx from sender address: ${order.senderAddress}`);
          return match;
        }
      }
    } catch (e) {}
    try {
      const url = `https://litecoinspace.org/api/address/${order.senderAddress}/txs/mempool`;
      const response = await fetch(url, { headers: { "User-Agent": "SadFrogTech-Ecommerce/1.0" }, signal: AbortSignal.timeout(10000) });
      if (response.ok) {
        const transactions = await response.json();
        const match = searchTxs(transactions, false, order.senderAddress);
        if (match) {
          console.log(`[Litescribe:LS] Matched mempool tx from sender address: ${order.senderAddress}`);
          return match;
        }
      }
    } catch (e) {}
    console.log(`[Litescribe:LS] No tx found for sender address: ${order.senderAddress}, falling back to admin address search.`);
  }

  // 2. Fallback: search all recent txs to admin address (regardless of sender)
  try {
    const url = `https://litecoinspace.org/api/address/${ADMIN_LTC_ADDRESS}/txs`;
    const response = await fetch(url, { headers: { "User-Agent": "SadFrogTech-Ecommerce/1.0" }, signal: AbortSignal.timeout(10000) });
    if (response.ok) {
      const transactions = await response.json();
      const match = searchTxs(transactions, true);
      if (match) {
        console.log(`[Litescribe:LS] Fallback: matched tx to admin address (any sender).`);
        return match;
      }
    }
  } catch (e) {}
  try {
    const url = `https://litecoinspace.org/api/address/${ADMIN_LTC_ADDRESS}/txs/mempool`;
    const response = await fetch(url, { headers: { "User-Agent": "SadFrogTech-Ecommerce/1.0" }, signal: AbortSignal.timeout(10000) });
    if (response.ok) {
      const transactions = await response.json();
      const match = searchTxs(transactions, false);
      if (match) {
        console.log(`[Litescribe:LS] Fallback: matched mempool tx to admin address (any sender).`);
        return match;
      }
    }
  } catch (e) {}

  return null;
}

async function getConfirmationsWithLitecoinspace(txId: string): Promise<number | null> {
  console.log(`[Confirmations:LS] Attempting for ${txId}...`)
  try {
    const txUrl = `https://litecoinspace.org/api/tx/${txId}`
    const txResponse = await fetch(txUrl, {
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })
    if (!txResponse.ok) throw new Error(`API returned non-OK status: ${txResponse.status}`)

    const txData = await txResponse.json()
    if (!txData.status.confirmed) {
      console.log(`[Confirmations:LS] Tx ${txId} is unconfirmed.`)
      return 0
    }

    const blockHeight = txData.status.block_height
    const tipUrl = `https://litecoinspace.org/api/blocks/tip/height`
    const tipResponse = await fetch(tipUrl, {
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })
    if (!tipResponse.ok) throw new Error("Could not fetch tip height")

    const tipHeight = await tipResponse.json()
    if (typeof tipHeight !== "number" || typeof blockHeight !== "number") {
      throw new Error("Invalid height data from API")
    }

    const confirmations = tipHeight - blockHeight + 1
    console.log(`[Confirmations:LS] Tx ${txId} has ${confirmations} confirmations.`)
    return confirmations
  } catch (error) {
    console.warn(`[Confirmations:LS] Failed for ${txId}:`, error)
    return null
  }
}

// --- Fallback Provider: Blockchair ---

async function findTxWithBlockchair(order: Order): Promise<{ txId: string; satoshis: number } | null> {
  if (!order.senderAddress) {
    console.log(`[Litescribe:BC] No sender address for order ${order.id}, skipping Blockchair search.`)
    return null
  }

  const expectedSatoshis = Math.round(order.totalLTC * 100_000_000)
  console.log(`[Litescribe:BC] Searching for tx from ${order.senderAddress} for ${expectedSatoshis} sats.`)

  try {
    const url = `https://api.blockchair.com/litecoin/dashboards/address/${order.senderAddress}?limit=25`
    const response = await fetch(url, {
      headers: { "User-Agent": "SadFrogTech-Ecommerce/1.0" },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })
    if (!response.ok) {
      if (response.status === 404) return null // No history for address
      throw new Error(`API returned non-OK status: ${response.status}`)
    }

    const data = await response.json()
    const transactions = data?.data?.[order.senderAddress]?.transactions
    if (!Array.isArray(transactions)) return null

    for (const tx_hash of transactions) {
      const txDetailsUrl = `https://api.blockchair.com/litecoin/dashboards/transaction/${tx_hash}`
      const txDetailsResponse = await fetch(txDetailsUrl, {
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })
      if (!txDetailsResponse.ok) continue

      const txDetailsData = await txDetailsResponse.json()
      const outputs = txDetailsData?.data?.[tx_hash]?.outputs
      if (!Array.isArray(outputs)) continue

      const matchingOutput = outputs.find(
        (output: any) => output.recipient === ADMIN_LTC_ADDRESS && output.value === expectedSatoshis,
      )
      if (matchingOutput) {
        console.log(`[Litescribe:BC] SUCCESS: Found matching tx: ${tx_hash} for order ${order.id}`)
        return { txId: tx_hash, satoshis: expectedSatoshis }
      }
    }
    console.log(`[Litescribe:BC] No matching transaction found for order ${order.id}.`)
    return null
  } catch (error) {
    console.warn("[Litescribe:BC] Failed to find transaction with Blockchair:", error)
    return null
  }
}

async function getConfirmationsWithBlockchair(txId: string): Promise<number | null> {
  console.log(`[Confirmations:BC] Attempting for ${txId}...`)
  try {
    const url = `https://api.blockchair.com/litecoin/dashboards/transaction/${txId}`
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })
    if (!response.ok) throw new Error(`API returned non-OK status: ${response.status}`)
    const data = await response.json()
    const confirmations = data?.data?.[txId]?.transaction?.confirmations
    if (typeof confirmations === "number") {
      console.log(`[Confirmations:BC] Tx ${txId} has ${confirmations} confirmations.`)
      return confirmations
    }
    return null
  } catch (error) {
    console.warn(`[Confirmations:BC] Failed for ${txId}:`, error)
    return null
  }
}

// --- Aggregator Functions ---

export async function findTransactionForOrder(order: Order): Promise<{ txId: string; satoshis: number } | null> {
  if (!ADMIN_LTC_ADDRESS) {
    console.error("[Litescribe] FATAL: ADMIN_LTC_ADDRESS is not configured.")
    return null
  }

  console.log(`[Litescribe] Starting transaction search for order ${order.id} with admin address: ${ADMIN_LTC_ADDRESS}`)

  // Try both providers
  const tx = (await findTxWithLitecoinspace(order)) || (await findTxWithBlockchair(order))

  if (tx) {
    console.log(`[Litescribe] Found transaction ${tx.txId} for order ${order.id}.`)
  } else {
    console.log(`[Litescribe] No transaction found for order ${order.id} yet.`)
  }
  return tx
}

export async function getTransactionConfirmations(txId: string): Promise<number> {
  console.log(`[Confirmations] Getting confirmations for tx: ${txId}`)

  const confirmations = (await getConfirmationsWithLitecoinspace(txId)) ?? (await getConfirmationsWithBlockchair(txId))

  if (confirmations !== null) {
    console.log(`[Confirmations] Found ${confirmations} confirmations for ${txId}.`)
    return confirmations
  }

  console.error(`[Confirmations] All providers failed to get confirmations for tx: ${txId}. Returning 0.`)
  return 0
}

export { findTxWithLitecoinspace };
