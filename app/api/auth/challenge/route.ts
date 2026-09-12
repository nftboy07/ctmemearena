import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function POST() { return NextResponse.json({ error: "Wallet challenge login has been replaced by Privy authentication." }, { status: 410 }); }
