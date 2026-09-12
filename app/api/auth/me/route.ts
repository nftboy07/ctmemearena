import { NextResponse } from "next/server";
import { currentWallet } from "@/lib/auth";
import { dbEnabled, query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const wallet = await currentWallet();
  if (!wallet) return NextResponse.json({ authenticated: false }, { status: 401 });
  if (!dbEnabled()) return NextResponse.json({ authenticated: true, wallet });
  const result = await query<{ wallet: string; display_name: string | null; xp: string; season_xp: string; level: number }>("SELECT wallet, display_name, xp, season_xp, level FROM users WHERE wallet=$1", [wallet]);
  return NextResponse.json({ authenticated: true, user: result.rows[0] ?? { wallet } });
}
