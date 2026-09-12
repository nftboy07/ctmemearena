import { NextResponse } from "next/server";
import { currentWallet } from "@/lib/auth";
import { dbEnabled, query } from "@/lib/db";

export const runtime = "nodejs";
const QUESTS = [
  { key: "three_trades", title: "MAKE 3 TRADES", target: 3, reward: 150 },
  { key: "runner", title: "FIND A 5% RUNNER", target: 1, reward: 100 },
  { key: "shill", title: "POST A SHILL", target: 1, reward: 200 },
];

export async function GET() {
  const wallet = await currentWallet();
  if (!wallet) return NextResponse.json({ error: "Wallet authentication required" }, { status: 401 });
  if (!dbEnabled()) return NextResponse.json({ season: 1, quests: QUESTS.map((q) => ({ ...q, progress: 0, completed: false })) });
  const season = await query<{ id: string; season_no: number }>("SELECT id, season_no FROM seasons WHERE active=true ORDER BY season_no DESC LIMIT 1");
  if (!season.rowCount) return NextResponse.json({ season: null, quests: [] });
  const progress = await query<{ quest_key: string; progress: number; completed: boolean }>("SELECT quest_key, progress, completed FROM quest_progress WHERE wallet=$1 AND season_id=$2", [wallet, season.rows[0].id]);
  const map = new Map(progress.rows.map((p) => [p.quest_key, p]));
  return NextResponse.json({ season: season.rows[0].season_no, quests: QUESTS.map((q) => ({ ...q, progress: map.get(q.key)?.progress ?? 0, completed: map.get(q.key)?.completed ?? false })) });
}
