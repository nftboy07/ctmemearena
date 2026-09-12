import { NextResponse } from "next/server";
import { dbEnabled, query } from "@/lib/db";
import { providerConfig } from "@/lib/providers";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const checks: Record<string, string> = { app: "ok" };
  let healthy = true;
  if (dbEnabled()) { try { await query("SELECT 1"); checks.database = "ok"; } catch { checks.database = "error"; healthy = false; } } else checks.database = "not-configured";
  checks.redis = process.env.REDIS_URL ? "configured" : "not-configured";
  checks.privy = process.env.PRIVY_APP_ID && process.env.PRIVY_APP_SECRET ? "configured" : "not-configured";
  checks.gmgn = process.env.GMGN_API_KEY ? "configured" : "not-configured";
  checks.trading = process.env.LIVE_TRADING_ENABLED === "true" ? "enabled" : "disabled";
  return NextResponse.json({ status: healthy ? "ok" : "degraded", checks, providers: providerConfig, timestamp: new Date().toISOString() }, { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
