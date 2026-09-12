import { NextResponse } from "next/server";
import { providerConfig } from "@/lib/providers";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "ct-meme-arena",
    mode: process.env.LIVE_TRADING_ENABLED === "true" ? "live" : "live-market/paper-trading",
    liveTrading: process.env.LIVE_TRADING_ENABLED === "true" && Boolean(process.env.GMGN_API_KEY),
    providers: providerConfig,
  });
}
