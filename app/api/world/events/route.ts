import { NextRequest, NextResponse } from "next/server";
import { dbEnabled, query } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  if (!dbEnabled()) return NextResponse.json({ events: [] });
  const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 40)));
  const result = await query<{ id:string; wallet:string|null; event_type:string; payload:any; created_at:string }>(`SELECT id,wallet,event_type,payload,created_at FROM arena_events ORDER BY created_at DESC LIMIT $1`, [limit]);
  return NextResponse.json({ events: result.rows }, { headers: { "Cache-Control": "no-store" } });
}
