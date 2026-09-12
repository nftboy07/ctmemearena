import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { createChallenge } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rl = rateLimit(clientKey(request, "auth-challenge"), 10, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  try {
    const { wallet } = await request.json();
    new PublicKey(String(wallet));
    return NextResponse.json(await createChallenge(String(wallet)));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid wallet" }, { status: 400 });
  }
}
