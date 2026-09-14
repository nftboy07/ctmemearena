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
  jacketColor: string;
  skinTone: string;
  pnl: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  facing: number;
  walkCycle: number;
  isMoving: boolean;
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
  size: number;
  color: string;
  alpha: number;
  life: number;
}

export interface CTWorldCanvasProps {
  joystickVector?: { x: number; y: number };
  isSprinting?: boolean;
  onInspectTrader?: (trader: {
    handle: string;
    role: string;
    roleColor: string;
    pnl: number;
  }) => void;
  onCollectXP?: (amount: number, label: string) => void;
  onUpdateCoords?: (coords: { x: number; y: number; district: string }) => void;
  jumpDistrictId?: string | null;
  onResetJump?: () => void;
}

// Initial Wandering Crypto Twitter Traders
const INITIAL_TRADERS: WanderingTrader[] = [
  {
    id: "trader_satoshi",
    handle: "@SatoshiNakamoto",
    role: "FOUNDER",
    roleColor: "#F59E0B",
    jacketColor: "#1C1917",
    skinTone: "#F3D2B3",
    pnl: 14280.5,
    x: 0.62,
    y: 0.68,
    targetX: 0.66,
    targetY: 0.72,
    speed: 0.00035,
    facing: Math.PI / 2,
    walkCycle: 0,
    isMoving: true,
    bubbleText: "gm CT ☕",
    bubbleTimer: 280,
  },
  {
    id: "trader_alpha",
    handle: "@AlphaChad",
    role: "RESEARCHER",
    roleColor: "#38BDF8",
    jacketColor: "#0F2942",
    skinTone: "#E8C39E",
    pnl: 2840.0,
    x: 0.35,
    y: 0.58,
    targetX: 0.38,
    targetY: 0.54,
    speed: 0.00045,
    facing: 0,
    walkCycle: 1.5,
    isMoving: true,
    bubbleTimer: 350,
  },
  {
    id: "trader_degen",
    handle: "@DegenAlpha",
    role: "SNIPER",
    roleColor: "#F43F5E",
    jacketColor: "#3B0D23",
    skinTone: "#ECC8A8",
    pnl: 890.2,
    x: 0.28,
    y: 0.64,
    targetX: 0.32,
    targetY: 0.70,
    speed: 0.00065,
    facing: -Math.PI * 0.75,
    walkCycle: 2.2,
    isMoving: true,
    bubbleTimer: 450,
  },
  {
    id: "trader_solhunter",
    handle: "@SolHunter",
    role: "EARLY",
    roleColor: "#06B6D4",
    jacketColor: "#0E3A45",
    skinTone: "#DEB887",
    pnl: 5410.8,
    x: 0.20,
    y: 0.54,
    targetX: 0.18,
    targetY: 0.50,
    speed: 0.0005,
    facing: -Math.PI / 2,
    walkCycle: 0.8,
    isMoving: true,
    bubbleTimer: 520,
  },
  {
    id: "trader_whale",
    handle: "@WhaleMode",
    role: "WHALE",
    roleColor: "#0284C7",
    jacketColor: "#0B253A",
    skinTone: "#F5D0A9",
    pnl: 45200.0,
    x: 0.50,
    y: 0.52,
    targetX: 0.46,
    targetY: 0.56,
    speed: 0.0003,
    facing: Math.PI / 2,
    walkCycle: 1.0,
    isMoving: true,
    bubbleTimer: 400,
  },
  {
    id: "trader_diamond",
    handle: "@DiamondMax",
    role: "DIAMOND HANDS",
    roleColor: "#00F0FF",
    jacketColor: "#0A2838",
    skinTone: "#E0B790",
    pnl: 1940.4,
    x: 0.74,
    y: 0.64,
    targetX: 0.80,
    targetY: 0.68,
    speed: 0.0004,
    facing: 0,
    walkCycle: 3.0,
    isMoving: true,
    bubbleTimer: 300,
  },
  {
    id: "trader_quneri",
    handle: "@BasedQuneri",
    role: "NFT COLLECTOR",
    roleColor: "#A855F7",
    jacketColor: "#2E1065",
    skinTone: "#D7A87A",
    pnl: 3200.0,
    x: 0.66,
    y: 0.54,
    targetX: 0.62,
    targetY: 0.52,
    speed: 0.00045,
    facing: -Math.PI / 4,
    walkCycle: 0.4,
    isMoving: true,
    bubbleTimer: 600,
  },
  {
    id: "trader_mint",
    handle: "@MintQueen",
    role: "NFT COLLECTOR",
    roleColor: "#EC4899",
    jacketColor: "#3B0728",
    skinTone: "#F7D5B8",
    pnl: 4120.0,
    x: 0.78,
    y: 0.58,
    targetX: 0.74,
    targetY: 0.62,
    speed: 0.0005,
    facing: Math.PI,
    walkCycle: 1.8,
    isMoving: true,
    bubbleTimer: 480,
  },
  {
    id: "trader_cobie",
    handle: "@Cobie",
    role: "PODCASTER",
    roleColor: "#10B981",
    jacketColor: "#064E3B",
    skinTone: "#F2CEAA",
    pnl: 33400.0,
    x: 0.84,
    y: 0.53,
    targetX: 0.88,
    targetY: 0.56,
    speed: 0.00035,
    facing: 0,
    walkCycle: 2.1,
    isMoving: true,
    bubbleTimer: 550,
  }
];

export default function CTWorldCanvas({
  joystickVector,
  isSprinting = false,
  onInspectTrader,
  onCollectXP,
  onUpdateCoords,
  jumpDistrictId,
  onResetJump,
}: CTWorldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Player State
  const playerRef = useRef({
    x: 0.50,
    y: 0.66,
    vx: 0,
    vy: 0,
    facing: -Math.PI / 2, // facing north/up initially
    walkCycle: 0,
    isMoving: false,
    speed: 0.00065,
  });

  // World Elements
  const tradersRef = useRef<WanderingTrader[]>(INITIAL_TRADERS);
  const collectiblesRef = useRef<Collectible[]>([]);
  const floatTextsRef = useRef<FloatingText[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const isImageLoadedRef = useRef(false);

  // Keyboard State
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Target Move State
  const targetPosRef = useRef<{ x: number; y: number } | null>(null);

  // Spawn Collectibles around the arena
  const spawnCollectibles = useCallback(() => {
    const items: Collectible[] = [
      { id: "c1", type: "sol_coin", x: 0.32, y: 0.70, xp: 25, label: "+25 XP", symbol: "\u25ce", color: "#14F195", bobOffset: 0 },
      { id: "c2", type: "diamond", x: 0.44, y: 0.73, xp: 50, label: "+50 XP", symbol: "\ud83d\udc8e", color: "#00F0FF", bobOffset: 1.2 },
      { id: "c3", type: "god_candle", x: 0.24, y: 0.74, xp: 100, label: "+100 XP", symbol: "\ud83d\udd6f\ufe0f", color: "#22C55E", bobOffset: 2.5 },
      { id: "c4", type: "whale_bag", x: 0.36, y: 0.81, xp: 75, label: "+75 XP", symbol: "\ud83d\udcbc", color: "#F59E0B", bobOffset: 3.8 },
      { id: "c5", type: "sol_coin", x: 0.69, y: 0.76, xp: 25, label: "+25 XP", symbol: "\u25ce", color: "#14F195", bobOffset: 4.5 },
      { id: "c6", type: "diamond", x: 0.71, y: 0.72, xp: 50, label: "+50 XP", symbol: "\ud83d\udc8e", color: "#00F0FF", bobOffset: 0.7 },
      { id: "c7", type: "sol_coin", x: 0.43, y: 0.62, xp: 25, label: "+25 XP", symbol: "\u25ce", color: "#14F195", bobOffset: 1.9 },
      { id: "c8", type: "whale_bag", x: 0.58, y: 0.58, xp: 75, label: "+75 XP", symbol: "\ud83d\udcbc", color: "#F59E0B", bobOffset: 3.1 },
      { id: "c9", type: "diamond", x: 0.72, y: 0.56, xp: 50, label: "+50 XP", symbol: "\ud83d\udc8e", color: "#00F0FF", bobOffset: 2.2 },
      { id: "c10", type: "god_candle", x: 0.39, y: 0.49, xp: 100, label: "+100 XP", symbol: "\ud83d\udd6f\ufe0f", color: "#22C55E", bobOffset: 4.1 },
    ];
    collectiblesRef.current = items;
  }, []);

  // Preload Background Image
  useEffect(() => {
    const img = new Image();
    img.src = "/arena_promenade.jpg";
    img.onload = () => {
      bgImageRef.current = img;
      isImageLoadedRef.current = true;
    };
    spawnCollectibles();
  }, [spawnCollectibles]);

  // Handle jump request from UI
  useEffect(() => {
    if (!jumpDistrictId) return;
    if (jumpDistrictId === "bull_square" || jumpDistrictId === "solana") {
      playerRef.current.x = 0.50;
      playerRef.current.y = 0.66;
    } else if (jumpDistrictId === "fomo") {
      playerRef.current.x = 0.24;
      playerRef.current.y = 0.58;
    } else if (jumpDistrictId === "base") {
      playerRef.current.x = 0.76;
      playerRef.current.y = 0.60;
    } else if (jumpDistrictId === "sniper") {
      playerRef.current.x = 0.32;
      playerRef.current.y = 0.70;
    } else if (jumpDistrictId === "whale") {
      playerRef.current.x = 0.54;
      playerRef.current.y = 0.52;
    }
    sounds.playDistrictSwoosh();
    if (onResetJump) onResetJump();
  }, [jumpDistrictId, onResetJump]);

  // Keyboard Event Listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      targetPosRef.current = null; // Keyboard overrides click-to-move
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Chunky Little-Kerala Stylized Humanoid Character Drawing
  const drawArticulatedHuman = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      depth: number,
      facing: number,
      walkCycle: number,
      isMoving: boolean,
      opts: {
        isPlayer?: boolean;
        isTurbo?: boolean;
        roleColor?: string;
        jacketColor?: string;
        skinTone?: string;
        handle?: string;
        role?: string;
        bubbleText?: string;
        showInspectPrompt?: boolean;
      }
    ) => {
      // Scale: depth * 1.0 for realistic promenade proportion
      const scale = depth * 1.0;
      const cycle = isMoving ? walkCycle : 0;

      // 4-way / 8-way facing direction analysis
      const normAngle = ((facing % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const isFacingAway = normAngle > Math.PI * 1.15 && normAngle < Math.PI * 1.85;
      const isFacingRight = normAngle <= Math.PI * 0.35 || normAngle >= Math.PI * 1.65;
      const isFacingLeft = normAngle >= Math.PI * 0.65 && normAngle <= Math.PI * 1.35;

      // Locomotion equations
      const strideAmp = isMoving ? (opts.isTurbo ? 18 : 13) * scale : 0;
      const stride1 = Math.sin(cycle) * strideAmp;
      const lift1 = isMoving ? Math.max(0, -Math.cos(cycle)) * 10 * scale : 0;
      const lift2 = isMoving ? Math.max(0, Math.cos(cycle)) * 10 * scale : 0;
      const bodyBob = isMoving ? Math.abs(Math.sin(cycle)) * 3.5 * scale : Math.sin(Date.now() * 0.003) * 1.2 * scale;
      const shoulderTilt = isMoving ? Math.sin(cycle) * 0.08 : 0;

      // Styling palette
      const skinColor = opts.skinTone || "#F5D0A9";
      const pantsColor = "#0F172A"; // Dark techwear cargo pants
      const jacketBg = opts.jacketColor || (opts.isPlayer ? "#0B132B" : "#1E293B");
      const accent = opts.isPlayer ? (opts.isTurbo ? "#22C55E" : "#38BDF8") : (opts.roleColor || "#38BDF8");
      const shoeSole = "#F8FAFC";

      ctx.save();
      ctx.translate(cx, cy);

      // 1. Wet pavement ground shadow
      const shadowW = 24 * scale;
      const shadowH = 9 * scale;
      ctx.beginPath();
      ctx.ellipse(0, 0, shadowW, shadowH, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(4, 7, 15, 0.70)";
      ctx.fill();

      // Holographic floor ring for player
      if (opts.isPlayer) {
        ctx.beginPath();
        ctx.ellipse(0, 0, shadowW * 1.3, shadowH * 1.3, 0, 0, Math.PI * 2);
        ctx.strokeStyle = opts.isTurbo ? "rgba(34, 197, 94, 0.7)" : "rgba(56, 189, 248, 0.65)";
        ctx.lineWidth = 2 * scale;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(0, 0, shadowW * 1.6, shadowH * 1.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = opts.isTurbo ? "rgba(34, 197, 94, 0.12)" : "rgba(56, 189, 248, 0.10)";
        ctx.fill();

        // Direction pointer when moving
        if (isMoving) {
          ctx.save();
          ctx.rotate(facing);
          ctx.beginPath();
          ctx.moveTo(18 * scale, 0);
          ctx.lineTo(11 * scale, -5 * scale);
          ctx.lineTo(11 * scale, 5 * scale);
          ctx.closePath();
          ctx.fillStyle = opts.isTurbo ? "#22C55E" : "#38BDF8";
          ctx.fill();
          ctx.restore();
        }
      }

      // Vertical landmarks
      const groundY = 0;
      const hipY = -38 * scale - bodyBob;
      const torsoTop = hipY - 28 * scale;
      const headCenterY = torsoTop - 13 * scale;

      // 2. Body Rendering
      if (isFacingRight || isFacingLeft) {
        // --- SIDE PROFILE ---
        const dirMult = isFacingRight ? 1 : -1;
        const bFootX = -stride1 * dirMult;
        const bFootY = groundY - lift1;
        const fFootX = stride1 * dirMult;
        const fFootY = groundY - lift2;

        // Back Leg
        ctx.lineWidth = 8.5 * scale;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#080D1A";
        ctx.beginPath();
        ctx.moveTo(0, hipY);
        const bKneeX = bFootX * 0.5 - 2 * dirMult * scale;
        const bKneeY = hipY + (bFootY - hipY) * 0.55;
        ctx.lineTo(bKneeX, bKneeY);
        ctx.lineTo(bFootX, bFootY);
        ctx.stroke();

        // Back Chunky Sneaker
        ctx.fillStyle = shoeSole;
        ctx.beginPath();
        ctx.roundRect(bFootX - (dirMult > 0 ? 6 : 9) * scale, bFootY - 6.5 * scale, 15 * scale, 6.5 * scale, 3 * scale);
        ctx.fill();
        ctx.fillStyle = accent;
        ctx.fillRect(bFootX - (dirMult > 0 ? 5 : 7) * scale, bFootY - 6.5 * scale, 9 * scale, 3.2 * scale);

        // Torso / Techwear Parka
        ctx.save();
        ctx.rotate(shoulderTilt * dirMult);
        ctx.fillStyle = jacketBg;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.8 * scale;
        ctx.beginPath();
        ctx.roundRect(-10 * scale, torsoTop, 20 * scale, 28 * scale, 6 * scale);
        ctx.fill();
        ctx.stroke();

        // Backpack on back side
        const bpX = -11 * scale * dirMult;
        ctx.fillStyle = "#090E17";
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.2 * scale;
        ctx.beginPath();
        ctx.roundRect(bpX - 6 * scale, torsoTop + 3 * scale, 12 * scale, 22 * scale, 4 * scale);
        ctx.fill();
        ctx.stroke();

        // Front Leg
        ctx.lineWidth = 9.5 * scale;
        ctx.lineCap = "round";
        ctx.strokeStyle = pantsColor;
        ctx.beginPath();
        ctx.moveTo(0, hipY);
        const fKneeX = fFootX * 0.5 + 2 * dirMult * scale;
        const fKneeY = hipY + (fFootY - hipY) * 0.55;
        ctx.lineTo(fKneeX, fKneeY);
        ctx.lineTo(fFootX, fFootY);
        ctx.stroke();

        // Front Chunky Sneaker
        ctx.fillStyle = shoeSole;
        ctx.beginPath();
        ctx.roundRect(fFootX - (dirMult > 0 ? 6 : 9) * scale, fFootY - 6.5 * scale, 15 * scale, 6.5 * scale, 3 * scale);
        ctx.fill();
        ctx.fillStyle = accent;
        ctx.fillRect(fFootX - (dirMult > 0 ? 5 : 7) * scale, fFootY - 6.5 * scale, 9 * scale, 3.2 * scale);

        // Arm swinging opposite
        const armSwing = -Math.sin(cycle) * 11 * scale * dirMult;
        const armX = armSwing;
        ctx.strokeStyle = jacketBg;
        ctx.lineWidth = 7.5 * scale;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(2 * dirMult * scale, torsoTop + 5 * scale);
        ctx.lineTo(armX + 2 * dirMult * scale, hipY + 5 * scale);
        ctx.stroke();

        // Hand
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(armX + 2 * dirMult * scale, hipY + 6.5 * scale, 3.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Head & Hair
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(0, headCenterY, 9.5 * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#0F172A";
        ctx.beginPath();
        ctx.arc(0, headCenterY - 1.5 * scale, 9.8 * scale, Math.PI * 0.8, Math.PI * 2.2);
        ctx.fill();

        // Cyber Visor
        ctx.fillStyle = accent;
        ctx.shadowColor = accent;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.roundRect(dirMult > 0 ? 1 * scale : -11 * scale, headCenterY - 2.5 * scale, 10 * scale, 4.5 * scale, 2 * scale);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (isFacingAway) {
        // --- BACK VIEW ---
        const legOffset = isMoving ? Math.sin(cycle) * 2.5 * scale : 0;
        const lFootY = groundY - lift1;
        const rFootY = groundY - lift2;

        // Legs
        ctx.lineWidth = 9 * scale;
        ctx.lineCap = "round";
        ctx.strokeStyle = pantsColor;
        ctx.beginPath();
        ctx.moveTo(-8 * scale, hipY);
        ctx.lineTo(-8 * scale + legOffset, lFootY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(8 * scale, hipY);
        ctx.lineTo(8 * scale - legOffset, rFootY);
        ctx.stroke();

        // Chunky Sneakers
        ctx.fillStyle = shoeSole;
        ctx.beginPath();
        ctx.roundRect(-14 * scale + legOffset, lFootY - 6.5 * scale, 12 * scale, 6.5 * scale, 3 * scale);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(2 * scale - legOffset, rFootY - 6.5 * scale, 12 * scale, 6.5 * scale, 3 * scale);
        ctx.fill();

        // Torso / Jacket
        ctx.save();
        ctx.rotate(shoulderTilt);
        ctx.fillStyle = jacketBg;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.8 * scale;
        ctx.beginPath();
        ctx.roundRect(-14 * scale, torsoTop, 28 * scale, 28 * scale, 7 * scale);
        ctx.fill();
        ctx.stroke();

        // Techwear Backpack
        ctx.fillStyle = "#0A0E17";
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.4 * scale;
        ctx.beginPath();
        ctx.roundRect(-9 * scale, torsoTop + 3 * scale, 18 * scale, 21 * scale, 4.5 * scale);
        ctx.fill();
        ctx.stroke();

        if (opts.isPlayer) {
          ctx.font = `900 ${Math.round(8.5 * scale)}px Inter, sans-serif`;
          ctx.fillStyle = accent;
          ctx.shadowColor = accent;
          ctx.shadowBlur = 8;
          ctx.textAlign = "center";
          ctx.fillText("CT", 0, torsoTop + 16 * scale);
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = accent;
          ctx.beginPath();
          ctx.arc(0, torsoTop + 14 * scale, 3.8 * scale, 0, Math.PI * 2);
          ctx.fill();
        }

        // Arms swinging
        const arm1 = Math.sin(cycle) * 5 * scale;
        ctx.fillStyle = jacketBg;
        ctx.beginPath();
        ctx.roundRect(-19 * scale, torsoTop + 3 * scale + arm1, 6 * scale, 19 * scale, 3 * scale);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(13 * scale, torsoTop + 3 * scale - arm1, 6 * scale, 19 * scale, 3 * scale);
        ctx.fill();
        ctx.restore();

        // Head & Back of Hair
        ctx.fillStyle = "#0F172A";
        ctx.beginPath();
        ctx.arc(0, headCenterY, 9.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.arc(0, headCenterY + 2 * scale, 8 * scale, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
      } else {
        // --- FRONT VIEW ---
        const legOffset = isMoving ? Math.sin(cycle) * 2.5 * scale : 0;
        const lFootY = groundY - lift1;
        const rFootY = groundY - lift2;

        // Legs
        ctx.lineWidth = 9.5 * scale;
        ctx.lineCap = "round";
        ctx.strokeStyle = pantsColor;
        ctx.beginPath();
        ctx.moveTo(-8 * scale, hipY);
        ctx.lineTo(-8 * scale + legOffset, lFootY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(8 * scale, hipY);
        ctx.lineTo(8 * scale - legOffset, rFootY);
        ctx.stroke();

        // Chunky Sneakers
        ctx.fillStyle = shoeSole;
        ctx.beginPath();
        ctx.roundRect(-15 * scale + legOffset, lFootY - 6.5 * scale, 13 * scale, 6.5 * scale, 3 * scale);
        ctx.fill();
        ctx.fillStyle = accent;
        ctx.fillRect(-14 * scale + legOffset, lFootY - 6.5 * scale, 9 * scale, 3.2 * scale);

        ctx.fillStyle = shoeSole;
        ctx.beginPath();
        ctx.roundRect(2 * scale - legOffset, rFootY - 6.5 * scale, 13 * scale, 6.5 * scale, 3 * scale);
        ctx.fill();
        ctx.fillStyle = accent;
        ctx.fillRect(5 * scale - legOffset, rFootY - 6.5 * scale, 9 * scale, 3.2 * scale);

        // Torso / Jacket
        ctx.save();
        ctx.rotate(shoulderTilt);
        ctx.fillStyle = jacketBg;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.8 * scale;
        ctx.beginPath();
        ctx.roundRect(-14 * scale, torsoTop, 28 * scale, 28 * scale, 7 * scale);
        ctx.fill();
        ctx.stroke();

        // Zipper
        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.moveTo(0, torsoTop + 2 * scale);
        ctx.lineTo(0, hipY);
        ctx.stroke();

        // Arms & Hands
        const armSwing1 = Math.sin(cycle) * 6 * scale;
        ctx.fillStyle = jacketBg;
        ctx.beginPath();
        ctx.roundRect(-19 * scale, torsoTop + 3 * scale + armSwing1, 6 * scale, 18 * scale, 3 * scale);
        ctx.fill();
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(-16 * scale, torsoTop + 22 * scale + armSwing1, 3.5 * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = jacketBg;
        ctx.beginPath();
        ctx.roundRect(13 * scale, torsoTop + 3 * scale - armSwing1, 6 * scale, 18 * scale, 3 * scale);
        ctx.fill();
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(16 * scale, torsoTop + 22 * scale - armSwing1, 3.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Head & Neck
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(0, headCenterY, 9.5 * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#0F172A";
        ctx.beginPath();
        ctx.arc(0, headCenterY - 1.5 * scale, 9.8 * scale, Math.PI * 0.9, Math.PI * 2.1);
        ctx.fill();

        // Cyber Sunglasses / HUD Visor
        ctx.fillStyle = accent;
        ctx.shadowColor = accent;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(-7.5 * scale, headCenterY - 3 * scale, 15 * scale, 5 * scale, 2.2 * scale);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 3. Overhead Nameplate, Speech Bubble & Inspect Prompt
      if (opts.handle) {
        const nameText = opts.handle;
        const roleText = opts.role || "TRADER";
        const badgeY = headCenterY - 24 * scale;

        ctx.font = `bold ${Math.max(9, Math.round(9.5 * scale))}px Inter, sans-serif`;
        const nameW = ctx.measureText(nameText).width + 18 * scale;
        const badgeH = 22 * scale;

        // Overhead glassmorphic name badge
        ctx.fillStyle = "rgba(7, 12, 22, 0.94)";
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.3 * scale;
        ctx.beginPath();
        ctx.roundRect(-nameW / 2, badgeY - badgeH, nameW, badgeH, 6 * scale);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText(nameText, 0, badgeY - 10 * scale);

        ctx.font = `bold ${Math.max(7, Math.round(7.5 * scale))}px Inter, sans-serif`;
        ctx.fillStyle = accent;
        ctx.fillText(roleText, 0, badgeY - 2.5 * scale);

        // Speech bubble
        if (opts.bubbleText) {
          const bubbleY = badgeY - badgeH - 8 * scale;
          ctx.font = `600 ${Math.max(8, Math.round(8.5 * scale))}px Inter, sans-serif`;
          const textW = ctx.measureText(opts.bubbleText).width;
          const bubbleW = textW + 16 * scale;
          const bubbleH = 20 * scale;

          ctx.fillStyle = "rgba(10, 15, 29, 0.96)";
          ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
          ctx.lineWidth = 1 * scale;
          ctx.beginPath();
          ctx.roundRect(-bubbleW / 2, bubbleY - bubbleH, bubbleW, bubbleH, 6 * scale);
          ctx.fill();
          ctx.stroke();

          // Pointer
          ctx.beginPath();
          ctx.moveTo(-3 * scale, bubbleY);
          ctx.lineTo(0, bubbleY + 4 * scale);
          ctx.lineTo(3 * scale, bubbleY);
          ctx.fillStyle = "rgba(10, 15, 29, 0.96)";
          ctx.fill();

          ctx.fillStyle = "#F8FAFC";
          ctx.textAlign = "center";
          ctx.fillText(opts.bubbleText, 0, bubbleY - 6.5 * scale);
        }

        // Proximity Inspect prompt
        if (opts.showInspectPrompt) {
          const inspectY = badgeY + 6 * scale;
          ctx.font = `bold ${Math.max(7, Math.round(7.5 * scale))}px Inter, sans-serif`;
          const promptW = 60 * scale;
          const promptH = 15 * scale;

          ctx.fillStyle = "rgba(14, 165, 233, 0.95)";
          ctx.beginPath();
          ctx.roundRect(-promptW / 2, inspectY, promptW, promptH, 4 * scale);
          ctx.fill();

          ctx.fillStyle = "#0F172A";
          ctx.textAlign = "center";
          ctx.fillText("🔍 Inspect", 0, inspectY + 11 * scale);
        }
      }

      ctx.restore();
    },
    []
  );

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
      const worldH = Math.max(h, worldW / aspect);

      const p = playerRef.current;
      const cam = {
        x: p.x * worldW - w / 2,
        y: p.y * worldH - h / 2,
      };

      const worldClickX = (clickScreenX + cam.x) / worldW;
      const worldClickY = (clickScreenY + cam.y) / worldH;

      // Check if user clicked on any trader to inspect
      let clickedTrader: WanderingTrader | null = null;
      tradersRef.current.forEach((t) => {
        const dx = (t.x - worldClickX) * worldW;
        const dy = (t.y - worldClickY) * worldH;
        if (Math.hypot(dx, dy) < 45) {
          clickedTrader = t;
        }
      });

      if (clickedTrader) {
        sounds.playClick();
        if (onInspectTrader) {
          onInspectTrader({
            handle: (clickedTrader as WanderingTrader).handle,
            role: (clickedTrader as WanderingTrader).role,
            roleColor: (clickedTrader as WanderingTrader).roleColor,
            pnl: (clickedTrader as WanderingTrader).pnl,
          });
        }
      } else {
        // Move player to clicked location
        sounds.playStep();
        targetPosRef.current = {
          x: Math.max(0.08, Math.min(0.92, worldClickX)),
          y: Math.max(0.40, Math.min(0.85, worldClickY)),
        };
      }
    };

    canvas.addEventListener("click", handleCanvasClick);

    // Responsive Canvas Resizing
    const resizeCanvas = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Animation Loop
    const render = (time: number) => {
      const dt = Math.min(32, time - lastTime) / 16.66;
      lastTime = time;

      const dpr = window.devicePixelRatio || 1;
      const screenW = canvas.width / dpr;
      const screenH = canvas.height / dpr;

      const aspect = 16 / 9;
      const worldW = Math.max(screenW, screenH * aspect);
      const worldH = Math.max(screenH, worldW / aspect);

      // --- 1. PLAYER INPUT & LOCOMOTION ---
      const p = playerRef.current;
      let moveX = 0;
      let moveY = 0;

      // Keyboard WASD / Arrows
      const k = keysRef.current;
      if (k["KeyW"] || k["ArrowUp"]) moveY -= 1;
      if (k["KeyS"] || k["ArrowDown"]) moveY += 1;
      if (k["KeyA"] || k["ArrowLeft"]) moveX -= 1;
      if (k["KeyD"] || k["ArrowRight"]) moveX += 1;

      // Virtual Joystick Input
      if (joystickVector && (Math.abs(joystickVector.x) > 0.1 || Math.abs(joystickVector.y) > 0.1)) {
        moveX = joystickVector.x;
        moveY = joystickVector.y;
        targetPosRef.current = null;
      }

      // Click Target Navigation
      if (targetPosRef.current && moveX === 0 && moveY === 0) {
        const dx = targetPosRef.current.x - p.x;
        const dy = targetPosRef.current.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.005) {
          moveX = dx / dist;
          moveY = dy / dist;
        } else {
          targetPosRef.current = null;
        }
      }

      const moveLen = Math.hypot(moveX, moveY);
      const speedMultiplier = isSprinting ? 1.75 : 1.0;
      const currentSpeed = p.speed * speedMultiplier;

      if (moveLen > 0.05) {
        const normX = moveX / moveLen;
        const normY = moveY / moveLen;
        p.vx = normX * currentSpeed;
        p.vy = normY * currentSpeed;
        p.facing = Math.atan2(normY, normX);
        p.isMoving = true;
        p.walkCycle += 0.22 * speedMultiplier * dt;

        // Particle trail during sprint
        if (isSprinting && Math.random() < 0.4) {
          particlesRef.current.push({
            x: p.x * worldW,
            y: p.y * worldH,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 3 + 2,
            color: "#22C55E",
            alpha: 0.8,
            life: 20,
          });
        }
      } else {
        p.vx *= 0.7;
        p.vy *= 0.7;
        if (Math.hypot(p.vx, p.vy) < 0.00005) {
          p.vx = 0;
          p.vy = 0;
          p.isMoving = false;
        } else {
          p.walkCycle += 0.08 * dt;
        }
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Keep within walkable arena boundaries
      p.x = Math.max(0.08, Math.min(0.92, p.x));
      p.y = Math.max(0.44, Math.min(0.82, p.y));

      // Report player coordinates
      if (onUpdateCoords) {
        let district = "Solana City Plaza";
        if (p.x < 0.35) district = "FOMO District";
        else if (p.x > 0.65) district = "Base Boulevard";
        else if (p.y < 0.55) district = "Sniper Alley";
        onUpdateCoords({
          x: Math.round(p.x * 2500),
          y: Math.round(p.y * 1400),
          district,
        });
      }

      // --- 2. WANDERING TRADERS AI ---
      tradersRef.current.forEach((t) => {
        const dx = t.targetX - t.x;
        const dy = t.targetY - t.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 0.015) {
          // Pick new random waypoint
          t.targetX = Math.max(0.12, Math.min(0.88, t.x + (Math.random() - 0.5) * 0.25));
          t.targetY = Math.max(0.46, Math.min(0.78, t.y + (Math.random() - 0.5) * 0.18));
          t.isMoving = Math.random() > 0.25;
        }

        if (t.isMoving) {
          const moveDir = Math.atan2(dy, dx);
          t.facing = moveDir;
          t.x += Math.cos(moveDir) * t.speed * dt;
          t.y += Math.sin(moveDir) * t.speed * dt;
          t.walkCycle += 0.14 * dt;
        }

        // Speech bubble timers
        if (t.bubbleTimer !== undefined) {
          t.bubbleTimer -= dt;
          if (t.bubbleTimer <= 0) {
            const lines = [
              "accumulating $SOL \ud83d\udc41\ufe0f",
              "higher highs \u27aa",
              "whale alert \ud83d\udc33",
              "breakout confirmed \ud83d\udcc8",
              "god candle incoming \ud83d\udd6f\ufe0f",
              "sending it \ud83d\ude80",
              "gm CT \u2615",
              "based and memepilled \ud83c\udfad",
            ];
            t.bubbleText = lines[Math.floor(Math.random() * lines.length)];
            t.bubbleTimer = 220 + Math.random() * 200;
          }
        }
      });

      // --- 3. CAMERA & VIEWPORT SMOOTHING ---
      const cam = {
        x: p.x * worldW - screenW / 2,
        y: p.y * worldH - screenH / 2,
      };

      // Clamp camera to world bounds
      cam.x = Math.max(0, Math.min(worldW - screenW, cam.x));
      cam.y = Math.max(0, Math.min(worldH - screenH, cam.y));

      ctx.clearRect(0, 0, screenW, screenH);

      // --- 4. RENDER ARENA BACKGROUND ---
      if (isImageLoadedRef.current && bgImageRef.current) {
        ctx.drawImage(bgImageRef.current, -cam.x, -cam.y, worldW, worldH);
      } else {
        // Futuristic Cyber Grid Fallback
        const grad = ctx.createLinearGradient(0, 0, 0, screenH);
        grad.addColorStop(0, "#080c16");
        grad.addColorStop(1, "#03060c");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, screenW, screenH);
      }

      // --- 5. RENDER COLLECTIBLES ---
      const remainingCollectibles: Collectible[] = [];
      collectiblesRef.current.forEach((col) => {
        const colScreenX = col.x * worldW - cam.x;
        const colScreenY = col.y * worldH - cam.y;

        // Proximity detection with player
        const distToPlayer = Math.hypot(p.x - col.x, p.y - col.y);
        if (distToPlayer < 0.032) {
          // Collected!
          sounds.playCollect();
          if (onCollectXP) onCollectXP(col.xp, col.label);

          floatTextsRef.current.push({
            id: Date.now() + Math.random(),
            x: colScreenX,
            y: colScreenY - 15,
            text: col.label,
            color: col.color,
            alpha: 1,
            life: 45,
          });

          // Burst particles
          for (let i = 0; i < 8; i++) {
            const ang = (i / 8) * Math.PI * 2;
            particlesRef.current.push({
              x: col.x * worldW,
              y: col.y * worldH,
              vx: Math.cos(ang) * (Math.random() * 2 + 1),
              vy: Math.sin(ang) * (Math.random() * 2 + 1),
              size: Math.random() * 3 + 2,
              color: col.color,
              alpha: 1,
              life: 30,
            });
          }
          return;
        }

        // Draw collectible item
        const bob = Math.sin(Date.now() * 0.005 + col.bobOffset) * 6;
        const drawY = colScreenY + bob;

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(colScreenX, colScreenY + 12, 10, 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(colScreenX, drawY, 13, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(10, 15, 29, 0.85)";
        ctx.strokeStyle = col.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = col.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.stroke();

        ctx.font = "bold 13px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = col.color;
        ctx.fillText(col.symbol, colScreenX, drawY);
        ctx.restore();

        remainingCollectibles.push(col);
      });
      collectiblesRef.current = remainingCollectibles;

      // Respawn collectibles if empty
      if (collectiblesRef.current.length === 0) {
        spawnCollectibles();
      }

      // --- 6. Y-SORTED DEPTH RENDERING (HUMANOID CHARACTERS) ---
      interface RenderableHuman {
        type: "player" | "trader";
        y: number;
        draw: () => void;
      }

      const renderables: RenderableHuman[] = [];

      // Add Traders
      tradersRef.current.forEach((t) => {
        const tx = t.x * worldW - cam.x;
        const ty = t.y * worldH - cam.y;

        // Depth perspective scale: 0.80 at horizon, 1.45 at bottom
        const depth = 0.85 + (t.y - 0.42) * 1.5;
        const distToPlayer = Math.hypot(p.x - t.x, p.y - t.y);
        const showInspect = distToPlayer < 0.055;

        renderables.push({
          type: "trader",
          y: ty,
          draw: () => {
            drawArticulatedHuman(ctx, tx, ty, depth, t.facing, t.walkCycle, t.isMoving, {
              roleColor: t.roleColor,
              jacketColor: t.jacketColor,
              skinTone: t.skinTone,
              handle: t.handle,
              role: t.role,
              bubbleText: t.bubbleText,
              showInspectPrompt: showInspect,
            });
          },
        });
      });

      // Add Player
      const px = p.x * worldW - cam.x;
      const py = p.y * worldH - cam.y;
      const pDepth = 0.85 + (p.y - 0.42) * 1.5;

      renderables.push({
        type: "player",
        y: py,
        draw: () => {
          drawArticulatedHuman(ctx, px, py, pDepth, p.facing, p.walkCycle, p.isMoving, {
            isPlayer: true,
            isTurbo: isSprinting,
            jacketColor: "#0B132B",
            skinTone: "#F5D0A9",
          });
        },
      });

      // Sort by Y so closer characters overlap further ones
      renderables.sort((a, b) => a.y - b.y);
      renderables.forEach((r) => r.draw());

      // --- 7. FLOATING TEXTS ---
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

      // --- 8. PARTICLES ---
      const activeParticles: Particle[] = [];
      particlesRef.current.forEach((pt) => {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        pt.alpha = Math.max(0, pt.life / 25);

        const screenPX = pt.x - cam.x;
        const screenPY = pt.y - cam.y;

        ctx.beginPath();
        ctx.arc(screenPX, screenPY, pt.size, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha;
        ctx.fill();

        if (pt.life > 0) activeParticles.push(pt);
      });
      ctx.globalAlpha = 1;
      particlesRef.current = activeParticles;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("click", handleCanvasClick);
    };
  }, [joystickVector, isSprinting, onInspectTrader, onCollectXP, onUpdateCoords, spawnCollectibles, drawArticulatedHuman]);

  return (
    <div className="arena-canvas-wrapper">
      <canvas ref={canvasRef} className="arena-game-canvas" />
    </div>
  );
}
