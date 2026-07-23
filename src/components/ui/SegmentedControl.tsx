"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/cn";

export interface Segment<T extends string> {
  value: T;
  label: string;
}

/** The rose slides between options instead of appearing under the new one. */
export function SegmentedControl<T extends string>({
  value,
  segments,
  onChange,
  className,
  ariaLabel,
}: {
  value: T;
  segments: Segment<T>[];
  onChange: (value: T) => void;
  className?: string;
  ariaLabel: string;
}) {
  const layoutId = useId();

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("inline-flex items-center gap-1 rounded-full p-1", className)}
    >
      {segments.map((segment) => {
        const active = segment.value === value;
        return (
          <button
            key={segment.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(segment.value)}
            className={cn(
              "relative rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-200",
              active ? "text-[#8a3f5a] dark:text-blush-100" : "text-ink-faint hover:text-ink-soft",
            )}
          >
            {active ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-blush-50 dark:bg-blush-600/20"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span className="relative">{segment.label}</span>
          </button>
        );
      })}
    </div>
  );
}
