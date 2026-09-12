import { NextResponse } from "next/server";
import { dbEnabled } from "@/lib/db";
import { providerConfig } from "@/lib/providers";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "ct-meme-arena",
    mode: process.env.LIVE_TRADING_ENABLED === "true" ? "live" : "live-market/paper-trading",
    liveTrading: process.env.LIVE_TRADING_ENABLED === "true" && Boolean(process.env.GMGN_API_KEY),
    persistence: dbEnabled() ? "postgres-configured" : "not-configured",
    realtime: process.env.REDIS_URL ? "redis-configured" : "not-configured",
    providers: providerConfig,
  }, { headers: { "Cache-Control": "no-store" } });
}
