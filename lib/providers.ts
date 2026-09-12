import { tokens as demoTokens } from "./demo";
import type { Chain, Post, Token } from "./types";

export interface MarketProvider {
  name: string;
  chains: Chain[];
  trending(query?: string): Promise<Token[]>;
  token(chain: Chain, address: string): Promise<Token | null>;
}

type DexPair = {
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: { address?: string; name?: string; symbol?: string };
  priceUsd?: string | null;
  priceChange?: Record<string, number>;
  volume?: Record<string, number>;
  liquidity?: { usd?: number } | null;
  marketCap?: number | null;
  fdv?: number | null;
  pairCreatedAt?: number | null;
};

function risk(liquidity: number, change24h: number): Token["risk"] {
  if (liquidity >= 10_000_000 && Math.abs(change24h) < 35) return "LOW";
  if (liquidity >= 1_000_000 && Math.abs(change24h) < 80) return "MEDIUM";
  return "HIGH";
}

function mapPair(pair: DexPair): Token | null {
  const address = pair.baseToken?.address;
  const price = Number(pair.priceUsd ?? 0);
  if (!address || !Number.isFinite(price) || price <= 0) return null;
  const change5m = Number(pair.priceChange?.m5 ?? 0);
  const change1h = Number(pair.priceChange?.h1 ?? 0);
  const change24h = Number(pair.priceChange?.h24 ?? 0);
  const liquidity = Number(pair.liquidity?.usd ?? 0);
  const volume = Number(pair.volume?.h24 ?? 0);
  const mcap = Number(pair.marketCap ?? pair.fdv ?? 0);
  const created = pair.pairCreatedAt ? Math.max(0, Date.now() - pair.pairCreatedAt) : 0;
  const age = created ? `${Math.max(1, Math.floor(created / 86_400_000))}d` : "live";
  return {
    id: address,
    address,
    chain: "solana",
    symbol: pair.baseToken?.symbol ?? "TOKEN",
    name: pair.baseToken?.name ?? pair.baseToken?.symbol ?? "Token",
    emoji: "🪙",
    price,
    change5m,
    change1h,
    change24h,
    mcap,
    liquidity,
    volume,
    social: Math.max(0, Math.min(100, Math.round(50 + Math.log10(Math.max(1, volume)) * 4 + change1h))),
    holders: 0,
    age,
    risk: risk(liquidity, change24h),
    pairAddress: pair.pairAddress,
    dex: pair.dexId,
    url: pair.url,
    live: true,
  };
}

export async function dexSearch(query: string): Promise<Token[]> {
  const response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`, {
    headers: { accept: "application/json" },
    next: { revalidate: 5 },
  });
  if (!response.ok) throw new Error(`DEX Screener returned ${response.status}`);
  const body = (await response.json()) as { pairs?: DexPair[] };
  return (body.pairs ?? [])
    .filter((p) => p.chainId === "solana")
    .map(mapPair)
    .filter((x): x is Token => Boolean(x))
    .sort((a, b) => b.liquidity - a.liquidity)
    .slice(0, 10);
}

export const liveProvider: MarketProvider = {
  name: "dexscreener",
  chains: ["solana"],
  async trending(query = "BONK") {
    return dexSearch(query);
  },
  async token(_chain, address) {
    const response = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${encodeURIComponent(address)}`, {
      headers: { accept: "application/json" },
      next: { revalidate: 5 },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as DexPair[];
    const pairs = body.map(mapPair).filter((x): x is Token => Boolean(x));
    return pairs.sort((a, b) => b.liquidity - a.liquidity)[0] ?? null;
  },
};

export async function xSearch(query: string): Promise<Post[]> {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) return [];
  const url = new URL("https://api.x.com/2/tweets/search/recent");
  url.searchParams.set("query", `${query} lang:en -is:retweet`);
  url.searchParams.set("max_results", "20");
  url.searchParams.set("tweet.fields", "created_at,public_metrics,author_id");
  url.searchParams.set("expansions", "author_id");
  url.searchParams.set("user.fields", "username,name,verified");
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 15 } });
  if (!response.ok) throw new Error(`X API returned ${response.status}`);
  const body = await response.json() as any;
  const users = new Map((body.includes?.users ?? []).map((u: any) => [u.id, u]));
  return (body.data ?? []).map((p: any) => {
    const u = users.get(p.author_id) as any;
    return {
      id: p.id,
      user: u?.name ?? "CT user",
      handle: u?.username ? `@${u.username}` : "@unknown",
      verified: Boolean(u?.verified),
      tokenId: query.toLowerCase(),
      text: p.text,
      likes: p.public_metrics?.like_count ?? 0,
      replies: p.public_metrics?.reply_count ?? 0,
      time: Math.max(1, Math.floor((Date.now() - Date.parse(p.created_at)) / 60_000)),
      url: u?.username ? `https://x.com/${u.username}/status/${p.id}` : undefined,
    } as Post;
  });
}

export const demoProvider: MarketProvider = {
  name: "demo",
  chains: ["solana"],
  async trending() { return demoTokens; },
  async token(_chain, address) { return demoTokens.find((t) => t.id === address || t.symbol.toLowerCase() === address.toLowerCase()) ?? null; },
};

export const providerConfig = {
  market: { enabled: true, provider: "DEX Screener", purpose: "live DEX market data" },
  gmgn: { enabled: Boolean(process.env.GMGN_API_KEY), purpose: "live swap routing and execution" },
  x: { enabled: Boolean(process.env.X_BEARER_TOKEN), purpose: "live Crypto Twitter search" },
  alchemy: { enabled: Boolean(process.env.ALCHEMY_API_KEY), purpose: "wallet/RPC/on-chain data" },
  dune: { enabled: Boolean(process.env.DUNE_API_KEY), purpose: "historical analytics" },
};
