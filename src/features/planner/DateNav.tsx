"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "@/components/ui/Button";

/** Previous / next / back-to-now, used by the day, week and month views. */
export function DateNav({
  onPrevious,
  onNext,
  onReset,
  resetLabel = "Today",
  unit,
  showReset = true,
}: {
  onPrevious: () => void;
  onNext: () => void;
  onReset: () => void;
  resetLabel?: string;
  unit: string;
  showReset?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <IconButton label={`Previous ${unit}`} onClick={onPrevious}>
        <ChevronLeft size={16} strokeWidth={1.7} />
      </IconButton>
      {showReset ? (
        <button
          onClick={onReset}
          className="rounded-full px-3 py-1 text-[12.5px] text-ink-soft transition-colors hover:bg-blush-50 hover:text-rose-ink dark:hover:bg-blush-600/15"
        >
          {resetLabel}
        </button>
      ) : null}
      <IconButton label={`Next ${unit}`} onClick={onNext}>
        <ChevronRight size={16} strokeWidth={1.7} />
      </IconButton>
    </div>
  );
}
