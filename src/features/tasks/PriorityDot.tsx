import { cn } from "@/lib/cn";
import type { Priority } from "@/types";
import { PRIORITY_LABELS } from "./schema";

const STYLES: Record<Priority, string> = {
  high: "bg-blush-600",
  medium: "bg-blush-200",
  low: "border border-[var(--hairline-strong)] bg-transparent",
};

/** Three states told through weight, not through three different colours. */
export function PriorityDot({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span
      title={PRIORITY_LABELS[priority]}
      aria-label={PRIORITY_LABELS[priority]}
      className={cn("inline-block h-[7px] w-[7px] shrink-0 rounded-full", STYLES[priority], className)}
    />
  );
}
