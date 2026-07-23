"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

/** A slow rose shimmer — closer to breathing than to a loading bar. */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      style={style}
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-sm)] bg-[color-mix(in_oklab,var(--paper-deep),transparent_20%)]",
        className,
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-[peony-shimmer_2.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-blush-50/70 to-transparent dark:via-blush-600/10" />
    </div>
  );
}

export function TaskSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-5" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="h-[22px] w-[22px] rounded-full" />
          <Skeleton className="h-3.5" style={{ width: `${58 + ((index * 13) % 30)}%` }} />
        </div>
      ))}
    </div>
  );
}
