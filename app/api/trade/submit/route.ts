import { NextRequest, NextResponse } from "next/server";

function rpcUrl() {
  if (process.env.ALCHEMY_API_KEY) return `https://solana-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
  return process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
}

export async function POST(request: NextRequest) {
  if (process.env.LIVE_TRADING_ENABLED !== "true") return NextResponse.json({ error: "Live trading is disabled" }, { status: 403 });
  try {
    const body = await request.json() as { signedTx?: string };
    if (!body.signedTx) return NextResponse.json({ error: "signedTx is required" }, { status: 400 });
    const response = await fetch(rpcUrl(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "sendTransaction", params: [body.signedTx, { encoding: "base64", skipPreflight: false, preflightCommitment: "confirmed", maxRetries: 3 }] }),
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok || data.error) return NextResponse.json({ error: data.error?.message ?? "transaction submission failed", details: data.error }, { status: 502 });
    return NextResponse.json({ hash: data.result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "submission failed" }, { status: 500 });
  }
}
