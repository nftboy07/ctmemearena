import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!process.env.GMGN_API_KEY) return NextResponse.json({ error: "GMGN_API_KEY is not configured" }, { status: 503 });
  try {
    const body = await request.json() as { signedTx?: string; antiMev?: boolean };
    if (!body.signedTx) return NextResponse.json({ error: "signedTx is required" }, { status: 400 });
    const response = await fetch("https://gmgn.ai/defi/router/v1/sol/tx/submit_signed_transaction", {
      method: "POST",
      headers: { "content-type": "application/json", "x-route-key": process.env.GMGN_API_KEY },
      body: JSON.stringify({ chain: "sol", signedTx: body.signedTx, isAntiMev: Boolean(body.antiMev) }),
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: "GMGN submission failed", details: data }, { status: response.status });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "submission failed" }, { status: 500 });
  }
}
