"use client";

/**
 * Hand-drawn line sprigs used for empty states and quiet decoration.
 * Drawn as paths rather than imported illustrations so they inherit `currentColor`
 * and never look like clip-art.
 */
export function Sprig({ variant = "stem", size = 96 }: { variant?: "stem" | "bud" | "leaf"; size?: number }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.1,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden className="text-blush-400">
      {variant === "stem" ? (
        <g {...common}>
          <path d="M60 108C60 84 58 62 52 42" />
          <path d="M52 78c-10-2-18-9-20-19 11-1 19 4 22 15" />
          <path d="M58 62c9-4 15-12 15-22-10 2-16 9-17 20" />
          <path d="M52 44c-9-1-16-7-18-16 10-1 17 4 20 13" />
          <ellipse cx="49" cy="32" rx="9" ry="12" transform="rotate(-18 49 32)" />
          <ellipse cx="60" cy="28" rx="7" ry="11" transform="rotate(12 60 28)" />
          <path d="M46 34c3 4 8 6 13 5" opacity="0.5" />
        </g>
      ) : null}
      {variant === "bud" ? (
        <g {...common}>
          <path d="M60 106V58" />
          <path d="M60 58c-12 0-20-9-20-21 12-1 20 7 20 21z" />
          <path d="M60 58c12 0 20-9 20-21-12-1-20 7-20 21z" />
          <path d="M60 46c0-11 5-19 14-23 2 11-4 20-14 23z" opacity="0.55" />
          <path d="M60 84c-8-1-14-6-15-14 9 0 14 5 15 14z" />
        </g>
      ) : null}
      {variant === "leaf" ? (
        <g {...common}>
          <path d="M24 96c26-4 48-18 60-40 8-15 9-30 6-42-14 4-27 12-37 24-13 15-22 36-29 58z" />
          <path d="M28 92c14-20 30-38 52-52" opacity="0.5" />
        </g>
      ) : null}
    </svg>
  );
}
