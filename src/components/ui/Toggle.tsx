"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

/** A small, quiet switch: the knob slides, the track blushes. */
export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-8 py-4">
      <div className="min-w-0">
        <p className="text-[14px] text-ink">{label}</p>
        {description ? (
          <p className="mt-0.5 max-w-[46ch] text-[12.5px] leading-relaxed text-ink-soft">{description}</p>
        ) : null}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-[24px] w-[42px] shrink-0 rounded-full border transition-colors duration-300",
          checked ? "border-blush-600 bg-blush-600" : "border-[var(--hairline-strong)] bg-transparent",
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 520, damping: 34 }}
          className={cn(
            "absolute top-[3px] h-[16px] w-[16px] rounded-full",
            checked ? "left-[22px] bg-white" : "left-[3px] bg-[var(--hairline-strong)]",
          )}
        />
      </button>
    </div>
  );
}
