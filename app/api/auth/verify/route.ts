import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { verifyChallenge } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rl = rateLimit(clientKey(request, "auth-verify"), 10, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  try {
    const { wallet, nonce, signature } = await request.json();
    const normalized = new PublicKey(String(wallet)).toBase58();
    if (String(wallet) !== normalized) return NextResponse.json({ error: "Invalid wallet encoding" }, { status: 400 });
    const authenticatedWallet = await verifyChallenge(normalized, String(nonce), String(signature));
    return NextResponse.json({ authenticated: true, wallet: authenticatedWallet });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Authentication failed" }, { status: 401 });
  }
}
