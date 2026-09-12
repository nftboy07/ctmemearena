import { NextResponse } from "next/server";
import { currentWallet } from "@/lib/auth";
import { dbEnabled, query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const wallet = await currentWallet();
  if (!wallet) return NextResponse.json({ error: "Wallet authentication required" }, { status: 401 });
  if (!dbEnabled()) return NextResponse.json({ trades: [] });
  const result = await query(`SELECT id, token_id, token_address, side, amount_raw, quote_raw, price, status, tx_hash, created_at FROM trades WHERE wallet=$1 ORDER BY created_at DESC LIMIT 100`, [wallet]);
  return NextResponse.json({ trades: result.rows });
}
