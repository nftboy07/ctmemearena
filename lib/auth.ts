import { cookies, headers } from "next/headers";
import { createHash } from "node:crypto";
import { PrivyClient } from "@privy-io/node";
import { dbEnabled, query } from "@/lib/db";

const PRIVY_COOKIE = "privy-token";
const ARENA_COOKIE = "ctarena_session";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

function appId() {
  const id = process.env.NEXT_PUBLIC_PRIVY_APP_ID || process.env.PRIVY_APP_ID;
  if (!id) throw new Error("NEXT_PUBLIC_PRIVY_APP_ID is not configured");
  return id;
}
function client() {
  const secret = process.env.PRIVY_APP_SECRET;
  if (!secret) throw new Error("PRIVY_APP_SECRET is not configured");
  return new PrivyClient({ appId: appId(), appSecret: secret });
}
async function tokenFromRequest() {
  const authorization = (await headers()).get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7);
  return (await cookies()).get(PRIVY_COOKIE)?.value ?? null;
}
export async function currentPrivyUser() {
  const token = await tokenFromRequest();
  if (!token) return null;
  try { return await client().utils().auth().verifyAuthToken(token); } catch { return null; }
}
export async function currentUser() {
  const claims = await currentPrivyUser();
  if (!claims) return null;
  const user = await client().users()._get(claims.user_id);
  const wallet = user.linked_accounts.find((account) => account.type === "wallet" && "chain_type" in account && account.chain_type === "solana");
  const email = user.linked_accounts.find((account) => account.type === "email");
  const google = user.linked_accounts.find((account) => account.type === "google_oauth");
  const twitter = user.linked_accounts.find((account) => account.type === "twitter_oauth");
  return { claims, user, wallet: wallet && "address" in wallet ? wallet.address : null, walletId: wallet && "id" in wallet ? wallet.id : null, email: email && "address" in email ? email.address : null, google: google && "subject" in google ? google.subject : null, twitter: twitter && "subject" in twitter ? twitter.subject : null };
}
export async function currentWallet() {
  const current = await currentUser();
  if (current?.wallet) {
    if (dbEnabled()) await query(`INSERT INTO users (privy_user_id,wallet,email,google_subject,twitter_subject) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (privy_user_id) DO UPDATE SET wallet=EXCLUDED.wallet,email=EXCLUDED.email,google_subject=EXCLUDED.google_subject,twitter_subject=EXCLUDED.twitter_subject,updated_at=NOW()`, [current.claims.user_id, current.wallet, current.email, current.google, current.twitter]);
    return current.wallet;
  }
  if (!dbEnabled()) return null;
  const session = (await cookies()).get(ARENA_COOKIE)?.value;
  if (!session) return null;
  const result = await query<{ wallet: string }>(`SELECT wallet FROM wallet_sessions WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at>NOW()`, [hash(session)]);
  return result.rows[0]?.wallet ?? null;
}
export async function requireWallet() { const wallet = await currentWallet(); if (!wallet) throw new Error("Authenticated Privy Solana wallet required"); return wallet; }
export async function requirePrivyUser() { const user = await currentUser(); if (!user) throw new Error("Privy authentication required"); return user; }
export async function logout() { const jar = await cookies(); jar.set(PRIVY_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 }); jar.set(ARENA_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 }); }
