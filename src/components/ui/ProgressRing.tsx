"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/** Eases a number towards its target over ~900ms, frame by frame. */
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = fromRef.current;

    // A hidden tab never fires rAF, so land on the value instead of stalling at 0.
    if (reduced || document.hidden || from === target) {
      fromRef.current = target;
      setValue(target);
      return;
    }

    const start = performance.now();
    let frame = 0;

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      // easeOutExpo — arrives quickly, settles slowly.
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -9 * progress);
      const next = from + (target - from) * eased;
      setValue(next);
      fromRef.current = next;
      if (progress < 1) frame = requestAnimationFrame(step);
      else fromRef.current = target;
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

/**
 * Rounded-cap ring with a pale track. The arc and the number move together and
 * count up rather than snapping — the difference between a widget and a moment.
 */
export function ProgressRing({
  value,
  size = 96,
  stroke = 6,
  label,
  sublabel,
  tone = "#fb6f92",
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  tone?: string;
  className?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, value));
  const animated = useCountUp(clamped);

  return (
    <div
      className={cn("relative grid place-items-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label ?? "Progress"}: ${Math.round(clamped * 100)} per cent complete`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--hairline)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          // The arc follows the real value through CSS so it stays correct even
          // when frame callbacks are throttled; the label counts up separately.
          strokeDashoffset={circumference * (1 - clamped)}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center leading-none">
        <div className="numeral text-ink" style={{ fontSize: size * 0.3 }} aria-hidden>
          {Math.round(animated * 100)}
          <span className="text-ink-faint" style={{ fontSize: size * 0.16 }}>
            %
          </span>
        </div>
        {label ? (
          <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-ink-faint">{label}</div>
        ) : null}
        {sublabel ? <div className="mt-0.5 text-[11px] text-ink-soft">{sublabel}</div> : null}
      </div>
    </div>
  );
}

/** Hairline bar used where a ring would be too loud. */
export function ProgressBar({ value, tone = "#fb6f92" }: { value: number; tone?: string }) {
  return (
    <div className="h-[3px] w-full overflow-hidden rounded-full bg-[var(--hairline)]">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: tone }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
        transition={{ type: "spring", stiffness: 90, damping: 20 }}
      />
    </div>
  );
}
