import { NextResponse } from "next/server";
import { currentWallet } from "@/lib/auth";
import { dbEnabled, query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  if (!dbEnabled()) return NextResponse.json({ events: [] });
  const result = await query(`SELECT id, wallet, event_type, payload, created_at FROM arena_events ORDER BY created_at DESC LIMIT 100`);
  return NextResponse.json({ events: result.rows });
}

export async function POST(request: Request) {
  const wallet = await currentWallet();
  if (!wallet) return NextResponse.json({ error: "Wallet authentication required" }, { status: 401 });
  if (!dbEnabled()) return NextResponse.json({ error: "DATABASE_URL is required" }, { status: 503 });
  const body = await request.json();
  const eventType = String(body.eventType || "activity").slice(0, 80);
  const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
  await query("INSERT INTO arena_events (wallet,event_type,payload) VALUES ($1,$2,$3::jsonb)", [wallet, eventType, JSON.stringify(payload)]);
  return NextResponse.json({ ok: true });
}
