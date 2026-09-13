"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, ArrowUpRight, Crosshair, Gamepad2, MapPin, Radio, Trophy, Wallet, X, Zap } from "lucide-react";
import { tokens as demoTokens } from "@/lib/demo";
import type { Token } from "@/lib/types";
import "./ct-world.css";

type Player = { wallet:string; displayName:string; handle:string; avatar?:string; chain:string; pnl:number; unrealized:number; volume:number; wins:number; losses:number; bestTrade:number; fomo:number; diamond:number; sniper:number; trades:number; followers:number; level:number; xp:number; badges:string[]; rank?:number };
type Profile = { profile:Player; trades:any[]; holdings:any[]; badges:string[]; following:boolean };
type Point = { x:number; y:number };

const WORLD_W=3600, WORLD_H=2400;
const districts=[
 {id:"solana",name:"SOLANA CITY",x:260,y:240,w:820,h:560,accent:"#8b5cf6",emoji:"◎",desc:"Meme capital"},
 {id:"base",name:"BASE BLOCK",x:1260,y:190,w:820,h:520,accent:"#3b82f6",emoji:"🔵",desc:"Builders & speed"},
 {id:"ethereum",name:"ETHEREUM",x:2260,y:240,w:980,h:540,accent:"#a78bfa",emoji:"♦",desc:"Whales & blue chips"},
 {id:"bnb",name:"BNB BOULEVARD",x:300,y:1080,w:820,h:560,accent:"#f5c84b",emoji:"🟡",desc:"High velocity"},
 {id:"fomo",name:"FOMO DISTRICT",x:1280,y:1000,w:820,h:610,accent:"#ff4d8d",emoji:"🔥",desc:"Chase the candle"},
 {id:"sniper",name:"SNIPER ALLEY",x:2260,y:1050,w:980,h:560,accent:"#22d3ee",emoji:"⚡",desc:"First block wins"},
 {id:"whale",name:"WHALE BEACH",x:600,y:1860,w:1050,h:360,accent:"#14b8a6",emoji:"🐋",desc:"Seven-figure bags"},
 {id:"capital",name:"CT CAPITAL",x:1900,y:1810,w:1340,h:410,accent:"#f59e0b",emoji:"🏆",desc:"Hall of Fame"}
];
const streets=[{x:80,y:870,w:3440,h:74},{x:80,y:1690,w:3440,h:74},{x:1140,y:70,w:76,h:2160},{x:2140,y:70,w:76,h:2160}];
const seeded:Point[]=[{x:620,y:520},{x:820,y:690},{x:1010,y:430},{x:1510,y:430},{x:1810,y:610},{x:2480,y:500},{x:2860,y:650},{x:560,y:1360},{x:900,y:1510},{x:1500,y:1250},{x:1820,y:1450},{x:2440,y:1300},{x:2860,y:1460},{x:900,y:2020},{x:1400,y:2100},{x:2200,y:2000},{x:2860,y:2070}];
const money=(n:number)=>n>=1e9?`$${(n/1e9).toFixed(2)}B`:n>=1e6?`$${(n/1e6).toFixed(2)}M`:n>=1e3?`$${(n/1e3).toFixed(1)}K`:`$${n.toFixed(2)}`;
const short=(s:string)=>s.length>16?`${s.slice(0,6)}…${s.slice(-5)}`:s;

function Avatar({p,size=44}:{p:Player;size?:number}){return p.avatar?<img src={p.avatar} alt="" style={{width:size,height:size}} className="cw-avatar"/>:<div className="cw-avatar cw-avatar-fallback" style={{width:size,height:size}}>{p.displayName.slice(0,1)}</div>}

export default function CTWorldResponsive(){
 const [players,setPlayers]=useState<Player[]>([]); const [market,setMarket]=useState<Token[]>(demoTokens); const [selected,setSelected]=useState<Player|null>(null); const [profile,setProfile]=useState<Profile|null>(null); const [events,setEvents]=useState<string[]>(["CT WORLD ONLINE","Market feed connected","Season 01 is live"]); const [pos,setPos]=useState<Point>({x:1780,y:900}); const [facing,setFacing]=useState(0); const [menu,setMenu]=useState(false); const keys=useRef<Record<string,boolean>>({}); const posRef=useRef(pos);
 const load=useCallback(async()=>{try{const r=await fetch("/api/players?category=profit&chain=all&limit=40",{cache:"no-store"});const j=await r.json();setPlayers(j.players||[])}catch{}},[]);
 const loadMarket=useCallback(async()=>{try{const r=await fetch("/api/market",{cache:"no-store"});const j=await r.json();if(j.data?.length){const next=j.data as Token[];setMarket(next);const hot=next.filter(t=>Math.abs(t.change24h)>=8).slice(0,2);if(hot.length)setEvents(v=>[...hot.map(t=>`${t.symbol} moved ${t.change24h>=0?"+":""}${t.change24h.toFixed(1)}%`),...v].slice(0,7))}}catch{}},[]);
 useEffect(()=>{void load();void loadMarket();const a=setInterval(load,30000),b=setInterval(loadMarket,10000);return()=>{clearInterval(a);clearInterval(b)}},[load,loadMarket]);
 useEffect(()=>{const down=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();keys.current[k]=true;if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].includes(k))e.preventDefault()};const up=(e:KeyboardEvent)=>{keys.current[e.key.toLowerCase()]=false};window.addEventListener("keydown",down);window.addEventListener("keyup",up);let raf=0,last=performance.now();const tick=(now:number)=>{const dt=Math.min(32,now-last)/16;last=now;let dx=0,dy=0;if(keys.current.w||keys.current.arrowup)dy-=1;if(keys.current.s||keys.current.arrowdown)dy+=1;if(keys.current.a||keys.current.arrowleft)dx-=1;if(keys.current.d||keys.current.arrowright)dx+=1;if(dx||dy){const len=Math.hypot(dx,dy)||1;const speed=13;const n={x:Math.max(150,Math.min(WORLD_W-150,posRef.current.x+dx/len*speed*dt)),y:Math.max(150,Math.min(WORLD_H-150,posRef.current.y+dy/len*speed*dt))};posRef.current=n;setPos(n);setFacing(Math.atan2(dy,dx))}raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(raf);window.removeEventListener("keydown",down);window.removeEventListener("keyup",up)}},[]);
 useEffect(()=>{if(players.length)setPlayers(v=>v.map((p,i)=>({...p,__world:seeded[i%seeded.length]} as Player)))},[players.length]);
 const worldPlayers=useMemo(()=>players.map((p,i)=>({p,point:(p as Player&{__world?:Point}).__world||seeded[i%seeded.length]})),[players]);
 const nearby=useMemo(()=>{let best:{p:Player;d:number}|null=null;for(const {p,point} of worldPlayers){const d=Math.hypot(point.x-pos.x,point.y-pos.y);if(d<180&&(!best||d<best.d))best={p,d}}return best?.p||null},[worldPlayers,pos]);
 const viewportW=typeof window!=="undefined"?window.innerWidth:1440; const viewportH=typeof window!=="undefined"?window.innerHeight:900; const isMobile=viewportW<=700;
 const viewW=isMobile?Math.min(980,Math.max(720,viewportW*2.15)):1600; const viewH=isMobile?Math.min(1400,Math.max(920,viewportH*1.55)):1050;
 const camera={x:Math.max(0,Math.min(WORLD_W-viewW,pos.x-viewW/2)),y:Math.max(0,Math.min(WORLD_H-viewH,pos.y-viewH/2))};
 async function openPlayer(p:Player){setSelected(p);setProfile(null);try{const r=await fetch(`/api/player?wallet=${encodeURIComponent(p.wallet)}`,{cache:"no-store"});if(r.ok)setProfile(await r.json())}catch{}}
 function move(dx:number,dy:number){const len=Math.hypot(dx,dy)||1;const speed=42;const n={x:Math.max(150,Math.min(WORLD_W-150,posRef.current.x+dx/len*speed)),y:Math.max(150,Math.min(WORLD_H-150,posRef.current.y+dy/len*speed))};posRef.current=n;setPos(n);setFacing(Math.atan2(dy,dx))}
 return <main className="cw-shell">
   <div className="cw-stage"><div className="cw-world" style={{width:WORLD_W,height:WORLD_H,transform:`translate(${-camera.x}px,${-camera.y}px)`}}>
     {streets.map((s,i)=><div key={i} className="cw-street" style={{left:s.x,top:s.y,width:s.w,height:s.h}}/>)}
     {districts.map(d=><button key={d.id} onClick={()=>setEvents(v=>[`${d.name} entered`,...v].slice(0,7))} className="cw-district" style={{left:d.x,top:d.y,width:d.w,height:d.h,borderColor:`${d.accent}66`,background:`linear-gradient(145deg,${d.accent}1c,#0b0a11 72%)`,boxShadow:`inset 0 0 100px ${d.accent}08,0 25px 70px #0009`}}><span style={{color:d.accent}}>{d.emoji} {d.name}</span><b>{d.desc}</b><small>ZONE · LIVE</small></button>)}
     {worldPlayers.map(({p,point})=><button key={p.wallet} className="cw-trader" onClick={()=>openPlayer(p)} style={{left:point.x-34,top:point.y-62}}><Avatar p={p}/><span>{p.displayName}</span></button>)}
     <div className="cw-player" style={{left:pos.x-30,top:pos.y-30}}><div className="cw-player-ring"><div className="cw-player-dot"/></div><i style={{transform:`rotate(${facing}rad)`}}/></div>
   </div></div>
   <header className="cw-top"><button className="cw-brand" onClick={()=>setPos({x:1780,y:900})}><strong>CT <em>ARENA</em></strong><span>SEASON 01 · LIVE WORLD</span></button><div className="cw-top-right"><div className="cw-status"><i/> WORLD ONLINE</div><button className="cw-button primary" onClick={()=>document.querySelector<HTMLButtonElement>(".privy-authbar button")?.click()}><Wallet size={15}/> PLAY / LOGIN</button><button className="cw-button" onClick={()=>setMenu(v=>!v)}><Gamepad2 size={15}/> <span className="cw-desktop">CONTROLS</span><span className="cw-mobile">MENU</span></button></div></header>
   <section className="cw-feed"><div className="cw-feed-title"><Radio size={13}/> CT WORLD FEED</div>{events.slice(0,4).map((e,i)=><div key={`${e}-${i}`} className={i===0?"hot":""}>{i===0&&<Zap size={10}/>} {e}</div>)}</section>
   <aside className="cw-market"><div className="cw-panel-title"><span>LIVE MARKET</span><b>10s</b></div>{market.slice(0,4).map(t=><div className="cw-market-row" key={t.id}><span>{t.symbol}</span><b className={t.change24h>=0?"up":"down"}>{t.change24h>=0?"+":""}{t.change24h.toFixed(1)}%</b></div>)}<button onClick={()=>setMenu(true)} className="cw-link">OPEN MARKET <ArrowUpRight size={12}/></button></aside>
   <div className="cw-bottom"><div className="cw-controls"><button onClick={()=>move(-1,0)}>←</button><div><button onClick={()=>move(0,-1)}>↑</button><button onClick={()=>move(0,1)}>↓</button></div><button onClick={()=>move(1,0)}>→</button></div><div className="cw-hint"><Crosshair size={13}/> <b>WASD / ARROWS</b> <span>WALK THE CITY</span> <i>•</i> <span>CLICK TRADERS</span></div></div>
   {nearby&&<button className="cw-inspect" onClick={()=>openPlayer(nearby)}>INSPECT @{nearby.handle.replace(/^@/,"")} <strong>{money(nearby.pnl)} PNL</strong></button>}
   {menu&&<div className="cw-menu"><button onClick={()=>setMenu(false)} className="cw-menu-close"><X size={18}/></button><div className="cw-menu-head"><span>CT ARENA</span><b>WORLD MAP</b></div><p>Explore the districts, find traders and inspect the wallets behind the flex.</p><div className="cw-menu-grid">{districts.map(d=><button key={d.id} onClick={()=>{setPos({x:d.x+d.w/2,y:d.y+d.h/2});setMenu(false)}}><span style={{color:d.accent}}>{d.emoji}</span><b>{d.name}</b><small>{d.desc}</small></button>)}</div></div>}
   {selected&&<ProfileModal player={selected} data={profile} onClose={()=>{setSelected(null);setProfile(null)}}/>}
 </main>
}

function ProfileModal({player,data,onClose}:{player:Player;data:Profile|null;onClose:()=>void}){const p=data?.profile||player;return <div className="cw-modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section className="cw-profile"><button className="cw-profile-close" onClick={onClose}><X size={18}/></button><div className="cw-profile-head"><Avatar p={p} size={64}/><div><h2>{p.displayName}</h2><span>{p.handle}</span><small>{p.chain.toUpperCase()} · LVL {p.level}</small></div></div><div className="cw-pnl"><span>REALIZED PROFIT</span><strong>+{money(p.pnl)}</strong><small>{money(p.unrealized)} unrealized · {money(p.volume)} volume</small></div><div className="cw-stats"><div><b>{p.fomo}</b><span>FOMO</span></div><div><b>{p.diamond}</b><span>DIAMOND</span></div><div><b>{p.sniper}</b><span>SNIPER</span></div><div><b>{p.wins}/{p.losses}</b><span>W/L</span></div></div><div className="cw-profile-body"><div><h3>ACHIEVEMENTS</h3><div className="cw-badges">{(data?.badges||p.badges||[]).slice(0,8).map(b=><span key={b}>✦ {b}</span>)}</div><h3>RECENT TRADES</h3>{(data?.trades||[]).slice(0,5).map((t:any)=><div className="cw-trade" key={t.id}><b>{t.side}</b><strong>{t.symbol||t.token_id}</strong><span>{money(Number(t.pnl||t.usd||0))}</span></div>)}{!data?.trades?.length&&<div className="cw-empty">Verified on-chain activity will appear here.</div>}</div><aside><h3>CURRENT BAG</h3>{(data?.holdings||[]).slice(0,5).map((h:any)=><div className="cw-holding" key={h.symbol}><b>{h.symbol}</b><strong>{money(Number(h.value||h.usd_value||0))}</strong></div>)}{!data?.holdings?.length&&<div className="cw-empty">No indexed holdings yet.</div>}<h3>SOCIAL</h3><div className="cw-social"><b>{p.followers.toLocaleString()}</b><span>FOLLOWERS</span></div></aside></div><div className="cw-wallet"><span>WALLET</span><code>{short(p.wallet)}</code><button onClick={()=>navigator.clipboard?.writeText(p.wallet)}>COPY</button></div></section></div>}
