import { NextRequest, NextResponse } from "next/server";
import { currentWallet } from "@/lib/auth";
import { dbEnabled, query } from "@/lib/db";
function rpcUrl() { if (process.env.ALCHEMY_API_KEY) return `https://solana-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`; return process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com"; }
export async function GET(request: NextRequest) {
  const hash = request.nextUrl.searchParams.get("hash");
  if (!hash || !/^[1-9A-HJ-NP-Za-km-z]{32,100}$/.test(hash)) return NextResponse.json({ error: "valid Solana transaction hash is required" }, { status: 400 });
  const wallet = await currentWallet();
  if (!wallet) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (dbEnabled()) {
    const owned = await query<{ id: string }>(`SELECT id FROM trades WHERE tx_hash=$1 AND wallet=$2 LIMIT 1`, [hash, wallet]);
    if (!owned.rowCount) return NextResponse.json({ error: "Transaction not found for authenticated wallet" }, { status: 404 });
  }
  try {
    const response = await fetch(rpcUrl(), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getSignatureStatuses", params: [[hash], { searchTransactionHistory: true }] }), cache: "no-store" });
    const data = await response.json();
    if (!response.ok || data.error) return NextResponse.json({ error: data.error?.message ?? "status lookup failed" }, { status: 502 });
    const status = data.result?.value?.[0];
    return NextResponse.json({ hash, confirmed: Boolean(status), confirmationStatus: status?.confirmationStatus ?? null, slot: status?.slot ?? null, err: status?.err ?? null });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "status lookup failed" }, { status: 502 }); }
}
