"use client";

import { Activity, BarChart3, BriefcaseBusiness, CheckSquare, Compass, Menu, Settings, Trophy, Users, Wallet, X, Zap } from "lucide-react";
import CTWorldResponsive from "@/components/CTWorldResponsive";
import { DEMO_PLAYERS } from "@/lib/demo-players";
import { tokens } from "@/lib/demo";
import "./arena-chrome.css";

const nav = [
  ["EXPLORE", Compass], ["TRADERS", Users], ["WALLETS", Wallet], ["TRADE", Activity],
  ["QUESTS", CheckSquare], ["LEADERBOARD", BarChart3], ["INVENTORY", BriefcaseBusiness], ["SETTINGS", Settings],
] as const;

export default function ArenaChrome(){
  const top = DEMO_PLAYERS.slice(0,3);
  return <main className="arena-chrome">
    <CTWorldResponsive />
    <aside className="arena-sidebar">
      <div className="arena-logo"><strong>CT ARENA</strong><span>THE LIVING WORLD OF CRYPTO TWITTER</span></div>
      <nav>{nav.map(([label,Icon],i)=><button key={label} className={i===0?"active":""}><Icon size={19}/><span>{label}</span></button>)}</nav>
      <div className="arena-side-season"><span>SEASON 01</span><b>RISE TO LEGEND</b><small>Explore. Trade. Earn XP.</small></div>
    </aside>

    <header className="arena-profilebar">
      <div className="arena-profile">
        <img src={top[0].avatar} alt=""/><div><b>LV. 12</b><span>CT PLAYER</span></div>
      </div>
      <div className="arena-wallet"><span className="wallet-dot">◎</span><b>0xA7F...3B2C</b><strong>12.45 SOL</strong></div>
      <button className="arena-menu"><Menu size={20}/></button>
    </header>

    <section className="arena-event-panel">
      <div className="panel-title"><span><i/> LIVE EVENTS</span><small>NOW</small></div>
      <div className="event"><span>🐋</span><div><b>Whale Buy</b><small>+250,000 USDC</small></div><time>2m</time></div>
      <div className="event"><span>📈</span><div><b>TOKEN <em>+42%</em></b><small>$CAT up 42%</small></div><time>5m</time></div>
      <div className="event"><span>🔥</span><div><b>New ATH</b><small>$MOON reaches ATH</small></div><time>12m</time></div>
      <div className="event"><span>👤</span><div><b>Top Trader Joined</b><small>@DegenWhale</small></div><time>18m</time></div>
    </section>

    <section className="arena-quest"><div><span>CURRENT QUEST</span><b>Follow 5 Top Traders</b></div><strong>2/5</strong><div className="quest-bar"><i/></div><small>+500 XP</small></section>
    <section className="arena-season-card"><div className="season-mark">♜</div><div><span>SEASON 01</span><b>RISE TO LEGEND</b><small>RANK HIGHER. EARN REWARDS.<br/>MAKE YOUR MARK.</small></div></section>

    <div className="arena-map"><div className="map-ring"><span>◎</span><i/><i/><i/><i/></div><b>SOLANA CITY</b><small>X: 1234 · Y: 5678</small></div>

    <section className="arena-player-hud">
      <div className="hud-avatar"><img src={top[0].avatar} alt=""/><i>12</i></div>
      <div className="hud-level"><b>Lv. 12</b><span>X: 450 / 5,000 XP</span><div><i/></div></div>
      <div className="hud-actions"><button className="selected"><Compass size={18}/><span>Explore</span></button><button><span>◫</span><span>Map</span></button><button><span>⇄</span><span>Trade</span></button><button><span>⚑</span><span>Quests</span></button><button><Users size={17}/><span>Social</span></button><button><Menu size={18}/><span>More</span></button></div>
    </section>

    <div className="arena-market-ticker"><strong>MARKET</strong>{tokens.slice(0,6).map(t=><div key={t.id}><span>{t.emoji} ${t.symbol}</span><b className={t.change24h>=0?"up":"down"}>{t.change24h>=0?"+":""}{t.change24h.toFixed(1)}%</b></div>)}<em>CT ARENA</em></div>

    <div className="arena-district-tags"><span>FOMO DISTRICT</span><span>SOLANA CITY</span><span>BASE BLOCK</span><span>SNIPER ALLEY</span><span>WHALE BEACH</span></div>

    <button className="arena-close-hud"><X size={15}/></button>
  </main>;
}
