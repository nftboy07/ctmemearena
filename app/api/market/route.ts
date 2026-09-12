import { NextRequest, NextResponse } from "next/server";
import { demoProvider, dexSearch, xSearch } from "@/lib/providers";

const DEFAULT_QUERIES = ["BONK", "WIF", "POPCAT", "MEW", "GOAT", "GIGA"];

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  try {
    if (query) {
      const data = await dexSearch(query);
      const social = process.env.X_BEARER_TOKEN ? await xSearch(query).catch(() => []) : [];
      return NextResponse.json({ data, social, source: "live" });
    }
    const results = await Promise.allSettled(DEFAULT_QUERIES.map((q) => dexSearch(q)));
    const data = results.flatMap((r) => r.status === "fulfilled" ? r.value.slice(0, 1) : []);
    const unique = Array.from(new Map(data.map((t) => [t.address ?? t.id, t])).values());
    return NextResponse.json({ data: unique.length ? unique : await demoProvider.trending(), source: unique.length ? "live" : "demo" });
  } catch (error) {
    return NextResponse.json({ data: await demoProvider.trending(), source: "demo", error: error instanceof Error ? error.message : "live provider unavailable" }, { status: 200 });
  }
}
