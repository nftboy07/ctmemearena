import { NextRequest, NextResponse } from "next/server";

function rpcUrl() {
  if (process.env.ALCHEMY_API_KEY) return `https://solana-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
  return process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
}

async function rpc(method: string, params: unknown[]) {
  const response = await fetch(rpcUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });
  const body = await response.json();
  if (!response.ok || body.error) throw new Error(body.error?.message ?? `RPC ${response.status}`);
  return body.result;
}

export async function GET(request: NextRequest) {
  const owner = request.nextUrl.searchParams.get("owner");
  if (!owner) return NextResponse.json({ error: "owner is required" }, { status: 400 });
  try {
    const [balance, tokenAccounts] = await Promise.all([
      rpc("getBalance", [owner, { commitment: "confirmed" }]),
      rpc("getTokenAccountsByOwner", [owner, { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }, { encoding: "jsonParsed", commitment: "confirmed" }]),
    ]);
    const tokens = (tokenAccounts.value ?? []).map((item: any) => {
      const info = item.account?.data?.parsed?.info;
      const tokenAmount = info?.tokenAmount;
      return { mint: info?.mint, rawAmount: tokenAmount?.amount ?? "0", decimals: tokenAmount?.decimals ?? 0, amount: tokenAmount?.uiAmount ?? 0 };
    }).filter((x: any) => x.mint && Number(x.amount) > 0);
    return NextResponse.json({ owner, sol: Number(balance.value ?? 0) / 1e9, lamports: balance.value, tokens });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "wallet lookup failed" }, { status: 502 });
  }
}
