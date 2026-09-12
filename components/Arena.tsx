"use client";

import { useEffect, useMemo, useState } from "react";
import { VersionedTransaction } from "@solana/web3.js";
import { Activity, ArrowDownRight, ArrowUpRight, ExternalLink, Flame, Search, ShieldCheck, Trophy, Wallet, Zap } from "lucide-react";
import { posts as demoPosts, tokens as demoTokens } from "@/lib/demo";
import { executePaperTrade, portfolioValue } from "@/lib/game";
import type { Holding, Post, Token, Trade } from "@/lib/types";

declare global {
  interface Window { solana?: { isPhantom?: boolean; publicKey?: { toString(): string }; connect(): Promise<{ publicKey: { toString(): string } }>; disconnect?(): Promise<void>; signTransaction(tx: VersionedTransaction): Promise<VersionedTransaction> } }
}

const SOL_MINT = "So11111111111111111111111111111111111111112";
const fmt = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(0)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n.toFixed(n < 1 ? 6 : 2)}`;
const money = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function Arena() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"hot" | "gainers" | "social">("hot");
  const [market, setMarket] = useState<Token[]>(demoTokens);
  const [feed, setFeed] = useState<Post[]>(demoPosts);
  const [balance, setBalance] = useState(10000);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [events, setEvents] = useState<string[]>(["Live market feed connected", "Waiting for the next CT signal", "Arena season #01 is active"]);
  const [wallet, setWallet] = useState<string | null>(null);
  const [walletSol, setWalletSol] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveTrading, setLiveTrading] = useState(false);
  const [status, setStatus] = useState("LIVE MARKET");

  const filtered = useMemo(() => market
    .filter((t) => `${t.symbol} ${t.name} ${t.address ?? ""}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => tab === "gainers" ? b.change24h - a.change24h : tab === "social" ? b.social - a.social : b.volume - a.volume), [market, query, tab]);

  const equity = portfolioValue(balance, holdings, market);

  async function refreshMarket(q = query) {
    try {
      const response = await fetch(`/api/market${q ? `?q=${encodeURIComponent(q)}` : ""}`, { cache: "no-store" });
      const body = await response.json();
      if (body.data?.length) setMarket(body.data);
      if (body.social?.length) setFeed(body.social);
      setStatus(body.source === "live" ? "LIVE MARKET" : "FALLBACK DATA");
    } catch { setStatus("OFFLINE FALLBACK"); }
  }

  async function refreshHealth() {
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      const body = await response.json();
      setLiveTrading(Boolean(body.liveTrading));
    } catch {}
  }

  async function connectWallet() {
    if (!window.solana) {
      alert("Install Phantom or another compatible Solana wallet to connect.");
      return;
    }
    try {
      const result = await window.solana.connect();
      const address = result.publicKey.toString();
      setWallet(address);
      const response = await fetch(`/api/wallet?owner=${encodeURIComponent(address)}`, { cache: "no-store" });
      const body = await response.json();
      if (response.ok) setWalletSol(body.sol);
      setEvents((current) => [`Wallet connected: ${address.slice(0, 4)}...${address.slice(-4)}`, ...current].slice(0, 8));
    } catch (error) { alert(error instanceof Error ? error.message : "Wallet connection failed"); }
  }

  async function liveBuy(token: Token) {
    if (!liveTrading) { alert("Live trading is not enabled on the server. Paper trading remains available."); return; }
    if (!wallet || !token.address) { await connectWallet(); return; }
    if (!window.solana) return;
    setLoading(true);
    try {
      const routeResponse = await fetch("/api/trade/route", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ tokenIn: SOL_MINT, tokenOut: token.address, amount: "50000000", fromAddress: wallet, slippage: 10, antiMev: false }),
      });
      const route = await routeResponse.json();
      if (!routeResponse.ok || route.code !== 0) throw new Error(route.error ?? route.msg ?? "Unable to create swap route");
      const raw = route.data?.raw_tx?.swapTransaction;
      if (!raw) throw new Error("GMGN returned no unsigned transaction");
      const transaction = VersionedTransaction.deserialize(Uint8Array.from(atob(raw), (c) => c.charCodeAt(0)));
      const signed = await window.solana.signTransaction(transaction);
      const signedTx = btoa(String.fromCharCode(...signed.serialize()));
      const submitResponse = await fetch("/api/trade/submit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ signedTx }) });
      const submitted = await submitResponse.json();
      if (!submitResponse.ok) throw new Error(submitted.error ?? "Transaction submission failed");
      setEvents((current) => [`LIVE BUY ${token.symbol} · ${submitted.hash?.slice(0, 10)}...`, ...current].slice(0, 8));
      setStatus("TX SUBMITTED");
    } catch (error) { alert(error instanceof Error ? error.message : "Live trade failed"); }
    finally { setLoading(false); }
  }

  function paperTrade(token: Token, side: "BUY" | "SELL") {
    try {
      const result = executePaperTrade(balance, holdings, trades, token, side, 250);
      setBalance(result.balance); setHoldings(result.holdings); setTrades((current) => [result.trade, ...current].slice(0, 12));
      setEvents((current) => [`PAPER ${side} $250 ${token.symbol}`, ...current].slice(0, 8));
    } catch (e) { alert(e instanceof Error ? e.message : "Trade failed"); }
  }

  useEffect(() => { refreshMarket(); refreshHealth(); const timer = setInterval(() => refreshMarket(), 10000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (query.length >= 2) { const timer = setTimeout(() => refreshMarket(query), 450); return () => clearTimeout(timer); } }, [query]);

  return <main className="shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">CT</span><div><strong>MEME ARENA</strong><small>TRADE THE MEMES. BEAT THE TIMELINE.</small></div></div>
      <div className="search"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search live token, ticker, or contract..."/></div>
      <div className="top-actions"><div className="stat"><span>WALLET</span><b>{walletSol === null ? "—" : `${walletSol.toFixed(3)} SOL`}</b></div><div className="stat"><span>MODE</span><b>{status}</b></div><button className="wallet" onClick={connectWallet}><Wallet size={16}/>{wallet ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : "CONNECT"}</button></div>
    </header>
    <div className="layout">
      <aside className="sidebar"><div className="live-dot"><i/> {status}</div>{["Arena", "Radar", "Leaderboard", "Quests"].map((x, i) => <button className={i === 0 ? "nav active" : "nav"} key={x}>{i === 0 ? <Zap size={17}/> : i === 1 ? <Activity size={17}/> : i === 2 ? <Trophy size={17}/> : <Flame size={17}/>}<span>{x}</span>{i === 2 && <em>1,284</em>}</button>)}<div className="side-card"><ShieldCheck size={18}/><b>{liveTrading ? "LIVE TRADING READY" : "PAPER MODE"}</b><span>{liveTrading ? "GMGN route + wallet signing enabled." : "Add GMGN credentials and enable live trading."}</span></div></aside>
      <section className="content">
        <section className="hero"><div><span className="eyebrow">SEASON #01 · SOLANA · {status}</span><h1>WELCOME TO<br/><span>THE ARENA.</span></h1><p>Live DEX prices, real Crypto Twitter signals, wallet-aware execution, competitive paper trading, and an on-chain trading rail.</p></div><div className="hero-badges"><div><b>{liveTrading ? "LIVE" : "$10K"}</b><span>{liveTrading ? "EXECUTION" : "PAPER BANKROLL"}</span></div><div><b>10s</b><span>MARKET REFRESH</span></div></div></section>
        <section className="panel"><div className="panel-head"><div><span className="kicker">MARKET RADAR</span><h2>WHAT'S MOVING NOW</h2></div><div className="tabs">{(["hot", "gainers", "social"] as const).map(x => <button key={x} className={tab === x ? "tab active" : "tab"} onClick={() => setTab(x)}>{x === "hot" ? "🔥 HOT" : x === "gainers" ? "↗ GAINERS" : "◎ SOCIAL"}</button>)}</div></div><div className="token-grid">{filtered.map(t => <article className="token" key={t.id}><div className="token-top"><span className="emoji">{t.emoji}</span><div><b>{t.symbol}</b><small>{t.name}</small></div><span className={`risk ${t.risk.toLowerCase()}`}>{t.live ? "LIVE" : t.risk}</span></div><div className="price"><strong>{t.price < 1 ? t.price.toFixed(8) : t.price.toFixed(4)}</strong><span className={t.change24h >= 0 ? "up" : "down"}>{t.change24h >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {Math.abs(t.change24h).toFixed(1)}%</span></div><div className="mini-grid"><span><b>{fmt(t.mcap)}</b><small>MCAP</small></span><span><b>{fmt(t.volume)}</b><small>VOL 24H</small></span><span><b>{t.social}</b><small>MOMENTUM</small></span></div>{t.url && <a className="chart-link" href={t.url} target="_blank" rel="noreferrer">DEX CHART <ExternalLink size={11}/></a>}<div className="trade-row"><button className="buy" disabled={loading} onClick={() => liveTrading ? liveBuy(t) : paperTrade(t, "BUY")}>{liveTrading ? "LIVE BUY 0.05 SOL" : "PAPER BUY $250"}</button><button className="sell" onClick={() => paperTrade(t, "SELL")}>PAPER SELL $250</button></div></article>)}</div></section>
        <div className="two-col"><section className="panel"><div className="panel-head compact"><div><span className="kicker">CT SIGNALS</span><h2>LIVE TIMELINE</h2></div><span className="pulse">● {feed.length ? "LIVE" : "DEMO"}</span></div><div className="feed">{feed.map(p => <div className="post" key={p.id}><div className="avatar">{p.user.slice(0, 1)}</div><div><div className="post-meta"><b>{p.user}</b>{p.verified && <ShieldCheck size={13}/>}<span>{p.handle} · {p.time}m</span></div><p>{p.text}</p><div className="post-stats">♥ {p.likes.toLocaleString()} &nbsp; · &nbsp; ↩ {p.replies} {p.url && <a href={p.url} target="_blank" rel="noreferrer"> · VIEW</a>}</div></div></div>)}</div></section>
          <section className="panel"><div className="panel-head compact"><div><span className="kicker">LIVE ARENA</span><h2>ACTIVITY</h2></div><span className="pulse">● LIVE</span></div><div className="events">{events.map((e, i) => <div className="event" key={`${e}-${i}`}><i/>{e}<span>{i + 1}s</span></div>)}</div><div className="arena-cta"><b>{liveTrading ? "LIVE EXECUTION ENABLED" : "PAPER ARENA READY"}</b><span>{liveTrading ? "Connect your Solana wallet to sign transactions. CT Meme Arena never receives your private key." : "Trade the live market without moving funds."}</span><button onClick={() => refreshMarket()}>{loading ? "PROCESSING..." : "↻ REFRESH LIVE DATA"}</button></div></section></div>
        <section className="bottom-grid"><section className="panel"><div className="panel-head compact"><div><span className="kicker">SEASON #01</span><h2>LEADERBOARD</h2></div><span className="muted">LIVE XP</span></div>{["Mika", "DegenDesk", "SolShill", "CTWolf", "AnonKing"].map((n, i) => <div className="leader" key={n}><span>#{i + 1}</span><b>{n}</b><span className="gain">+{[842, 691, 544, 442, 318][i]} pts</span><strong>{[19642, 17818, 15492, 14844, 13240][i].toLocaleString()} XP</strong></div>)}</section><section className="panel"><div className="panel-head compact"><div><span className="kicker">DAILY QUESTS</span><h2>EARN YOUR EDGE</h2></div></div>{[["MAKE 3 TRADES", "2 / 3", "66%", "+150 XP"], ["FIND A 5% RUNNER", "1 / 1", "100%", "+100 XP"], ["POST A SHILL", "0 / 1", "0%", "+200 XP"]].map(q => <div className="quest" key={q[0]}><b>{q[0]}</b><span>{q[1]}</span><div className="bar"><i style={{ width: q[2] }}/></div><strong>{q[3]}</strong></div>)}</section></section>
        <div className="disclaimer">CT Meme Arena is an experimental crypto trading interface. Live trading can lose money. Verify every transaction, token address, route, slippage, and wallet prompt before signing.</div>
      </section>
    </div>
  </main>;
}
