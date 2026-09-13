import { NextRequest, NextResponse } from "next/server";
import { dbEnabled, query } from "@/lib/db";
import { demoPlayers } from "@/lib/demo-players";

export const runtime = "nodejs";

function sortDemo(category: string, chain: string) {
  const key = category === "fomo" ? "fomo" : category === "diamond" ? "diamond" : category === "sniper" ? "sniper" : category === "best" ? "bestTrade" : "pnl";
  return demoPlayers()
    .filter((p) => chain === "all" || p.chain === chain)
    .sort((a, b) => b[key] - a[key])
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") || "profit";
  const chain = request.nextUrl.searchParams.get("chain") || "all";
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") || 50), 1), 100);

  if (!dbEnabled()) {
    return NextResponse.json({ season: 1, category, chain, players: sortDemo(category, chain).slice(0, limit), source: "demo" });
  }

  const metric = category === "fomo" ? "s.fomo_score" : category === "diamond" ? "s.diamond_score" : category === "sniper" ? "s.sniper_score" : category === "best" ? "s.best_trade" : "s.realized_pnl";
  const params: unknown[] = [];
  const filter = chain !== "all" ? `AND u.home_chain=$${params.push(chain)}` : "";
  params.push(limit);
  const rows = await query<any>(
    `SELECT u.wallet,u.display_name,u.twitter_username,u.avatar_url,u.home_chain,s.realized_pnl,s.unrealized_pnl,s.volume_usd,s.wins,s.losses,s.best_trade,s.fomo_score,s.diamond_score,s.sniper_score,s.trades_count,u.level,u.season_xp,COALESCE(f.followers,0)::int followers FROM users u JOIN player_stats s ON s.wallet=u.wallet LEFT JOIN (SELECT followed_wallet,COUNT(*) followers FROM player_follows GROUP BY followed_wallet) f ON f.followed_wallet=u.wallet WHERE 1=1 ${filter} ORDER BY ${metric} DESC NULLS LAST LIMIT $${params.length}`,
    params,
  );
  const players = rows.rows.map((r: any, i: number) => ({ rank: i + 1, wallet: r.wallet, displayName: r.display_name || "Anonymous", handle: r.twitter_username ? `@${r.twitter_username}` : "@onchain", avatar: r.avatar_url, chain: r.home_chain, pnl: Number(r.realized_pnl), unrealized: Number(r.unrealized_pnl), volume: Number(r.volume_usd), wins: r.wins, losses: r.losses, bestTrade: Number(r.best_trade), fomo: Number(r.fomo_score), diamond: Number(r.diamond_score), sniper: Number(r.sniper_score), trades: r.trades_count, followers: r.followers, level: r.level, xp: Number(r.season_xp), badges: [] }));
  return NextResponse.json({ season: 1, category, chain, players, source: "database" });
}
