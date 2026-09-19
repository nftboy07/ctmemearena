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
  spriteKey: string;
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

export interface SecAgent {
  id: number;
  x: number;
  y: number;
  speed: number;
  facing: number;
  walkCycle: number;
  sirenPhase: number;
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
  onHeatChange?: (heat: number) => void;
  onBusted?: () => void;
  jumpDistrictId?: string | null;
  onResetJump?: () => void;
}

// Initial Wandering Photorealistic Crypto Twitter Streetwear Traders
const INITIAL_TRADERS: WanderingTrader[] = [
  {
    id: "trader_satoshi",
    handle: "@SatoshiNakamoto",
    role: "FOUNDER",
    roleColor: "#F59E0B",
    spriteKey: "satoshi",
    pnl: 14280.5,
    x: 0.65,
    y: 0.64,
    targetX: 0.70,
    targetY: 0.68,
    speed: 0.00035,
    facing: Math.PI / 2,
    walkCycle: 0,
    isMoving: true,
    bubbleText: "gm CT \u2615",
    bubbleTimer: 280,
  },
  {
    id: "trader_quneri",
    handle: "@BasedQuneri",
    role: "NFT COLLECTOR",
    roleColor: "#A855F7",
    spriteKey: "quneri",
    pnl: 3200.0,
    x: 0.32,
    y: 0.66,
    targetX: 0.28,
    targetY: 0.62,
    speed: 0.00045,
    facing: -Math.PI / 4,
    walkCycle: 0.4,
    isMoving: true,
    bubbleTimer: 450,
  },
  {
    id: "trader_degen",
    handle: "@DegenAlpha",
    role: "SNIPER",
    roleColor: "#F43F5E",
    spriteKey: "degen",
    pnl: 890.2,
    x: 0.26,
    y: 0.62,
    targetX: 0.30,
    targetY: 0.68,
    speed: 0.0006,
    facing: -Math.PI * 0.75,
    walkCycle: 2.2,
    isMoving: true,
    bubbleTimer: 520,
  },
  {
    id: "trader_whale",
    handle: "@WhaleMode",
    role: "WHALE",
    roleColor: "#0284C7",
    spriteKey: "whale",
    pnl: 45200.0,
    x: 0.46,
    y: 0.54,
    targetX: 0.42,
    targetY: 0.58,
    speed: 0.0003,
    facing: Math.PI / 2,
    walkCycle: 1.0,
    isMoving: true,
    bubbleTimer: 380,
  },
  {
    id: "trader_alpha",
    handle: "@AlphaChad",
    role: "RESEARCHER",
    roleColor: "#38BDF8",
    spriteKey: "alpha",
    pnl: 2840.0,
    x: 0.38,
    y: 0.55,
    targetX: 0.42,
    targetY: 0.52,
    speed: 0.00045,
    facing: 0,
    walkCycle: 1.5,
    isMoving: true,
    bubbleTimer: 600,
  },
  {
    id: "trader_solhunter",
    handle: "@SolHunter",
    role: "EARLY",
    roleColor: "#06B6D4",
    spriteKey: "solhunter",
    pnl: 5410.8,
    x: 0.20,
    y: 0.55,
    targetX: 0.18,
    targetY: 0.52,
    speed: 0.0005,
    facing: -Math.PI / 2,
    walkCycle: 0.8,
    isMoving: true,
    bubbleTimer: 480,
  },
  {
    id: "trader_diamond",
    handle: "@DiamondMax",
    role: "DIAMOND HANDS",
    roleColor: "#00F0FF",
    spriteKey: "alpha",
    pnl: 1940.4,
    x: 0.76,
    y: 0.62,
    targetX: 0.82,
    targetY: 0.66,
    speed: 0.0004,
    facing: 0,
    walkCycle: 3.0,
    isMoving: true,
    bubbleTimer: 550,
  },
  {
    id: "trader_cobie",
    handle: "@Cobie",
    role: "PODCASTER",
    roleColor: "#10B981",
    spriteKey: "cobie",
    pnl: 33400.0,
    x: 0.82,
    y: 0.54,
    targetX: 0.86,
    targetY: 0.57,
    speed: 0.00035,
    facing: 0,
    walkCycle: 2.1,
    isMoving: true,
    bubbleTimer: 650,
  }
];

export default function CTWorldCanvas({
  joystickVector,
  isSprinting = false,
  onInspectTrader,
  onCollectXP,
  onUpdateCoords,
  onHeatChange,
  onBusted,
  jumpDistrictId,
  onResetJump,
}: CTWorldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Player State
  const playerRef = useRef({
    x: 0.50,
    y: 0.68,
    vx: 0,
    vy: 0,
    facing: -Math.PI / 2, // Facing North/Up (viewed from behind with glowing CT jacket)
    walkCycle: 0,
    isMoving: false,
    speed: 0.00065,
  });

  // World Elements
  const tradersRef = useRef<WanderingTrader[]>(INITIAL_TRADERS);
  const collectiblesRef = useRef<Collectible[]>([]);
  const floatTextsRef = useRef<FloatingText[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const shakeRef = useRef(0);
  const ringsRef = useRef<{ x: number; y: number; r: number; maxR: number; color: string; alpha: number }[]>([]);
  // GTA wanted system — heat, SEC chasers, busted state
  const agentsRef = useRef<SecAgent[]>([]);
  const heatRef = useRef(0);
  const lastHeatReported = useRef(-1);
  const bustedCooldownRef = useRef(0);
  const bustedFlashRef = useRef(0);
  const agentIdRef = useRef(1);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const isImageLoadedRef = useRef(false);

  // Preloaded Photorealistic Sprites Cache
  const spritesRef = useRef<{ [key: string]: HTMLImageElement }>({});

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

  // Preload Background Image & Photorealistic Sprites
  useEffect(() => {
    // 1. Background Promenade
    const bg = new Image();
    bg.src = "/arena_promenade.jpg";
    bg.onload = () => {
      bgImageRef.current = bg;
      isImageLoadedRef.current = true;
    };
    if (bg.complete && bg.naturalWidth > 0) {
      bgImageRef.current = bg;
      isImageLoadedRef.current = true;
    }

    // 2. Photorealistic Human Sprites
    const spriteUrls: { [key: string]: string } = {
      player_back: "/sprites/player_back.png",
      player_front: "/sprites/player_front.png",
      satoshi_back: "/sprites/trader_satoshi_back.png",
      satoshi_front: "/sprites/trader_satoshi_front.png",
      quneri_back: "/sprites/trader_quneri_back.png",
      quneri_front: "/sprites/trader_quneri_front.png",
      degen_back: "/sprites/trader_degen_back.png",
      degen_front: "/sprites/trader_degen_front.png",
      whale_back: "/sprites/trader_whale_back.png",
      whale_front: "/sprites/trader_whale_front.png",
      alpha_back: "/sprites/trader_alpha_back.png",
      alpha_front: "/sprites/trader_alpha_front.png",
      solhunter_back: "/sprites/trader_solhunter_back.png",
      solhunter_front: "/sprites/trader_solhunter_front.png",
      cobie_back: "/sprites/trader_cobie_back.png",
      cobie_front: "/sprites/trader_cobie_front.png",
    };

    Object.entries(spriteUrls).forEach(([key, url]) => {
      const sp = new Image();
      sp.src = url;
      sp.onload = () => {
        spritesRef.current[key] = sp;
      };
      if (sp.complete && sp.naturalWidth > 0) {
        spritesRef.current[key] = sp;
      }
    });

    spawnCollectibles();
  }, [spawnCollectibles]);

  // Fast Travel Jump Handler
  useEffect(() => {
    if (!jumpDistrictId) return;
    if (jumpDistrictId === "bull_square" || jumpDistrictId === "solana") {
      playerRef.current.x = 0.50;
      playerRef.current.y = 0.68;
    } else if (jumpDistrictId === "fomo") {
      playerRef.current.x = 0.24;
      playerRef.current.y = 0.58;
    } else if (jumpDistrictId === "base") {
      playerRef.current.x = 0.76;
      playerRef.current.y = 0.60;
    } else if (jumpDistrictId === "sniper") {
      playerRef.current.x = 0.30;
      playerRef.current.y = 0.68;
    } else if (jumpDistrictId === "whale") {
      playerRef.current.x = 0.52;
      playerRef.current.y = 0.52;
    }
    sounds.playDistrictSwoosh();
    if (onResetJump) onResetJump();
  }, [jumpDistrictId, onResetJump]);

  // Keyboard Event Listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      targetPosRef.current = null;
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

  // Photorealistic Human Character Drawing Routine
  const drawPhotorealisticHuman = useCallback(
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
        spriteBaseKey: string; // 'player', 'satoshi', 'quneri', etc.
        roleColor?: string;
        handle?: string;
        role?: string;
        bubbleText?: string;
        showInspectPrompt?: boolean;
      }
    ) => {
      // 8-way / 4-way facing direction analysis
      const normAngle = ((facing % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const isFacingCamera = normAngle > Math.PI * 0.15 && normAngle < Math.PI * 0.85;
      const isFacingLeft = normAngle >= Math.PI * 0.55 && normAngle <= Math.PI * 1.45;
      const isFacingRight = normAngle <= Math.PI * 0.45 || normAngle >= Math.PI * 1.55;

      // Select sprite key (front vs back)
      const spriteKey = isFacingCamera
        ? `${opts.spriteBaseKey}_front`
        : `${opts.spriteBaseKey}_back`;

      const spriteImg = spritesRef.current[spriteKey] || spritesRef.current["player_back"];

      // Biomechanical locomotion variables
      const scale = depth * 0.22; // Target character height ~95px to 130px matching street perspective
      const spriteW = spriteImg ? spriteImg.width * scale : 45 * depth;
      const spriteH = spriteImg ? spriteImg.height * scale : 110 * depth;

      const cycle = isMoving ? walkCycle : 0;
      // Pelvic bounce when walking
      const bodyBob = isMoving ? Math.abs(Math.sin(cycle)) * 4.5 * depth : Math.sin(Date.now() * 0.003) * 1.2 * depth;
      // Natural walking sway / stride lean
      const walkSway = isMoving ? Math.sin(cycle) * 0.045 : 0;
      // Walking step oscillation
      const stepSkew = isMoving ? Math.sin(cycle) * 0.06 : 0;

      ctx.save();
      ctx.translate(cx, cy);

      // 1. Wet Pavement Contact Shadow
      const shadowW = spriteW * 0.72;
      const shadowH = shadowW * 0.35;
      ctx.beginPath();
      ctx.ellipse(0, 0, shadowW, shadowH, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(4, 7, 15, 0.72)";
      ctx.fill();

      // Holographic floor ring for player
      if (opts.isPlayer) {
        ctx.beginPath();
        ctx.ellipse(0, 0, shadowW * 1.25, shadowH * 1.25, 0, 0, Math.PI * 2);
        ctx.strokeStyle = opts.isTurbo ? "rgba(34, 197, 94, 0.85)" : "rgba(56, 189, 248, 0.80)";
        ctx.lineWidth = 2.2 * depth;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(0, 0, shadowW * 1.5, shadowH * 1.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = opts.isTurbo ? "rgba(34, 197, 94, 0.14)" : "rgba(56, 189, 248, 0.12)";
        ctx.fill();

        // Direction pointer chevron when moving
        if (isMoving) {
          ctx.save();
          ctx.rotate(facing);
          ctx.beginPath();
          ctx.moveTo(shadowW * 1.3, 0);
          ctx.lineTo(shadowW * 0.8, -6 * depth);
          ctx.lineTo(shadowW * 0.8, 6 * depth);
          ctx.closePath();
          ctx.fillStyle = opts.isTurbo ? "#22C55E" : "#38BDF8";
          ctx.fill();
          ctx.restore();
        }
      }

      // 2. Render Photorealistic Human Sprite
      if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
        ctx.save();
        // Pivot at bottom center (feet)
        ctx.translate(0, -bodyBob);
        ctx.rotate(walkSway);
        ctx.transform(1, 0, stepSkew, 1, 0, 0);

        // Horizontal flip if walking left
        const flipX = isFacingLeft ? -1 : 1;
        ctx.scale(flipX, 1);

        ctx.drawImage(
          spriteImg,
          -spriteW / 2,
          -spriteH,
          spriteW,
          spriteH
        );
        ctx.restore();
      }

      // 3. Overhead Glassmorphic Role Badge & Speech Bubble
      if (opts.handle) {
        const nameText = opts.handle;
        const roleText = opts.role || "TRADER";
        const badgeY = -spriteH - 16 * depth;

        ctx.font = `bold ${Math.max(9, Math.round(9.5 * depth))}px Inter, sans-serif`;
        const nameW = ctx.measureText(nameText).width + 18 * depth;
        const badgeH = 22 * depth;

        // Overhead glassmorphic name badge
        ctx.fillStyle = "rgba(7, 12, 22, 0.94)";
        ctx.strokeStyle = opts.roleColor || "#38BDF8";
        ctx.lineWidth = 1.3 * depth;
        ctx.beginPath();
        ctx.roundRect(-nameW / 2, badgeY - badgeH, nameW, badgeH, 6 * depth);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText(nameText, 0, badgeY - 10 * depth);

        ctx.font = `bold ${Math.max(7, Math.round(7.5 * depth))}px Inter, sans-serif`;
        ctx.fillStyle = opts.roleColor || "#38BDF8";
        ctx.fillText(roleText, 0, badgeY - 2.5 * depth);

        // Speech bubble
        if (opts.bubbleText) {
          const bubbleY = badgeY - badgeH - 8 * depth;
          ctx.font = `600 ${Math.max(8, Math.round(8.5 * depth))}px Inter, sans-serif`;
          const textW = ctx.measureText(opts.bubbleText).width;
          const bubbleW = textW + 16 * depth;
          const bubbleH = 20 * depth;

          ctx.fillStyle = "rgba(10, 15, 29, 0.96)";
          ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
          ctx.lineWidth = 1 * depth;
          ctx.beginPath();
          ctx.roundRect(-bubbleW / 2, bubbleY - bubbleH, bubbleW, bubbleH, 6 * depth);
          ctx.fill();
          ctx.stroke();

          // Pointer
          ctx.beginPath();
          ctx.moveTo(-3 * depth, bubbleY);
          ctx.lineTo(0, bubbleY + 4 * depth);
          ctx.lineTo(3 * depth, bubbleY);
          ctx.fillStyle = "rgba(10, 15, 29, 0.96)";
          ctx.fill();

          ctx.fillStyle = "#F8FAFC";
          ctx.textAlign = "center";
          ctx.fillText(opts.bubbleText, 0, bubbleY - 6.5 * depth);
        }

        // Proximity Inspect prompt
        if (opts.showInspectPrompt) {
          const inspectY = badgeY + 6 * depth;
          ctx.font = `bold ${Math.max(7, Math.round(7.5 * depth))}px Inter, sans-serif`;
          const promptW = 60 * depth;
          const promptH = 15 * depth;

          ctx.fillStyle = "rgba(14, 165, 233, 0.95)";
          ctx.beginPath();
          ctx.roundRect(-promptW / 2, inspectY, promptW, promptH, 4 * depth);
          ctx.fill();

          ctx.fillStyle = "#0F172A";
          ctx.textAlign = "center";
          ctx.fillText("🔍 Inspect", 0, inspectY + 11 * depth);
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
          y: Math.max(0.44, Math.min(0.82, worldClickY)),
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

      // Fully cover viewport on any mobile or desktop screen
      const scaleFactor = Math.max(screenW / 1376, screenH / 768, 1.0);
      const worldW = 1376 * scaleFactor;
      const worldH = 768 * scaleFactor;

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
        // GTA speed streaks — white-hot lines whipping past while sprinting
        if (isSprinting && p.isMoving) {
          for (let s = 0; s < 2; s++) {
            const back = p.facing + Math.PI + (Math.random() - 0.5) * 0.9;
            particlesRef.current.push({
              x: p.x * worldW + (Math.random() - 0.5) * 90,
              y: p.y * worldH + (Math.random() - 0.5) * 70,
              vx: Math.cos(back) * 9,
              vy: Math.sin(back) * 9,
              size: Math.random() * 1.6 + 0.8,
              color: "#E0F2FE",
              alpha: 0.9,
              life: 14,
            });
          }
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
            t.bubbleTimer = 260 + Math.random() * 260;
          }
        }
      });

      // --- 2b. GTA WANTED SYSTEM — heat, SEC chasers, busted ---
      const prevWanted =
        heatRef.current >= 80 ? 5 : heatRef.current >= 60 ? 4 : heatRef.current >= 40 ? 3 : heatRef.current >= 20 ? 2 : heatRef.current > 1 ? 1 : 0;

      // Heat dynamics: sprinting hot, laying low cools off
      if (isSprinting && p.isMoving) {
        heatRef.current = Math.min(100, heatRef.current + 0.35 * dt);
      } else {
        heatRef.current = Math.max(0, heatRef.current - (p.isMoving ? 0.10 : 0.22) * dt);
      }

      const wanted =
        heatRef.current >= 80 ? 5 : heatRef.current >= 60 ? 4 : heatRef.current >= 40 ? 3 : heatRef.current >= 20 ? 2 : heatRef.current > 1 ? 1 : 0;
      if (wanted > prevWanted && wanted > 0) sounds.playInspect(); // alert sting on heat-up

      // Report heat to HUD (only when the integer changes)
      const heatInt = Math.round(heatRef.current);
      if (heatInt !== lastHeatReported.current) {
        lastHeatReported.current = heatInt;
        if (onHeatChange) onHeatChange(heatInt);
      }

      if (bustedCooldownRef.current > 0) bustedCooldownRef.current -= dt;

      // Desired chaser count scales with wanted level
      const desiredAgents = bustedCooldownRef.current > 0 ? 0 : wanted >= 4 ? 3 : wanted >= 2 ? 2 : wanted >= 1 ? 1 : 0;
      while (agentsRef.current.length < desiredAgents) {
        // Spawn at a random edge near the player, just off-screen
        const ang = Math.random() * Math.PI * 2;
        const spawnDist = 0.16 + Math.random() * 0.06;
        agentsRef.current.push({
          id: agentIdRef.current++,
          x: Math.max(0.08, Math.min(0.92, p.x + Math.cos(ang) * spawnDist)),
          y: Math.max(0.44, Math.min(0.82, p.y + Math.sin(ang) * spawnDist * 0.6)),
          speed: 0.00082 + wanted * 0.00005,
          facing: Math.atan2(p.y - p.y, 1),
          walkCycle: Math.random() * 6,
          sirenPhase: Math.random() * 10,
        });
        // Siren burst particles on spawn
        for (let i = 0; i < 6; i++) {
          particlesRef.current.push({
            x: p.x * worldW,
            y: p.y * worldH,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 3 + 2,
            color: i % 2 ? "#EF4444" : "#3B82F6",
            alpha: 1,
            life: 26,
          });
        }
      }
      if (agentsRef.current.length > desiredAgents) {
        agentsRef.current = agentsRef.current.slice(0, desiredAgents);
      }

      // Chase AI + catch detection
      const keptAgents: SecAgent[] = [];
      agentsRef.current.forEach((a) => {
        const dx = p.x - a.x;
        const dy = p.y - a.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.0005) {
          a.facing = Math.atan2(dy, dx);
          // Slight weave so they don't stack perfectly
          const weave = Math.sin(Date.now() * 0.004 + a.sirenPhase) * 0.25;
          const moveAng = a.facing + weave * 0.3;
          a.x += Math.cos(moveAng) * a.speed * dt;
          a.y += Math.sin(moveAng) * a.speed * dt;
          a.walkCycle += 0.2 * dt;
        }
        a.sirenPhase += 0.12 * dt;
        a.x = Math.max(0.08, Math.min(0.92, a.x));
        a.y = Math.max(0.44, Math.min(0.82, a.y));

        if (dist < 0.024 && bustedCooldownRef.current <= 0) {
          // BUSTED — SEC caught you
          bustedCooldownRef.current = 200;
          bustedFlashRef.current = 1;
          shakeRef.current = 16;
          heatRef.current = 0;
          if (onBusted) onBusted();
          // Don't keep this agent; clear the rest below via cooldown
          return;
        }
        keptAgents.push(a);
      });
      agentsRef.current = bustedCooldownRef.current > 0 ? [] : keptAgents;

      // --- 3. CAMERA & VIEWPORT SMOOTHING ---
      const cam = {
        x: p.x * worldW - screenW / 2,
        y: p.y * worldH - screenH / 2,
      };

      // Clamp camera to world bounds
      cam.x = Math.max(0, Math.min(worldW - screenW, cam.x));
      cam.y = Math.max(0, Math.min(worldH - screenH, cam.y));

      // Screen shake kick (decays each frame) — triggered by rare pickups
      if (shakeRef.current > 0.3) {
        cam.x += (Math.random() - 0.5) * shakeRef.current;
        cam.y += (Math.random() - 0.5) * shakeRef.current;
        shakeRef.current *= 0.88;
      } else {
        shakeRef.current = 0;
      }

      ctx.clearRect(0, 0, screenW, screenH);

      // --- 4. RENDER CLEAN PROMENADE BACKGROUND ---
      const bgImg = bgImageRef.current;
      if (bgImg && (isImageLoadedRef.current || bgImg.complete) && bgImg.naturalWidth > 0) {
        ctx.drawImage(bgImg, -cam.x, -cam.y, worldW, worldH);
      } else {
        const grad = ctx.createLinearGradient(0, 0, 0, screenH);
        grad.addColorStop(0, "#080c16");
        grad.addColorStop(1, "#03060c");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, screenW, screenH);
      }

      // --- 5. RENDER COLLECTIBLES ---
      const remainingCollectibles: Collectible[] = [];
      collectiblesRef.current.forEach((col) => {
        // Magnet: nearby collectibles drift toward the player (feels great)
        const mdx = p.x - col.x;
        const mdy = p.y - col.y;
        const mdist = Math.hypot(mdx, mdy);
        if (mdist < 0.075 && mdist > 0.0005) {
          const pull = (0.075 - mdist) * 0.10 * dt;
          col.x += (mdx / mdist) * pull;
          col.y += (mdy / mdist) * pull;
        }

        const colScreenX = col.x * worldW - cam.x;
        const colScreenY = col.y * worldH - cam.y;

        // Proximity detection with player
        const distToPlayer = Math.hypot(p.x - col.x, p.y - col.y);
        if (distToPlayer < 0.032) {
          const isRare = col.type !== "sol_coin";
          sounds.playCollect();
          if (isRare) {
            // Screen shake kick + expanding shockwave ring on rare pickups
            shakeRef.current = Math.min(14, shakeRef.current + (col.type === "god_candle" ? 9 : 6));
            ringsRef.current.push({
              x: col.x * worldW,
              y: col.y * worldH,
              r: 8,
              maxR: col.type === "god_candle" ? 90 : 65,
              color: col.color,
              alpha: 0.9,
            });
          }
          // Heat gain — big scores attract the SEC
          const heatGain =
            col.type === "whale_bag" ? 14 : col.type === "god_candle" ? 10 : col.type === "diamond" ? 5 : 2;
          heatRef.current = Math.min(100, heatRef.current + heatGain);
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

          // Burst particles (bigger burst for rare pickups)
          const burstCount = isRare ? 18 : 8;
          for (let i = 0; i < burstCount; i++) {
            const ang = (i / burstCount) * Math.PI * 2;
            particlesRef.current.push({
              x: col.x * worldW,
              y: col.y * worldH,
              vx: Math.cos(ang) * (Math.random() * 2 + 1) * (isRare ? 1.6 : 1),
              vy: Math.sin(ang) * (Math.random() * 2 + 1) * (isRare ? 1.6 : 1),
              size: Math.random() * 3 + 2,
              color: col.color,
              alpha: 1,
              life: isRare ? 42 : 30,
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

      if (collectiblesRef.current.length === 0) {
        spawnCollectibles();
      }

      // --- 6. Y-SORTED DEPTH RENDERING (PHOTOREALISTIC STREETWEAR HUMANS) ---
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

        // Depth perspective scale: 0.80 near bull stairs, 1.25 in foreground
        const depth = 0.85 + (t.y - 0.42) * 1.0;
        const distToPlayer = Math.hypot(p.x - t.x, p.y - t.y);
        const showInspect = distToPlayer < 0.055;

        renderables.push({
          type: "trader",
          y: ty,
          draw: () => {
            drawPhotorealisticHuman(ctx, tx, ty, depth, t.facing, t.walkCycle, t.isMoving, {
              spriteBaseKey: t.spriteKey,
              roleColor: t.roleColor,
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
      const pDepth = 0.85 + (p.y - 0.42) * 1.0;

      renderables.push({
        type: "player",
        y: py,
        draw: () => {
          drawPhotorealisticHuman(ctx, px, py, pDepth, p.facing, p.walkCycle, p.isMoving, {
            isPlayer: true,
            isTurbo: isSprinting,
            spriteBaseKey: "player",
          });
        },
      });

      // Sort by Y so closer characters overlap further ones
      renderables.sort((a, b) => a.y - b.y);
      renderables.forEach((r) => r.draw());

      // --- 6b. SEC AGENTS (GTA chasers) ---
      agentsRef.current.forEach((a) => {
        const ax = a.x * worldW - cam.x;
        const ay = a.y * worldH - cam.y;
        if (ax < -80 || ax > screenW + 80 || ay < -120 || ay > screenH + 80) return;
        const depth = 0.85 + (a.y - 0.42) * 1.0;
        const bob = Math.abs(Math.sin(a.walkCycle)) * 4 * depth;

        ctx.save();
        ctx.translate(ax, ay);

        // Contact shadow
        ctx.beginPath();
        ctx.ellipse(0, 0, 26 * depth, 9 * depth, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(4, 7, 15, 0.72)";
        ctx.fill();

        // Dark suit body
        const bodyH = 62 * depth;
        const bodyW = 30 * depth;
        ctx.fillStyle = "#0F172A";
        ctx.strokeStyle = "#1E293B";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-bodyW / 2, -bodyH - bob, bodyW, bodyH, 8 * depth);
        ctx.fill();
        ctx.stroke();
        // Tie
        ctx.fillStyle = "#B91C1C";
        ctx.fillRect(-2.5 * depth, -bodyH + 8 * depth - bob, 5 * depth, 22 * depth);
        // Head
        ctx.beginPath();
        ctx.arc(0, -bodyH - 14 * depth - bob, 11 * depth, 0, Math.PI * 2);
        ctx.fillStyle = "#1E293B";
        ctx.fill();
        // Sunglasses
        ctx.fillStyle = "#020617";
        ctx.fillRect(-9 * depth, -bodyH - 17 * depth - bob, 18 * depth, 5 * depth);
        // Flashing siren light above head
        const sirenOn = Math.sin(a.sirenPhase * 2.4) > 0;
        ctx.beginPath();
        ctx.arc(0, -bodyH - 32 * depth - bob, 6 * depth, 0, Math.PI * 2);
        ctx.fillStyle = sirenOn ? "#EF4444" : "#3B82F6";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;
        // SEC tag
        ctx.font = `900 ${10 * depth}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = sirenOn ? "#FCA5A5" : "#93C5FD";
        ctx.fillText("SEC", 0, -bodyH - 42 * depth - bob);

        ctx.restore();
      });

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

      // --- 8b. SHOCKWAVE RINGS (rare pickup celebration) ---
      const activeRings: typeof ringsRef.current = [];
      ringsRef.current.forEach((rg) => {
        rg.r += (rg.maxR - rg.r) * 0.16 * dt + 1.2 * dt;
        rg.alpha *= Math.pow(0.90, dt);
        if (rg.r < rg.maxR && rg.alpha > 0.03) {
          const sx = rg.x - cam.x;
          const sy = rg.y - cam.y;
          ctx.save();
          ctx.beginPath();
          ctx.arc(sx, sy, rg.r, 0, Math.PI * 2);
          ctx.strokeStyle = rg.color;
          ctx.globalAlpha = Math.max(0, rg.alpha);
          ctx.lineWidth = 3;
          ctx.shadowColor = rg.color;
          ctx.shadowBlur = 12;
          ctx.stroke();
          // inner echo ring
          ctx.beginPath();
          ctx.arc(sx, sy, rg.r * 0.62, 0, Math.PI * 2);
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
          activeRings.push(rg);
        }
      });
      ctx.globalAlpha = 1;
      ringsRef.current = activeRings;

      // --- 8c. BUSTED red flash ---
      if (bustedFlashRef.current > 0.02) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.45, bustedFlashRef.current * 0.45);
        const vg = ctx.createRadialGradient(
          screenW / 2, screenH / 2, screenH * 0.25,
          screenW / 2, screenH / 2, screenH * 0.75
        );
        vg.addColorStop(0, "rgba(220, 38, 38, 0)");
        vg.addColorStop(1, "rgba(220, 38, 38, 0.9)");
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, screenW, screenH);
        ctx.restore();
        bustedFlashRef.current *= Math.pow(0.94, dt);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("click", handleCanvasClick);
    };
  }, [joystickVector, isSprinting, onInspectTrader, onCollectXP, onUpdateCoords, onHeatChange, onBusted, spawnCollectibles, drawPhotorealisticHuman]);

  return (
    <div className="arena-canvas-wrapper">
      <canvas ref={canvasRef} className="arena-game-canvas" />
    </div>
  );
}
