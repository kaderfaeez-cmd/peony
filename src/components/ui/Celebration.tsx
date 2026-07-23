"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";

/**
 * Falling petals, not confetti rectangles. Each petal is an arc pair drawn on a
 * canvas, tumbling on its own axis with a little horizontal sway — the point is
 * that it looks like a peony shedding, never like a party popper.
 */

interface Petal {
  x: number;
  y: number;
  size: number;
  vy: number;
  vx: number;
  spin: number;
  angle: number;
  sway: number;
  phase: number;
  color: string;
  life: number;
}

const PALETTE = ["#FFE5EC", "#FFC2D1", "#FFB3C6", "#FF8FAB", "#FB6F92"];

const CelebrationContext = createContext<{ celebrate: (intensity?: number) => void } | null>(null);

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const petals = useRef<Petal[]>([]);
  const frame = useRef<number | null>(null);

  const step = useCallback(function step() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    const alive: Petal[] = [];

    for (const petal of petals.current) {
      petal.life += 1;
      petal.phase += 0.02;
      petal.y += petal.vy;
      petal.x += petal.vx + Math.sin(petal.phase) * petal.sway;
      petal.angle += petal.spin;

      if (petal.y < canvas.height + 40) {
        alive.push(petal);
        context.save();
        context.translate(petal.x, petal.y);
        context.rotate(petal.angle);
        // Squash on the horizontal axis as it tumbles, so petals read as 3D.
        context.scale(1, 0.55 + Math.abs(Math.cos(petal.phase)) * 0.45);
        context.fillStyle = petal.color;
        context.globalAlpha = Math.max(0, Math.min(1, 1 - petal.life / 320));
        context.beginPath();
        context.moveTo(0, -petal.size);
        context.bezierCurveTo(petal.size, -petal.size * 0.6, petal.size * 0.8, petal.size * 0.7, 0, petal.size);
        context.bezierCurveTo(-petal.size * 0.8, petal.size * 0.7, -petal.size, -petal.size * 0.6, 0, -petal.size);
        context.fill();
        context.restore();
      }
    }

    petals.current = alive;
    frame.current = alive.length > 0 ? requestAnimationFrame(step) : null;
  }, []);

  const celebrate = useCallback(
    (intensity = 1) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (document.documentElement.dataset.motion === "calm") return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const count = Math.round(46 * intensity);
      for (let index = 0; index < count; index += 1) {
        petals.current.push({
          x: Math.random() * canvas.width,
          y: -40 - Math.random() * canvas.height * 0.5,
          size: 5 + Math.random() * 8,
          vy: 1.1 + Math.random() * 1.9,
          vx: -0.4 + Math.random() * 0.8,
          spin: (Math.random() - 0.5) * 0.05,
          angle: Math.random() * Math.PI,
          sway: 0.3 + Math.random() * 0.8,
          phase: Math.random() * Math.PI * 2,
          color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
          life: 0,
        });
      }

      if (frame.current === null) frame.current = requestAnimationFrame(step);
    },
    [step],
  );

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  const value = useMemo(() => ({ celebrate }), [celebrate]);

  return (
    <CelebrationContext.Provider value={value}>
      {children}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[70]"
      />
    </CelebrationContext.Provider>
  );
}

export function useCelebrate() {
  const context = useContext(CelebrationContext);
  if (!context) throw new Error("useCelebrate must be used inside <CelebrationProvider>");
  return context.celebrate;
}
