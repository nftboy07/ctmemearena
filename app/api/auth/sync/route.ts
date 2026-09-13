import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { currentPrivyUser, currentUser } from "@/lib/auth";
import { dbEnabled, query } from "@/lib/db";

export const runtime = "nodejs";
const COOKIE = "ctarena_session";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function POST() {
  const current = await currentPrivyUser();
  if (!current) return NextResponse.json({ error: "Privy authentication required" }, { status: 401 });
  if (!dbEnabled()) return NextResponse.json({ authenticated: true, privyUserId: current.user_id, wallet: null, synced: false });

  const identity = await currentUser();
  const wallet = identity?.wallet ?? null;

  // Social/email login is valid without a user-supplied wallet. Privy may create
  // the embedded Solana wallet asynchronously; a later sync will attach it.
  if (!wallet) {
    return NextResponse.json({ authenticated: true, privyUserId: current.user_id, wallet: null, synced: false });
  }

  const session = randomBytes(32).toString("base64url");
  await query(`UPDATE wallet_sessions SET revoked_at=NOW() WHERE wallet=$1 AND revoked_at IS NULL`, [wallet]);
  await query(`INSERT INTO wallet_sessions(token_hash,wallet,expires_at) VALUES($1,$2,NOW()+INTERVAL '24 hours')`, [hash(session), wallet]);

  const response = NextResponse.json({ authenticated: true, wallet, privyUserId: current.user_id, synced: true });
  response.cookies.set(COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60,
  });
  return response;
}
