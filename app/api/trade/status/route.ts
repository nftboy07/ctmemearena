import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!process.env.GMGN_API_KEY) return NextResponse.json({ error: "GMGN_API_KEY is not configured" }, { status: 503 });
  const hash = request.nextUrl.searchParams.get("hash");
  const lastValidHeight = request.nextUrl.searchParams.get("last_valid_height");
  if (!hash || !lastValidHeight) return NextResponse.json({ error: "hash and last_valid_height are required" }, { status: 400 });
  const url = new URL("https://gmgn.ai/defi/router/v1/sol/tx/get_transaction_status");
  url.searchParams.set("hash", hash);
  url.searchParams.set("last_valid_height", lastValidHeight);
  const response = await fetch(url, { headers: { "x-route-key": process.env.GMGN_API_KEY }, cache: "no-store" });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
