import { NextRequest, NextResponse } from "next/server";

const GMGN_BASE = "https://gmgn.ai/defi/router/v1/sol/tx";

export async function POST(request: NextRequest) {
  if (process.env.LIVE_TRADING_ENABLED !== "true") return NextResponse.json({ error: "Live trading is disabled. Set LIVE_TRADING_ENABLED=true after testing." }, { status: 403 });
  if (!process.env.GMGN_API_KEY) return NextResponse.json({ error: "GMGN_API_KEY is not configured" }, { status: 503 });
  try {
    const body = await request.json() as { tokenIn: string; tokenOut: string; amount: string; fromAddress: string; slippage?: number; antiMev?: boolean; fee?: number };
    if (!body.tokenIn || !body.tokenOut || !body.amount || !body.fromAddress) return NextResponse.json({ error: "tokenIn, tokenOut, amount and fromAddress are required" }, { status: 400 });
    const amount = BigInt(body.amount);
    if (amount <= 0n) return NextResponse.json({ error: "amount must be positive" }, { status: 400 });
    const slippage = Math.max(0.1, Math.min(50, Number(body.slippage ?? 10)));
    const url = new URL(`${GMGN_BASE}/get_swap_route`);
    url.searchParams.set("token_in_address", body.tokenIn);
    url.searchParams.set("token_out_address", body.tokenOut);
    url.searchParams.set("in_amount", amount.toString());
    url.searchParams.set("from_address", body.fromAddress);
    url.searchParams.set("slippage", String(slippage));
    url.searchParams.set("swap_mode", "ExactIn");
    if (body.antiMev) url.searchParams.set("is_anti_mev", "true");
    if (body.fee !== undefined) url.searchParams.set("fee", String(Math.max(0, body.fee)));
    const response = await fetch(url, { headers: { "x-route-key": process.env.GMGN_API_KEY }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok || data.code !== 0) return NextResponse.json({ error: "GMGN route request failed", details: data }, { status: response.status || 502 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "route request failed" }, { status: 500 });
  }
}
