import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { currentPrivyUser } from "@/lib/auth";
import { dbEnabled, query } from "@/lib/db";

export const runtime = "nodejs";
const COOKIE = "ctarena_session";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function POST() {
  const current = await currentPrivyUser();
  if (!current) return NextResponse.json({ error: "Privy authentication required" }, { status: 401 });
  if (!dbEnabled()) return NextResponse.json({ error: "DATABASE_URL is required" }, { status: 503 });
  const { user, wallet } = await import("@/lib/auth").then((m) => m.currentUser());
  if (!user || !wallet) return NextResponse.json({ error: "A Solana wallet is required for trading" }, { status: 409 });
  const session = randomBytes(32).toString("base64url");
  await query(`INSERT INTO wallet_sessions (token_hash,wallet,expires_at) VALUES ($1,$2,NOW()+INTERVAL '30 days')`, [hash(session), wallet]);
  const response = NextResponse.json({ authenticated: true, wallet, privyUserId: current.user_id });
  response.cookies.set(COOKIE, session, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 24 * 60 * 60 });
  return response;
}
