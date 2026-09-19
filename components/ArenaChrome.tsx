"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  Briefcase,
  CheckSquare,
  ChevronRight,
  Compass,
  Flag,
  Gamepad2,
  HelpCircle,
  Map as MapIcon,
  Menu,
  MoreHorizontal,
  Search,
  Settings,
  Share2,
  Users,
  Volume2,
  VolumeX,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import CTWorldCanvas from "./CTWorldCanvas";
import VirtualJoystick from "./VirtualJoystick";
import { sounds } from "@/lib/audio";
import { DEMO_PLAYERS } from "@/lib/demo-players";
import { tokens as demoTokens } from "@/lib/demo";
import type { Token } from "@/lib/types";
import "./arena-chrome.css";

const money = (n: number) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(1)}K` : `$${n.toFixed(2)}`;

const short = (s: string) => (s.length > 14 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s);

export default function ArenaChrome() {
  // Navigation & Modal state
  const [activeNav, setActiveNav] = useState<string>("EXPLORE");
  const [selectedTrader, setSelectedTrader] = useState<any | null>(null);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  // Player & Game state
  const [playerCoords, setPlayerCoords] = useState({ district: "SOLANA CITY", x: 1245, y: 5728 });
  const [playerXP, setPlayerXP] = useState(450);
  const [playerLevel, setPlayerLevel] = useState(12);
  const [questProgress, setQuestProgress] = useState(2);
  const [collectedCount, setCollectedCount] = useState({ sol: 12, diamond: 3, candle: 2, bag: 1 });

  // Mobile controls state
  const [joystickVector, setJoystickVector] = useState({ x: 0, y: 0 });
  const [isSprinting, setIsSprinting] = useState(false);
  const [jumpDistrictId, setJumpDistrictId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Market & Events data
  const [market, setMarket] = useState<Token[]>(demoTokens);
  const [toastMessage, setToastMessage] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);

  const events = [
    { type: "whale", title: "Whale Buy", sub: "+250,000 USDC", time: "2m", icon: "🐋" },
    { type: "pump", title: "TOKEN +42%", sub: "$CAT up 42%", time: "5m", icon: "📈", hot: true },
    { type: "ath", title: "New ATH", sub: "$MOON reaches ATH", time: "12m", icon: "🔥" },
    { type: "join", title: "Top Trader Joined", sub: "@DegenWhale", time: "18m", icon: "👤" },
  ];

  useEffect(() => {
    setIsMuted(sounds.isMuted());
    // Show tutorial on first visit
    try {
      const hasSeen = localStorage.getItem('ct-arena-tutorial-seen');
      if (!hasSeen) {
        // Small delay so the world loads first
        const t = setTimeout(() => setShowHelpModal(true), 800);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  const toggleSound = () => {
    const next = sounds.toggleMute();
    setIsMuted(next);
  };

  const closeHelpModal = () => {
    setShowHelpModal(false);
    try {
      localStorage.setItem('ct-arena-tutorial-seen', '1');
    } catch {}
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2800);
  };

  // Collect XP callback (Little Kerala style item pickup)
  const handleCollectXP = useCallback((amount: number, itemType: string) => {
    setPlayerXP((prev) => {
      const next = prev + amount;
      if (next >= 5000) {
        setPlayerLevel((l) => l + 1);
        sounds.playDiamond();
        showToast("🎉 LEVEL UP! You reached Level 13!");
        return next - 5000;
      }
      return next;
    });

    setCollectedCount((prev) => {
      if (itemType === "sol_coin") return { ...prev, sol: prev.sol + 1 };
      if (itemType === "diamond") return { ...prev, diamond: prev.diamond + 1 };
      if (itemType === "god_candle") return { ...prev, candle: prev.candle + 1 };
      if (itemType === "whale_bag") return { ...prev, bag: prev.bag + 1 };
      return prev;
    });
  }, []);

  // Inspect Trader callback
  const handleInspectTrader = useCallback((trader: any) => {
    setSelectedTrader(trader);
    setIsFollowing(false);
  }, []);

  // Follow on X action
  const handleFollowTrader = () => {
    if (!selectedTrader) return;
    setIsFollowing(!isFollowing);
    sounds.playCoin();
    if (!isFollowing) {
      setQuestProgress((p) => {
        const next = Math.min(5, p + 1);
        if (next === 5 && p < 5) {
          // Quest completed!
          setTimeout(() => {
            sounds.playDiamond();
            showToast("🏆 QUEST COMPLETE! +500 XP - You're rising to legend!");
          }, 500);
        }
        return next;
      });
      showToast(`Followed ${selectedTrader.handle} on X! (+100 XP)`);
      handleCollectXP(100, "diamond");
    } else {
      showToast(`Unfollowed ${selectedTrader.handle}`);
    }
  };

  const handleShareToX = () => {
    if (!selectedTrader) return;
    const text = `Exploring the living world of Crypto Twitter in CT Meme Arena! Just inspected ${selectedTrader.handle} (PnL: +${money(selectedTrader.pnl)}) in ${playerCoords.district}! 🚀`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const navItems = [
    { id: "EXPLORE", label: "EXPLORE", icon: Compass },
    { id: "TRADERS", label: "TRADERS", icon: Users },
    { id: "WALLETS", label: "WALLETS", icon: Wallet },
    { id: "TRADE", label: "TRADE", icon: ArrowLeftRight },
    { id: "QUESTS", label: "QUESTS", icon: CheckSquare },
    { id: "LEADERBOARD", label: "LEADERBOARD", icon: BarChart3 },
    { id: "INVENTORY", label: "INVENTORY", icon: Briefcase },
    { id: "SETTINGS", label: "SETTINGS", icon: Settings },
  ];

  return (
    <main className="arena-root-viewport">
      {/* 1. Full-Screen Interactive Game Canvas (Little Kerala 3D Promenade) */}
      <CTWorldCanvas
        joystickVector={joystickVector}
        isSprinting={isSprinting}
        onInspectTrader={handleInspectTrader}
        onCollectXP={handleCollectXP}
        onUpdateCoords={setPlayerCoords}
        jumpDistrictId={jumpDistrictId}
        onResetJump={() => setJumpDistrictId(null)}
      />

      {/* 2. Top-Left Logo & Subtitle */}
      <div className="arena-top-left">
        <div className="arena-title-row">
          <h1>CT ARENA</h1>
        </div>
        <div className="arena-subtitle">THE LIVING WORLD OF CRYPTO TWITTER</div>
      </div>

      {/* 3. Top-Right Profile & Wallet Bar */}
      <header className="arena-top-right">
        {/* Profile Avatar Pill */}
        <div className="top-profile-pill" onClick={() => setShowModal("PROFILE")}>
          <div className="top-avatar">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces"
              alt="Player"
            />
            <span className="top-level-dot">12</span>
          </div>
        </div>

        {/* Wallet Pill */}
        <div
          className="top-wallet-pill"
          onClick={() => {
            navigator.clipboard?.writeText("0xA7F84dE39B2Ce104f9812A84E1");
            sounds.playCoin();
            showToast("Wallet address copied to clipboard!");
          }}
          title="Click to copy wallet address"
        >
          <span className="wallet-addr">0xA7F…3B2C</span>
          <span className="wallet-icon-coin">◎</span>
          <span className="wallet-balance">12.45 SOL</span>
        </div>

        {/* Sound Toggle */}
        <button className="top-icon-btn" onClick={toggleSound} title={isMuted ? "Unmute Sound" : "Mute Sound"}>
          {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>

        {/* Hamburger Menu (Opens Mobile Drawer or Guide) */}
        <button
          className="top-icon-btn"
          onClick={() => setShowMobileDrawer(true)}
          title="Open Menu / Navigation"
        >
          <Menu size={18} />
        </button>
      </header>

      {/* 4. Left Sidebar Navigation (Matching Screenshot) */}
      <aside className="arena-left-sidebar">
        <nav className="sidebar-nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  sounds.playInspect();
                  setActiveNav(item.id);
                  if (item.id !== "EXPLORE") setShowModal(item.id);
                }}
              >
                <Icon size={18} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* 5. Right Side Floating Cards Stack (Matching Screenshot) */}
      <aside className="arena-right-stack">
        {/* Card 1: LIVE EVENTS */}
        <div className="arena-glass-card events-card">
          <div className="card-header-row">
            <div className="live-pill">
              <span className="live-dot" />
              <span>LIVE EVENTS</span>
            </div>
          </div>
          <div className="events-list">
            {events.map((ev, i) => (
              <div className="event-item-row" key={i}>
                <span className="event-icon">{ev.icon}</span>
                <div className="event-info">
                  <div className="event-title-line">
                    <span className="event-title">{ev.title}</span>
                    <span className="event-time">{ev.time}</span>
                  </div>
                  <span className="event-sub">{ev.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: CURRENT QUEST */}
        <div className="arena-glass-card quest-card" onClick={() => setShowModal("QUESTS")}>
          <div className="card-header-row">
            <div className="live-pill">
              <span className="live-dot" />
              <span>CURRENT QUEST</span>
            </div>
            <span className="quest-count">{questProgress}/5</span>
          </div>
          <div className="quest-title-row">
            <h4>Follow 5 Top Traders</h4>
            <span className="quest-xp-reward">+500 XP</span>
          </div>
          <div className="quest-progress-track">
            <div className="quest-progress-bar" style={{ width: `${(questProgress / 5) * 100}%` }} />
          </div>
        </div>

        {/* Card 3: SEASON 01 - RISE TO LEGEND */}
        <div className="arena-glass-card season-card" onClick={() => setShowModal("LEADERBOARD")}>
          <div className="season-content-wrap">
            <div className="season-trophy-icon">
              <span className="trophy-gold">🏆</span>
            </div>
            <div className="season-meta">
              <div className="season-kicker">SEASON 01</div>
              <h3 className="season-headline">RISE TO LEGEND</h3>
              <p className="season-sub">RANK HIGHER. EARN REWARDS. MAKE YOUR MARK.</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 6. Bottom-Left Circular Radar Minimap (Matching Screenshot) */}
      <div className="arena-radar-minimap">
        <div className="radar-circle">
          <div className="radar-sweep-beam" />
          <div className="radar-roads" />
          <div className="compass-n">N</div>
          {/* Dynamic Radar Blips */}
          <span className="radar-marker marker-sol" style={{ top: "35%", left: "28%" }}>◎</span>
          <span className="radar-marker marker-diamond" style={{ top: "68%", left: "34%" }}>💎</span>
          <span className="radar-marker marker-trader" style={{ top: "42%", left: "62%" }}>👑</span>
          <span className="radar-marker marker-trader" style={{ top: "54%", left: "74%" }}>👑</span>
          <div className="radar-player-dot" />
        </div>
        <div className="radar-coords-pill">
          <b>{playerCoords.district}</b>
          <small>
            X: {playerCoords.x} &nbsp; Y: {playerCoords.y}
          </small>
        </div>
      </div>

      {/* 7. Bottom-Center Player HUD / Action Bar (Matching Screenshot) */}
      <div className="arena-player-hud-bar">
        {/* Left Profile Capsule */}
        <div className="hud-profile-cluster" onClick={() => setShowModal("PROFILE")}>
          <div className="hud-avatar-circle">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces"
              alt="Player Avatar"
            />
          </div>
          <div className="hud-xp-box">
            <div className="hud-level-tag">Lv. {playerLevel}</div>
            <div className="hud-xp-track">
              <div className="hud-xp-fill" style={{ width: `${(playerXP / 5000) * 100}%` }} />
            </div>
            <div className="hud-xp-numbers">X: {playerXP} / 5,000 XP</div>
          </div>
        </div>

        {/* Action Button Strip (Matching Screenshot) */}
        <div className="hud-actions-group">
          <button
            className={`hud-btn ${activeNav === "EXPLORE" ? "active" : ""}`}
            onClick={() => {
              setActiveNav("EXPLORE");
              sounds.playCoin();
            }}
          >
            <Compass size={18} />
            <span>Explore</span>
          </button>
          <button
            className={`hud-btn ${activeNav === "MAP" ? "active" : ""}`}
            onClick={() => {
              sounds.playDistrictSwoosh();
              setShowModal("MAP");
            }}
          >
            <MapIcon size={18} />
            <span>Map</span>
          </button>
          <button
            className={`hud-btn ${activeNav === "TRADE" ? "active" : ""}`}
            onClick={() => setShowModal("TRADE")}
          >
            <ArrowLeftRight size={18} />
            <span>Trade</span>
          </button>
          <button
            className={`hud-btn ${activeNav === "QUESTS" ? "active" : ""}`}
            onClick={() => setShowModal("QUESTS")}
          >
            <Flag size={18} />
            <span>Quests</span>
          </button>
          <button
            className={`hud-btn ${activeNav === "TRADERS" ? "active" : ""}`}
            onClick={() => setShowModal("LEADERBOARD")}
          >
            <Users size={18} />
            <span>Social</span>
          </button>
          <button
            className="hud-btn"
            onClick={() => setShowHelpModal(true)}
          >
            <MoreHorizontal size={18} />
            <span>More</span>
          </button>
        </div>
      </div>

      {/* 8. Bottom Ticker Marquee (Matching Screenshot) */}
      <footer className="arena-bottom-marquee">
        <div className="marquee-badge">MARKET</div>
        <div className="marquee-scroll">
          {market.slice(0, 8).map((t) => (
            <div className="marquee-token" key={t.id} onClick={() => setShowModal("TRADE")}>
              <span className="token-emoji">{t.emoji}</span>
              <span className="token-sym">${t.symbol}</span>
              <span className={`token-pct ${t.change24h >= 0 ? "up" : "down"}`}>
                {t.change24h >= 0 ? "+" : ""}{t.change24h.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
        <div className="marquee-tagline">
          <strong>CT ARENA</strong>
          <small>EXPLORE. TRADE. CONNECT.</small>
        </div>
      </footer>

      {/* 9. Mobile Touch Cluster (Analog Joystick + Action Buttons) */}
      <div className="arena-mobile-touch-cluster">
        <div className="mobile-joystick-container">
          <VirtualJoystick
            size={105}
            onMove={(v) => setJoystickVector(v)}
            onEnd={() => setJoystickVector({ x: 0, y: 0 })}
          />
        </div>

        <div className="mobile-actions-container">
          <button
            className={`touch-btn sprint ${isSprinting ? "active" : ""}`}
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: isSprinting ? "#22c55e" : "rgba(22, 101, 52, 0.92)",
              border: "1.5px solid #22c55e",
              color: "#ffffff",
              boxShadow: isSprinting ? "0 0 25px #22c55e" : "0 4px 20px rgba(34, 197, 94, 0.5)",
              cursor: "pointer",
              touchAction: "none",
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              setIsSprinting(true);
              sounds.playBoost();
            }}
            onTouchEnd={() => setIsSprinting(false)}
            onMouseDown={() => {
              setIsSprinting(true);
              sounds.playBoost();
            }}
            onMouseUp={() => setIsSprinting(false)}
          >
            <Zap size={20} />
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 0.5 }}>SPRINT</span>
          </button>

          <button
            className="touch-btn inspect"
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(2, 132, 199, 0.92)",
              border: "1.5px solid #38bdf8",
              color: "#ffffff",
              boxShadow: "0 4px 20px rgba(56, 189, 248, 0.5)",
              cursor: "pointer",
              touchAction: "none",
            }}
            onClick={() => {
              if (selectedTrader) {
                sounds.playInspect();
              } else {
                showToast("Walk near a trader to inspect!");
              }
            }}
          >
            <Search size={20} />
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 0.5 }}>INSPECT</span>
          </button>
        </div>
      </div>

      {/* 10. Mobile Slide-Out Navigation Drawer */}
      {showMobileDrawer && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowMobileDrawer(false)}>
          <div className="mobile-drawer-sheet">
            <div className="drawer-header-row">
              <div className="drawer-brand">
                <h2>CT ARENA</h2>
                <small>Metaverse of Crypto Twitter</small>
              </div>
              <button className="drawer-close-btn" onClick={() => setShowMobileDrawer(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="drawer-wallet-card">
              <div className="drawer-wallet-left">
                <span className="drawer-wallet-sym">◎</span>
                <div>
                  <b>12.45 SOL</b>
                  <small>0xA7F…3B2C</small>
                </div>
              </div>
              <div className="drawer-level-pill">Lv. {playerLevel}</div>
            </div>

            <div className="drawer-nav-grid">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className="drawer-nav-card"
                    onClick={() => {
                      sounds.playInspect();
                      setActiveNav(item.id);
                      setShowMobileDrawer(false);
                      if (item.id !== "EXPLORE") setShowModal(item.id);
                    }}
                  >
                    <Icon size={20} color="#38BDF8" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              className="drawer-guide-btn"
              onClick={() => {
                setShowMobileDrawer(false);
                setShowHelpModal(true);
              }}
            >
              <Gamepad2 size={18} />
              <span>How to Play & Controls</span>
            </button>
          </div>
        </div>
      )}

      {/* 11. Trader Profile Modal */}
      {selectedTrader && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setSelectedTrader(null)}>
          <div className="sheet-modal-card profile-card">
            <button className="sheet-close-btn" onClick={() => setSelectedTrader(null)}>
              <X size={18} />
            </button>

            <div className="profile-header-banner">
              <div className="profile-avatar-box">
                <div className="avatar-big">{selectedTrader.displayName?.slice(0, 2).toUpperCase() || "CT"}</div>
                <div className="profile-names">
                  <div className="trader-title-row">
                    <h3>{selectedTrader.displayName}</h3>
                    <span className="role-tag" style={{ borderColor: selectedTrader.roleColor || "#38BDF8" }}>
                      {selectedTrader.role || "WHALE"}
                    </span>
                  </div>
                  <span className="handle-tag">{selectedTrader.handle}</span>
                </div>
              </div>

              <div className="profile-action-btns">
                <button
                  className={`action-btn follow ${isFollowing ? "following" : ""}`}
                  onClick={handleFollowTrader}
                >
                  {isFollowing ? "FOLLOWING ✓" : "+ FOLLOW ON X"}
                </button>
              </div>
            </div>

            <div className="profile-pnl-banner">
              <div className="pnl-box">
                <small>REALIZED PNL</small>
                <div className="profit-huge">+{money(selectedTrader.pnl || 1250000)}</div>
              </div>
              <div className="pnl-box">
                <small>30D VOLUME</small>
                <div>{money(selectedTrader.volume || 5400000)}</div>
              </div>
              <div className="pnl-box">
                <small>WIN RATE</small>
                <div>84.0%</div>
              </div>
            </div>

            <div className="profile-stats-grid">
              <div className="stat-pill">
                <b>{selectedTrader.fomo || 88}/100</b>
                <small>FOMO</small>
              </div>
              <div className="stat-pill">
                <b>{selectedTrader.diamond || 92}/100</b>
                <small>DIAMOND</small>
              </div>
              <div className="stat-pill">
                <b>{selectedTrader.sniper || 76}/100</b>
                <small>SNIPER</small>
              </div>
              <div className="stat-pill">
                <b>{selectedTrader.wins || 42}/{selectedTrader.losses || 8}</b>
                <small>W/L</small>
              </div>
            </div>

            <div className="profile-body-split">
              <div className="profile-box">
                <h4>💼 CURRENT BAG</h4>
                <div className="bag-list">
                  {[
                    { sym: "SOL", val: 840000, pnl: 420000 },
                    { sym: "BONK", val: 290000, pnl: 115000 },
                    { sym: "WIF", val: 180000, pnl: 45000 },
                  ].map((b) => (
                    <div className="bag-item" key={b.sym}>
                      <b>${b.sym}</b>
                      <span>{money(b.val)}</span>
                      <small className="profit-up">+{money(b.pnl)}</small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="profile-box">
                <h4>📈 RECENT TRADES</h4>
                <div className="trades-feed">
                  {[
                    { side: "BUY", sym: "SOL", pnl: 48000 },
                    { side: "SELL", sym: "BONK", pnl: 31000 },
                    { side: "BUY", sym: "WIF", pnl: 18400 },
                  ].map((t, i) => (
                    <div className="trade-item" key={i}>
                      <span className={`side-chip ${t.side === "BUY" ? "buy" : "sell"}`}>{t.side}</span>
                      <b>${t.sym}</b>
                      <span className="profit-up">+{money(t.pnl)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="profile-footer-row">
              <div className="wallet-code">
                <span>WALLET:</span>
                <code>{short(selectedTrader.wallet || "0x8f3c7a912b4e5d82")}</code>
              </div>
              <div className="footer-btns">
                <button className="footer-btn" onClick={handleShareToX}>
                  <Share2 size={14} /> SHARE ON X
                </button>
                <button
                  className="footer-btn primary"
                  onClick={() => {
                    navigator.clipboard?.writeText(selectedTrader.wallet || "0x8f3c7a912b4e5d82");
                    sounds.playCoin();
                    showToast("Wallet address copied!");
                  }}
                >
                  COPY WALLET
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map / Fast Teleport Modal */}
      {showModal === "MAP" && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowModal(null)}>
          <div className="sheet-modal-card">
            <button className="sheet-close-btn" onClick={() => setShowModal(null)}>
              <X size={18} />
            </button>
            <div className="sheet-title-row">
              <MapIcon size={24} color="#38BDF8" />
              <div>
                <h2>PROMENADE DISTRICTS</h2>
                <small>Select a district to fast-teleport across the arena:</small>
              </div>
            </div>

            <div className="districts-teleport-grid">
              {[
                { id: "solana", name: "SOLANA CITY", desc: "Golden Bull Statue & High-Speed Plaza", sym: "◎", color: "#9945FF" },
                { id: "fomo", name: "FOMO DISTRICT", desc: "Neon Signs & 100x God Candles", sym: "🔥", color: "#FF007A" },
                { id: "sniper", name: "SNIPER ALLEY", desc: "Block 0 MEV Bots & Crosshair Lounge", sym: "⚡", color: "#06B6D4" },
                { id: "base", name: "BASE BLOCK", desc: "Onchain Summer & Aerodrome Hub", sym: "🔵", color: "#0052FF" },
                { id: "whale", name: "WHALE BEACH", desc: "8-Figure Cabal Marina & Mega Bags", sym: "🐋", color: "#0D9488" },
              ].map((d) => (
                <button
                  key={d.id}
                  className="district-teleport-card"
                  onClick={() => {
                    setJumpDistrictId(d.id);
                    setShowModal(null);
                    showToast(`Teleporting to ${d.name}!`);
                  }}
                >
                  <span className="tele-icon" style={{ color: d.color }}>{d.sym}</span>
                  <div className="tele-info">
                    <h3>{d.name}</h3>
                    <small>{d.desc}</small>
                  </div>
                  <ChevronRight size={18} color="#64748B" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showModal === "LEADERBOARD" && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowModal(null)}>
          <div className="sheet-modal-card">
            <button className="sheet-close-btn" onClick={() => setShowModal(null)}>
              <X size={18} />
            </button>
            <div className="sheet-title-row">
              <BarChart3 size={24} color="#FACC15" />
              <div>
                <h2>FAME BOARD · SEASON 01</h2>
                <small>Top Traders ranked by Realized PnL & Win Rate</small>
              </div>
            </div>

            <div className="leader-table-view">
              {DEMO_PLAYERS.slice(0, 8).map((p, idx) => (
                <div
                  key={p.wallet}
                  className="leader-item-row"
                  onClick={() => {
                    handleInspectTrader(p);
                    setShowModal(null);
                  }}
                >
                  <span className="rank-badge">#{idx + 1}</span>
                  <div className="leader-avatar-circle">{p.displayName.slice(0, 2).toUpperCase()}</div>
                  <div className="leader-meta">
                    <b>{p.displayName}</b>
                    <small>{p.handle} · {p.chain.toUpperCase()}</small>
                  </div>
                  <div className="leader-fomo">
                    <b>{p.fomo}/100</b>
                    <small>FOMO</small>
                  </div>
                  <div className="leader-profit">
                    <strong>+{money(p.pnl)}</strong>
                    <small>{p.wins}W / {p.losses}L</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trade Pit Modal */}
      {showModal === "TRADE" && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowModal(null)}>
          <div className="sheet-modal-card">
            <button className="sheet-close-btn" onClick={() => setShowModal(null)}>
              <X size={18} />
            </button>
            <div className="sheet-title-row">
              <Activity size={24} color="#38BDF8" />
              <div>
                <h2>LIVE TRADING PIT</h2>
                <small>DEX Screener Live Solana & Multi-Chain Meme Pairs</small>
              </div>
            </div>

            <div className="trade-tokens-grid">
              {market.map((t) => (
                <div className="trade-card" key={t.id}>
                  <div className="trade-card-header">
                    <span className="token-sym-badge">{t.emoji} ${t.symbol}</span>
                    <span className={`trade-change ${t.change24h >= 0 ? "up" : "down"}`}>
                      {t.change24h >= 0 ? "+" : ""}{t.change24h.toFixed(1)}%
                    </span>
                  </div>
                  <div className="trade-price-row">
                    <span>PRICE</span>
                    <b>{t.price < 1 ? t.price.toFixed(6) : t.price.toFixed(2)}</b>
                  </div>
                  <button
                    className="trade-action-btn"
                    onClick={() => {
                      sounds.playCoin();
                      showToast(`Generated trade route for $${t.symbol}!`);
                    }}
                  >
                    SWAP / TRADE →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && closeHelpModal()}>
          <div className="help-modal-card">
            <button className="sheet-close-btn" onClick={closeHelpModal}>
              <X size={18} />
            </button>
            <div className="sheet-title-row">
              <Gamepad2 size={26} color="#38BDF8" />
              <div>
                <h2>HOW TO PLAY CT MEME ARENA</h2>
                <small>Little Kerala Style Gameplay + Crypto Twitter Metaverse</small>
              </div>
            </div>

            <div className="help-body">
              <div className="help-box">
                <h4>🕹️ MOVEMENT</h4>
                <p>
                  <b>PC:</b> Use <code>W, A, S, D</code> or <code>Arrow Keys</code>. Click anywhere on the promenade to walk.
                  <br />
                  <b>Mobile:</b> Drag the virtual analog joystick on the bottom-left. Tap <code>SPRINT</code> for turbo speed!
                </p>
              </div>

              <div className="help-box">
                <h4>💎 COLLECTIBLES</h4>
                <p>
                  Walk over floating <b>$SOL Coins</b>, <b>Diamond Hands</b>, <b>Whale Bags</b>, and <b>God Candles</b> to earn XP and level up!
                </p>
              </div>

              <div className="help-box">
                <h4>👥 INSPECT TRADERS</h4>
                <p>
                  Walk near any wandering trader or press <b>INSPECT</b> to view their real on-chain PnL, holdings, and follow them.
                </p>
              </div>
            </div>

            <button className="help-play-btn" onClick={closeHelpModal}>
              LET'S PLAY!
            </button>
          </div>
        </div>
      )}

      {/* Floating Toast Message */}
      {toastMessage && <div className="arena-toast-pill">{toastMessage}</div>}
    </main>
  );
}
