"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { sounds } from "@/lib/audio";

export interface District {
  id: string;
  name: string;
  symbol: string;
  accent: string;
  desc: string;
}

export interface Collectible {
  id: string;
  type: "sol_coin" | "diamond" | "god_candle" | "whale_bag";
  x: number; // 0 to 1 normalized world coordinate
  y: number; // 0 to 1 normalized world coordinate
  xp: number;
  label: string;
  symbol: string;
  color: string;
  bobOffset: number;
}

export interface WanderingTrader {
  id: string;
  handle: string;
  role: string;
  roleColor: string;
  pnl: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  facing: number;
  walkCycle: number;
  bubbleText?: string;
  bubbleTimer?: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  life: number;
  size: number;
}

const TRADER_ARCHETYPES: Array<{ handle: string; role: string; roleColor: string; pnl: number }> = [
  { handle: "@SolHunter", role: "EARLY", roleColor: "#45dfff", pnl: 842000 },
  { handle: "@AlphaChad", role: "RESEARCHER", roleColor: "#facc15", pnl: 1250000 },
  { handle: "@DegenAlpha", role: "SNIPER", roleColor: "#ff4cb1", pnl: 2480000 },
  { handle: "@WhaleMode", role: "WHALE", roleColor: "#38bdf8", pnl: 8900000 },
  { handle: "@DiamondMax", role: "DIAMOND HANDS", roleColor: "#22d3ee", pnl: 1840000 },
  { handle: "@BasedQuneri", role: "NFT COLLECTOR", roleColor: "#a855f7", pnl: 620000 },
  { handle: "@MintQueen", role: "NFT COLLECTOR", roleColor: "#ec4899", pnl: 940000 },
];

const SPEECH_QUOTES = [
  "higher highs \u25ce", "god candle incoming \ud83d\udd6f\ufe0f", "buying the dip \ud83d\udc8e", 
  "sending it \ud83d\ude80", "whale alert \ud83d\udc0b", "based and onchain \ud83d\udd35", "gm CT \u2615"
];

interface CTWorldCanvasProps {
  joystickVector: { x: number; y: number };
  isSprinting: boolean;
  onInspectTrader: (trader: any) => void;
  onCollectXP: (amount: number, itemType: string) => void;
  onUpdateCoords: (coords: { district: string; x: number; y: number }) => void;
  jumpDistrictId?: string | null;
  onResetJump?: () => void;
}

export default function CTWorldCanvas({
  joystickVector,
  isSprinting,
  onInspectTrader,
  onCollectXP,
  onUpdateCoords,
  jumpDistrictId,
  onResetJump,
}: CTWorldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Player state in normalized world coordinates [0..1, 0..1]
  const playerRef = useRef({
    x: 0.49,
    y: 0.72,
    vx: 0,
    vy: 0,
    facing: -Math.PI / 2, // Facing up towards Solana City bull statue
    targetX: null as number | null,
    targetY: null as number | null,
    walkCycle: 0,
    turboTimer: 0,
  });

  // Smooth Camera state (viewport offset in world pixels)
  const cameraRef = useRef({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  const tradersRef = useRef<WanderingTrader[]>([]);
  const collectiblesRef = useRef<Collectible[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatTextsRef = useRef<FloatingText[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const textIdCounter = useRef(0);
  const bgImgRef = useRef<HTMLImageElement | null>(null);

  // Initialize Collectibles across the promenade
  const spawnCollectibles = useCallback(() => {
    const items: Collectible[] = [];
    const configs = [
      { type: "sol_coin" as const, label: "$SOL Coin", symbol: "\u25ce", color: "#14F195", xp: 25, count: 6 },
      { type: "diamond" as const, label: "Diamond Hands", symbol: "\ud83d\udc8e", color: "#38BDF8", xp: 50, count: 4 },
      { type: "god_candle" as const, label: "God Candle", symbol: "\ud83d\udd6f\ufe0f", color: "#22C55E", xp: 100, count: 2 },
      { type: "whale_bag" as const, label: "Whale Bag", symbol: "\ud83d\udcbc", color: "#FACC15", xp: 75, count: 3 },
    ];

    let idIdx = 0;
    configs.forEach((cfg) => {
      for (let i = 0; i < cfg.count; i++) {
        // Walkable plaza range: x: 0.16 to 0.84, y: 0.50 to 0.86
        const x = 0.16 + Math.random() * 0.68;
        const y = 0.50 + Math.random() * 0.36;
        items.push({
          id: `item_${idIdx++}_${cfg.type}`,
          type: cfg.type,
          x,
          y,
          xp: cfg.xp,
          label: cfg.label,
          symbol: cfg.symbol,
          color: cfg.color,
          bobOffset: Math.random() * Math.PI * 2,
        });
      }
    });

    collectiblesRef.current = items;
  }, []);

  // Initialize Wandering Traders
  const spawnTraders = useCallback(() => {
    const traders: WanderingTrader[] = TRADER_ARCHETYPES.map((arch, idx) => {
      const x = 0.18 + (idx / TRADER_ARCHETYPES.length) * 0.64;
      const y = 0.52 + (idx % 3) * 0.12;
      return {
        id: `trader_${idx}`,
        handle: arch.handle,
        role: arch.role,
        roleColor: arch.roleColor,
        pnl: arch.pnl,
        x,
        y,
        targetX: 0.18 + Math.random() * 0.64,
        targetY: 0.50 + Math.random() * 0.34,
        speed: 0.0004 + Math.random() * 0.0004,
        facing: Math.random() * Math.PI * 2,
        walkCycle: Math.random() * 10,
        bubbleTimer: 100 + Math.random() * 300,
        bubbleText: SPEECH_QUOTES[idx % SPEECH_QUOTES.length],
      };
    });
    tradersRef.current = traders;
  }, []);

  // Preload Background Image
  useEffect(() => {
    const img = new Image();
    img.src = "/arena_promenade.jpg";
    img.onload = () => {
      bgImgRef.current = img;
    };
    spawnCollectibles();
    spawnTraders();
  }, [spawnCollectibles, spawnTraders]);

  // Fast Teleport Handler
  useEffect(() => {
    if (!jumpDistrictId) return;
    const player = playerRef.current;
    if (jumpDistrictId === "solana") {
      player.x = 0.49;
      player.y = 0.62;
    } else if (jumpDistrictId === "fomo") {
      player.x = 0.24;
      player.y = 0.54;
    } else if (jumpDistrictId === "sniper") {
      player.x = 0.24;
      player.y = 0.78;
    } else if (jumpDistrictId === "base") {
      player.x = 0.74;
      player.y = 0.56;
    } else if (jumpDistrictId === "whale") {
      player.x = 0.82;
      player.y = 0.78;
    }
    player.vx = 0;
    player.vy = 0;
    player.targetX = null;
    player.targetY = null;

    sounds.playDistrictSwoosh();
    if (onResetJump) {
      onResetJump();
    }
  }, [jumpDistrictId, onResetJump]);

  // Keyboard listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Main Canvas Render & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let lastTime = performance.now();

    // Click to move or inspect
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickScreenX = e.clientX - rect.left;
      const clickScreenY = e.clientY - rect.top;

      const w = canvas.width;
      const h = canvas.height;
      const aspect = 16 / 9;
      const worldW = Math.max(w, h * aspect);
      const worldH = Math.max(h, w / aspect);
      const cam = cameraRef.current;

      const clickWorldX = clickScreenX + cam.x;
      const clickWorldY = clickScreenY + cam.y;
      const clickNormX = clickWorldX / worldW;
      const clickNormY = clickWorldY / worldH;

      // Check if clicked on a trader
      let clickedTrader: WanderingTrader | null = null;
      tradersRef.current.forEach((t) => {
        const twx = t.x * worldW;
        const twy = t.y * worldH;
        const dist = Math.hypot(clickWorldX - twx, clickWorldY - twy);
        if (dist < 40) {
          clickedTrader = t;
        }
      });

      if (clickedTrader) {
        sounds.playInspect();
        onInspectTrader({
          displayName: (clickedTrader as WanderingTrader).handle.replace(/^@/, ""),
          handle: (clickedTrader as WanderingTrader).handle,
          chain: "solana",
          pnl: (clickedTrader as WanderingTrader).pnl,
          unrealized: Math.round((clickedTrader as WanderingTrader).pnl * 0.28),
          volume: Math.round((clickedTrader as WanderingTrader).pnl * 4.2),
          wins: 42,
          losses: 8,
          level: 14,
          fomo: 88,
          diamond: 92,
          sniper: 78,
          wallet: "0x8f3c7a912b4e5d82",
        });
        return;
      }

      // Walk to clicked location (within walkable plaza)
      playerRef.current.targetX = Math.max(0.14, Math.min(0.86, clickNormX));
      playerRef.current.targetY = Math.max(0.48, Math.min(0.86, clickNormY));

      // Click ripple particles
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        particlesRef.current.push({
          x: clickWorldX,
          y: clickWorldY,
          vx: Math.cos(ang) * 1.5,
          vy: Math.sin(ang) * 1.5,
          color: "#38BDF8",
          alpha: 0.9,
          life: 20,
          size: 3,
        });
      }
    };

    canvas.addEventListener("click", handleCanvasClick);

    const render = (time: number) => {
      const dt = Math.min(40, time - lastTime) / 16.666;
      lastTime = time;

      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      // World dimensions maintaining 16:9 aspect ratio without stretching
      const aspect = 16 / 9;
      const worldW = Math.max(w, h * aspect);
      const worldH = Math.max(h, w / aspect);

      const player = playerRef.current;

      // Calculate player input
      let inputX = 0;
      let inputY = 0;

      if (keysRef.current["w"] || keysRef.current["arrowup"]) inputY -= 1;
      if (keysRef.current["s"] || keysRef.current["arrowdown"]) inputY += 1;
      if (keysRef.current["a"] || keysRef.current["arrowleft"]) inputX -= 1;
      if (keysRef.current["d"] || keysRef.current["arrowright"]) inputX += 1;

      if (Math.hypot(joystickVector.x, joystickVector.y) > 0.08) {
        inputX = joystickVector.x;
        inputY = joystickVector.y;
        player.targetX = null;
        player.targetY = null;
      }

      if (player.targetX !== null && player.targetY !== null) {
        const tdx = player.targetX - player.x;
        const tdy = player.targetY - player.y;
        const tdist = Math.hypot(tdx, tdy);
        if (tdist > 0.015) {
          inputX = tdx / tdist;
          inputY = tdy / tdist;
        } else {
          player.targetX = null;
          player.targetY = null;
        }
      }

      if (player.turboTimer > 0) player.turboTimer -= dt;
      const isTurbo = player.turboTimer > 0 || isSprinting;
      const maxSpeed = isTurbo ? 0.0055 : 0.0028;
      const accel = isTurbo ? 0.0012 : 0.0006;
      const friction = 0.82;

      if (inputX !== 0 || inputY !== 0) {
        const len = Math.hypot(inputX, inputY) || 1;
        const nx = inputX / len;
        const ny = inputY / len;
        player.vx += nx * accel * dt;
        player.vy += ny * accel * dt;
        player.facing = Math.atan2(ny, nx);
        player.walkCycle += 0.25 * dt;

        // Footstep ripples on wet pavement
        if (Math.random() < 0.25) {
          particlesRef.current.push({
            x: player.x * worldW,
            y: (player.y + 0.01) * worldH,
            vx: 0,
            vy: 0,
            color: "rgba(100, 200, 255, 0.4)",
            alpha: 0.6,
            life: 25,
            size: 2,
          });
        }
      }

      player.vx *= friction;
      player.vy *= friction;
      const curSpeed = Math.hypot(player.vx, player.vy);
      if (curSpeed > maxSpeed) {
        player.vx = (player.vx / curSpeed) * maxSpeed;
        player.vy = (player.vy / curSpeed) * maxSpeed;
      }

      // Walkable plaza boundaries matching the artwork
      player.x = Math.max(0.14, Math.min(0.86, player.x + player.vx * dt));
      player.y = Math.max(0.48, Math.min(0.86, player.y + player.vy * dt));

      // Determine current district name & coordinates
      let district = "SOLANA CITY";
      if (player.x < 0.32 && player.y < 0.65) district = "FOMO DISTRICT";
      else if (player.x < 0.34 && player.y >= 0.65) district = "SNIPER ALLEY";
      else if (player.x > 0.66 && player.y < 0.65) district = "BASE BLOCK";
      else if (player.x > 0.72 && player.y >= 0.65) district = "WHALE BEACH";

      const coordX = Math.round(1000 + player.x * 500);
      const coordY = Math.round(5000 + player.y * 1000);
      onUpdateCoords({ district, x: coordX, y: coordY });

      // Smooth Camera tracking
      const targetCamX = Math.max(0, Math.min(worldW - w, player.x * worldW - w / 2));
      const targetCamY = Math.max(0, Math.min(worldH - h, player.y * worldH - h / 2));
      const cam = cameraRef.current;
      cam.x += (targetCamX - cam.x) * 0.12 * dt;
      cam.y += (targetCamY - cam.y) * 0.12 * dt;

      // 1. Draw Background Image
      if (bgImgRef.current) {
        ctx.drawImage(bgImgRef.current, -cam.x, -cam.y, worldW, worldH);
      } else {
        ctx.fillStyle = "#070A12";
        ctx.fillRect(0, 0, w, h);
      }

      // 2. Ambient Neon Lighting & Wet Floor Glow Pulse
      const glowPulse = (Math.sin(time * 0.002) + 1) * 0.5;
      const gradSol = ctx.createRadialGradient(
        worldW * 0.5 - cam.x,
        worldH * 0.25 - cam.y,
        10,
        worldW * 0.5 - cam.x,
        worldH * 0.4 - cam.y,
        worldW * 0.3
      );
      gradSol.addColorStop(0, `rgba(56, 189, 248, ${0.08 + glowPulse * 0.04})`);
      gradSol.addColorStop(1, "transparent");
      ctx.fillStyle = gradSol;
      ctx.fillRect(0, 0, w, h);

      // 3. Update & Draw Collectibles (Little Kerala Style item pickup)
      const activeCollectibles: Collectible[] = [];
      const pWorldX = player.x * worldW;
      const pWorldY = player.y * worldH;

      collectiblesRef.current.forEach((item) => {
        const ix = item.x * worldW - cam.x;
        const itemDepth = 0.65 + (item.y - 0.48) / 0.38 * 0.55;
        const bob = Math.sin(time * 0.004 + item.bobOffset) * 6 * itemDepth;
        const iy = item.y * worldH - cam.y + bob;

        // Pickup collision detection (Little Kerala Style)
        const distToPlayer = Math.hypot(pWorldX - item.x * worldW, pWorldY - item.y * worldH);
        if (distToPlayer < 36 * itemDepth) {
          // Play retro Web Audio synthesizer sounds
          if (item.type === "sol_coin") sounds.playCoin();
          else if (item.type === "diamond") sounds.playDiamond();
          else if (item.type === "god_candle") {
            sounds.playBoost();
            player.turboTimer = 180; // 3-second turbo sprint
          } else sounds.playInspect();

          // Spawn floating XP notification
          textIdCounter.current += 1;
          floatTextsRef.current.push({
            id: textIdCounter.current,
            x: ix,
            y: iy - 20,
            text: `+${item.xp} XP! ${item.type === "god_candle" ? "\ud83d\udd6f\ufe0f TURBO!" : ""}`,
            color: item.color,
            alpha: 1,
            life: 45,
          });

          // Sparkle burst particles
          for (let p = 0; p < 12; p++) {
            const ang = (p / 12) * Math.PI * 2;
            const spd = 1.5 + Math.random() * 2.5;
            particlesRef.current.push({
              x: item.x * worldW,
              y: item.y * worldH,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              color: item.color,
              alpha: 1,
              life: 25,
              size: 2.5 + Math.random() * 2,
            });
          }

          onCollectXP(item.xp, item.type);

          // Respawn in random walkable plaza position after 4 seconds
          setTimeout(() => {
            collectiblesRef.current.push({
              ...item,
              x: 0.16 + Math.random() * 0.68,
              y: 0.50 + Math.random() * 0.36,
            });
          }, 4000);

          return;
        }

        // Wet pavement reflection
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(ix, item.y * worldH - cam.y + 14 * itemDepth, 14 * itemDepth, 5 * itemDepth, 0, 0, Math.PI * 2);
        ctx.fillStyle = `${item.color}33`;
        ctx.fill();

        // Glow ring
        ctx.beginPath();
        ctx.arc(ix, iy, 18 * itemDepth, 0, Math.PI * 2);
        ctx.fillStyle = `${item.color}22`;
        ctx.fill();

        // Icon circle
        ctx.beginPath();
        ctx.arc(ix, iy, 14 * itemDepth, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(7, 12, 22, 0.92)";
        ctx.fill();
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 2 * itemDepth;
        ctx.stroke();

        ctx.font = `bold ${Math.round(13 * itemDepth)}px Inter, sans-serif`;
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText(item.symbol, ix, iy + 4.5 * itemDepth);
        ctx.restore();

        activeCollectibles.push(item);
      });

      if (activeCollectibles.length < 8) spawnCollectibles();
      else collectiblesRef.current = activeCollectibles;

      // 4. Update & Draw Wandering CT Traders
      tradersRef.current.forEach((t) => {
        if (Math.hypot(t.targetX - t.x, t.targetY - t.y) < 0.02) {
          t.targetX = 0.16 + Math.random() * 0.68;
          t.targetY = 0.50 + Math.random() * 0.36;
        }

        const tdx = t.targetX - t.x;
        const tdy = t.targetY - t.y;
        const tlen = Math.hypot(tdx, tdy) || 1;
        t.x += (tdx / tlen) * t.speed * dt;
        t.y += (tdy / tlen) * t.speed * dt;
        t.facing = Math.atan2(tdy, tdx);
        t.walkCycle += 0.18 * dt;

        if (t.bubbleTimer !== undefined) {
          t.bubbleTimer -= dt;
          if (t.bubbleTimer <= 0) {
            t.bubbleTimer = 220 + Math.random() * 200;
            t.bubbleText = SPEECH_QUOTES[Math.floor(Math.random() * SPEECH_QUOTES.length)];
          }
        }

        const tx = t.x * worldW - cam.x;
        const ty = t.y * worldH - cam.y;
        const depth = 0.65 + (t.y - 0.48) / 0.38 * 0.55;

        // Shadow & Wet Reflection
        ctx.beginPath();
        ctx.ellipse(tx, ty + 12 * depth, 14 * depth, 5 * depth, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.fill();

        // Trader Body
        const bob = Math.sin(t.walkCycle) * 2.5 * depth;
        ctx.save();
        ctx.translate(tx, ty + bob);

        // Body capsule
        ctx.beginPath();
        ctx.roundRect(-8 * depth, -26 * depth, 16 * depth, 26 * depth, 8 * depth);
        ctx.fillStyle = "#1E293B";
        ctx.fill();
        ctx.strokeStyle = t.roleColor;
        ctx.lineWidth = 1.5 * depth;
        ctx.stroke();

        // Head
        ctx.beginPath();
        ctx.arc(0, -32 * depth, 7 * depth, 0, Math.PI * 2);
        ctx.fillStyle = "#CBD5E1";
        ctx.fill();

        // Glowing Nameplate Badge (Matching Screenshot)
        const nameText = t.handle;
        const roleText = t.role;
        ctx.font = `bold ${Math.max(8, Math.round(9.5 * depth))}px Inter, sans-serif`;
        const nameW = ctx.measureText(nameText).width + 16 * depth;
        const nameH = 26 * depth;
        const ny = -64 * depth;

        ctx.fillStyle = "rgba(7, 12, 22, 0.92)";
        ctx.strokeStyle = t.roleColor;
        ctx.lineWidth = 1.2 * depth;
        ctx.beginPath();
        ctx.roundRect(-nameW / 2, ny, nameW, nameH, 6 * depth);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText(nameText, 0, ny + 11 * depth);

        ctx.font = `bold ${Math.max(7, Math.round(7.5 * depth))}px Inter, sans-serif`;
        ctx.fillStyle = t.roleColor;
        ctx.fillText(roleText, 0, ny + 21 * depth);

        // Speech Bubble
        if (t.bubbleText) {
          ctx.font = `bold ${Math.max(8, Math.round(9 * depth))}px Inter, sans-serif`;
          const bw = ctx.measureText(t.bubbleText).width + 14 * depth;
          const bh = 20 * depth;
          const by = ny - 24 * depth;

          ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
          ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(-bw / 2, by, bw, bh, 5 * depth);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#F8FAFC";
          ctx.fillText(t.bubbleText, 0, by + 13 * depth);
        }

        // Proximity Inspect Chip
        const distToPlayer = Math.hypot(pWorldX - t.x * worldW, pWorldY - t.y * worldH);
        if (distToPlayer < 75 * depth) {
          const prompt = "\ud83d\udd0d Inspect";
          ctx.font = "bold 9px Inter, sans-serif";
          ctx.fillStyle = "rgba(56, 189, 248, 0.95)";
          ctx.beginPath();
          ctx.roundRect(-30, ny - 22, 60, 16, 8);
          ctx.fill();
          ctx.fillStyle = "#02121E";
          ctx.fillText(prompt, 0, ny - 11);
        }

        ctx.restore();
      });

      // 5. Draw Playable Character (CT Glowing Jacket in Center!)
      const px = player.x * worldW - cam.x;
      const py = player.y * worldH - cam.y;
      const playerDepth = 0.65 + (player.y - 0.48) / 0.38 * 0.55;
      const playerBob = Math.sin(player.walkCycle) * 3 * playerDepth;

      // Shadow & Wet Ground Reflection
      ctx.beginPath();
      ctx.ellipse(px, py + 16 * playerDepth, 18 * playerDepth, 7 * playerDepth, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.fill();

      // Blue ambient ground reflection below player
      ctx.beginPath();
      ctx.ellipse(px, py + 20 * playerDepth, 22 * playerDepth, 9 * playerDepth, 0, 0, Math.PI * 2);
      ctx.fillStyle = isTurbo ? "rgba(34, 197, 94, 0.25)" : "rgba(56, 189, 248, 0.20)";
      ctx.fill();

      ctx.save();
      ctx.translate(px, py + playerBob);

      // Character Legs / Jeans
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(-8 * playerDepth, 0, 6 * playerDepth, 16 * playerDepth);
      ctx.fillRect(2 * playerDepth, 0, 6 * playerDepth, 16 * playerDepth);

      // Shoes
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(-9 * playerDepth, 14 * playerDepth, 7 * playerDepth, 4 * playerDepth);
      ctx.fillRect(2 * playerDepth, 14 * playerDepth, 7 * playerDepth, 4 * playerDepth);

      // CT Jacket Body (Back view)
      ctx.beginPath();
      ctx.roundRect(-14 * playerDepth, -36 * playerDepth, 28 * playerDepth, 36 * playerDepth, 8 * playerDepth);
      ctx.fillStyle = "#090E17";
      ctx.fill();
      ctx.strokeStyle = isTurbo ? "#22C55E" : "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1.5 * playerDepth;
      ctx.stroke();

      // Glowing "CT" Logo on Jacket Back!
      ctx.font = `900 ${Math.round(12 * playerDepth)}px Inter, sans-serif`;
      ctx.fillStyle = isTurbo ? "#22C55E" : "#38BDF8";
      ctx.shadowColor = isTurbo ? "#22C55E" : "#38BDF8";
      ctx.shadowBlur = 12;
      ctx.textAlign = "center";
      ctx.fillText("CT", 0, -18 * playerDepth);
      ctx.shadowBlur = 0;

      // Head & Cap
      ctx.beginPath();
      ctx.arc(0, -44 * playerDepth, 9 * playerDepth, 0, Math.PI * 2);
      ctx.fillStyle = "#1E293B";
      ctx.fill();

      // Direction pointer
      ctx.save();
      ctx.rotate(player.facing);
      ctx.beginPath();
      ctx.moveTo(22 * playerDepth, 0);
      ctx.lineTo(16 * playerDepth, -5 * playerDepth);
      ctx.lineTo(16 * playerDepth, 5 * playerDepth);
      ctx.closePath();
      ctx.fillStyle = isTurbo ? "#22C55E" : "#38BDF8";
      ctx.fill();
      ctx.restore();

      ctx.restore();

      // 6. Floating XP Text Particles
      const activeTexts: FloatingText[] = [];
      floatTextsRef.current.forEach((t) => {
        t.y -= 1.2 * dt;
        t.life -= dt;
        t.alpha = Math.max(0, t.life / 45);

        ctx.save();
        ctx.font = "900 15px Inter, sans-serif";
        ctx.fillStyle = t.color;
        ctx.shadowColor = t.color;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = t.alpha;
        ctx.textAlign = "center";
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();

        if (t.life > 0) activeTexts.push(t);
      });
      floatTextsRef.current = activeTexts;

      // 7. Particles
      const activeParticles: Particle[] = [];
      particlesRef.current.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        p.alpha = Math.max(0, p.life / 25);

        const screenPX = p.x - cam.x;
        const screenPY = p.y - cam.y;

        ctx.beginPath();
        ctx.arc(screenPX, screenPY, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        if (p.life > 0) activeParticles.push(p);
      });
      ctx.globalAlpha = 1;
      particlesRef.current = activeParticles;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("click", handleCanvasClick);
    };
  }, [joystickVector, isSprinting, onInspectTrader, onCollectXP, onUpdateCoords, spawnCollectibles]);

  return (
    <div className="arena-canvas-wrapper">
      <canvas ref={canvasRef} className="arena-game-canvas" />
    </div>
  );
}
