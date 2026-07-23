"use client";

import { isSameMonth } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { format, monthGrid, toKey, todayKey } from "@/lib/date";
import type { Habit } from "@/types";

/**
 * A month of small squares. Ticked days fill with rose; the rest stay as faint
 * paper, so a good month looks like a blush rather than a chart.
 */
export function HabitHeatmap({
  habit,
  anchor = new Date(),
  mondayFirst = true,
  onToggle,
}: {
  habit: Habit;
  anchor?: Date;
  mondayFirst?: boolean;
  onToggle?: (day: string) => void;
}) {
  const days = monthGrid(anchor, mondayFirst);
  const today = todayKey();
  const log = new Set(habit.log);

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((day, index) => {
        const key = toKey(day);
        const outside = !isSameMonth(day, anchor);
        const done = log.has(key);
        const future = key > today;

        return (
          <motion.button
            key={key}
            disabled={outside || future || !onToggle}
            onClick={() => onToggle?.(key)}
            whileTap={{ scale: 0.86 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: outside ? 0.25 : 1, scale: 1 }}
            transition={{ delay: Math.min(index * 0.004, 0.2), duration: 0.24 }}
            aria-label={`${format(day, "d MMMM")}${done ? " — done" : ""}`}
            className={cn(
              "aspect-square rounded-[4px] transition-colors",
              done ? "bg-blush-600" : "bg-[color-mix(in_oklab,var(--paper-deep),transparent_10%)]",
              !outside && !future && onToggle && !done && "hover:bg-blush-100",
              (outside || future) && "cursor-default",
            )}
          />
        );
      })}
    </div>
  );
}
