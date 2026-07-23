"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * The room the app sits in.
 *
 * A slow field of pink flowers, blurred past the point of legibility and pushed
 * behind a paper wash so text contrast never depends on which frame is playing.
 * The video only mounts after first paint, and never for reduced-motion users —
 * they still get the poster still, so the atmosphere survives without the weight.
 */
export function Atmosphere({ enabled = true, intensity = 1 }: { enabled?: boolean; intensity?: number }) {
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(max-width: 640px)").matches) return; // save phone data

    const schedule =
      window.requestIdleCallback?.bind(window) ?? ((callback: () => void) => window.setTimeout(callback, 900));
    const handle = schedule(() => setShowVideo(true));
    return () => {
      if (typeof handle === "number") window.clearTimeout(handle);
    };
  }, [enabled]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {enabled ? (
        <div
          className="absolute inset-0"
          style={{ opacity: `calc(var(--atmosphere-opacity) * ${intensity})` }}
        >
          <div
            className="absolute inset-[-3%] bg-[url('/media/atmosphere-poster.webp')] bg-cover bg-center"
            style={{ animation: "peony-drift 34s ease-in-out infinite" }}
          />
          {showVideo ? (
            <video
              className={cn(
                "absolute inset-[-3%] h-[106%] w-[106%] object-cover",
                "opacity-0 transition-opacity duration-[1600ms] ease-out data-[ready=true]:opacity-100",
              )}
              src="/media/atmosphere.mp4"
              poster="/media/atmosphere-poster.webp"
              autoPlay
              muted
              loop
              playsInline
              preload="none"
              onCanPlay={(event) => {
                event.currentTarget.dataset.ready = "true";
              }}
            />
          ) : null}
        </div>
      ) : null}

      {/*
        A light wash only — enough to hold text contrast, not enough to hide the
        flowers. The video itself is unblurred.
      */}
      <div className="absolute inset-0 bg-[var(--paper)]/[0.16] dark:bg-[var(--paper)]/[0.34]" />
      <div className="atmosphere-wash absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_15%_-10%,rgba(255,229,236,0.42),transparent_62%),radial-gradient(90%_70%_at_100%_110%,rgba(255,179,198,0.28),transparent_64%)] dark:bg-[radial-gradient(120%_80%_at_15%_-10%,rgba(251,111,146,0.12),transparent_58%),radial-gradient(90%_70%_at_100%_110%,rgba(255,143,171,0.08),transparent_60%)]" />
      <Grain />
    </div>
  );
}

/** Fine film grain so large flat areas of paper never look like flat #fff. */
export function Grain() {
  return (
    <div
      className="absolute inset-0 mix-blend-multiply dark:mix-blend-screen"
      style={{
        opacity: "var(--grain-opacity)",
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
      }}
    />
  );
}
