"use client";

import { useEffect, useRef, useState } from "react";

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
  onEnd: () => void;
  size?: number;
}

export default function VirtualJoystick({
  onMove,
  onEnd,
  size = 110,
}: VirtualJoystickProps) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });
  const maxRadius = size / 2;

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;

    if (baseRef.current) {
      const rect = baseRef.current.getBoundingClientRect();
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    setActive(true);
    updateVector(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateVector(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setActive(false);
        setKnobPos({ x: 0, y: 0 });
        onEnd();
        break;
      }
    }
  };

  const updateVector = (clientX: number, clientY: number) => {
    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 4) {
      setKnobPos({ x: 0, y: 0 });
      onMove({ x: 0, y: 0 });
      return;
    }

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setKnobPos({ x: knobX, y: knobY });

    const normalizedPower = clampedDist / maxRadius;
    onMove({
      x: Math.cos(angle) * normalizedPower,
      y: Math.sin(angle) * normalizedPower,
    });
  };

  useEffect(() => {
    const onMoveWindow = (e: TouchEvent) => handleTouchMove(e);
    const onEndWindow = (e: TouchEvent) => handleTouchEnd(e);

    window.addEventListener("touchmove", onMoveWindow, { passive: false });
    window.addEventListener("touchend", onEndWindow);
    window.addEventListener("touchcancel", onEndWindow);

    return () => {
      window.removeEventListener("touchmove", onMoveWindow);
      window.removeEventListener("touchend", onEndWindow);
      window.removeEventListener("touchcancel", onEndWindow);
    };
  }, []);

  return (
    <div
      ref={baseRef}
      onTouchStart={handleTouchStart}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: active
          ? "radial-gradient(circle, rgba(14, 30, 56, 0.85) 0%, rgba(5, 11, 20, 0.92) 100%)"
          : "radial-gradient(circle, rgba(14, 25, 45, 0.6) 0%, rgba(4, 8, 16, 0.75) 100%)",
        border: active ? "2px solid rgba(56, 189, 248, 0.7)" : "2px solid rgba(255, 255, 255, 0.18)",
        boxShadow: active
          ? "0 0 25px rgba(56, 189, 248, 0.35), inset 0 0 15px rgba(56, 189, 248, 0.2)"
          : "0 8px 32px rgba(0, 0, 0, 0.6)",
        position: "relative",
        touchAction: "none",
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Direction markings */}
      <div style={{ position: "absolute", top: 8, fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 800 }}>▲</div>
      <div style={{ position: "absolute", bottom: 8, fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 800 }}>▼</div>
      <div style={{ position: "absolute", left: 8, fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 800 }}>◀</div>
      <div style={{ position: "absolute", right: 8, fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 800 }}>▶</div>

      {/* Inner guide ring */}
      <div
        style={{
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: "50%",
          border: "1px dashed rgba(255, 255, 255, 0.12)",
          pointerEvents: "none",
        }}
      />

      {/* Thumb Knob */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: active
            ? "radial-gradient(circle at 35% 35%, #67e8f9 0%, #0284c7 70%, #0369a1 100%)"
            : "radial-gradient(circle at 35% 35%, #e2e8f0 0%, #64748b 70%, #334155 100%)",
          boxShadow: active
            ? "0 0 18px rgba(56, 189, 248, 0.8), 0 4px 10px rgba(0,0,0,0.6)"
            : "0 4px 12px rgba(0, 0, 0, 0.5)",
          border: "2px solid rgba(255, 255, 255, 0.85)",
          position: "absolute",
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          transition: active ? "none" : "transform 0.18s cubic-bezier(0.18, 0.89, 0.32, 1.28)",
          pointerEvents: "none",
          display: "grid",
          placeItems: "center",
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.85)",
            boxShadow: "0 0 6px rgba(255,255,255,0.9)",
          }}
        />
      </div>
    </div>
  );
}
