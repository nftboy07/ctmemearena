import { NextResponse } from "next/server";
import { dbEnabled, query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  if (!dbEnabled()) return NextResponse.json({ season: 1, leaderboard: [] });
  const season = await query<{ season_no: number }>("SELECT season_no FROM seasons WHERE active=true ORDER BY season_no DESC LIMIT 1");
  const rows = await query<{ wallet: string; display_name: string | null; season_xp: string; level: number }>(`SELECT wallet, display_name, season_xp, level FROM users ORDER BY season_xp DESC, updated_at ASC LIMIT 100`);
  return NextResponse.json({ season: season.rows[0]?.season_no ?? 1, leaderboard: rows.rows.map((r, i) => ({ rank: i + 1, ...r })) });
}
