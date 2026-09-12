import { cookies } from "next/headers";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import nacl from "tweetnacl";
import { dbEnabled, query } from "@/lib/db";

const COOKIE = "ctarena_session";
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function hash(value: string) { return createHash("sha256").update(value).digest("hex"); }
function message(nonce: string) { return `CT Meme Arena login\nNonce: ${nonce}\nThis signature only authenticates your wallet; it does not authorize a blockchain transaction.`; }

export function authMessage(nonce: string) { return message(nonce); }

export async function createChallenge(wallet: string) {
  if (!dbEnabled()) throw new Error("DATABASE_URL is required for wallet authentication");
  const nonce = randomBytes(32).toString("hex");
  await query(`INSERT INTO auth_challenges (nonce, wallet, expires_at) VALUES ($1,$2,NOW()+INTERVAL '5 minutes')`, [nonce, wallet]);
  return { nonce, message: message(nonce), expiresIn: CHALLENGE_TTL_MS / 1000 };
}

export async function verifyChallenge(wallet: string, nonce: string, signature: string) {
  if (!dbEnabled()) throw new Error("DATABASE_URL is required for wallet authentication");
  const result = await query<{ id: string }>(`SELECT id FROM auth_challenges WHERE nonce=$1 AND wallet=$2 AND used_at IS NULL AND expires_at>NOW() FOR UPDATE`, [nonce, wallet]);
  if (!result.rowCount) throw new Error("Challenge is invalid or expired");
  const publicKey = Buffer.from(wallet, "base64");
  const sig = Buffer.from(signature, "base64");
  if (publicKey.length !== 32 || sig.length !== 64 || !nacl.sign.detached.verify(Buffer.from(message(nonce)), sig, publicKey)) throw new Error("Invalid wallet signature");
  const session = randomBytes(32).toString("base64url");
  await query("UPDATE auth_challenges SET used_at=NOW() WHERE nonce=$1", [nonce]);
  await query(`INSERT INTO users (wallet) VALUES ($1) ON CONFLICT (wallet) DO UPDATE SET updated_at=NOW()`, [wallet]);
  await query(`INSERT INTO wallet_sessions (token_hash, wallet, expires_at) VALUES ($1,$2,NOW()+INTERVAL '30 days')`, [hash(session), wallet]);
  const jar = await cookies();
  jar.set(COOKIE, session, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_TTL_MS / 1000 });
  return wallet;
}

export async function currentWallet() {
  if (!dbEnabled()) return null;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const result = await query<{ wallet: string }>(`SELECT wallet FROM wallet_sessions WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at>NOW()`, [hash(token)]);
  return result.rows[0]?.wallet ?? null;
}

export async function requireWallet() {
  const wallet = await currentWallet();
  if (!wallet) throw new Error("Wallet authentication required");
  return wallet;
}

export async function logout() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (token && dbEnabled()) await query("UPDATE wallet_sessions SET revoked_at=NOW() WHERE token_hash=$1", [hash(token)]);
  (await cookies()).set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}
