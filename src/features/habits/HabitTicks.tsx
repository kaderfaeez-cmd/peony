"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { todayKey } from "@/lib/date";
import { useActions, usePlannerSelector } from "@/lib/store/provider";
import { habitStreak } from "@/lib/store/selectors";
import { HabitGlyph } from "./HabitGlyph";

/**
 * Today's habits, one tap each. The dot fills, the streak ticks up — that is the
 * whole interaction, and it should feel like pressing a soft button.
 */
export function HabitTicks({ limit }: { limit?: number }) {
  const habits = usePlannerSelector((state) => state.habits);
  const actions = useActions();
  const today = todayKey();

  const visible = habits.filter((habit) => !habit.archived).slice(0, limit);
  if (visible.length === 0) return null;

  return (
    <ul className="space-y-1">
      {visible.map((habit) => {
        const done = habit.log.includes(today);
        const streak = habitStreak(habit);

        return (
          <li key={habit.id}>
            <button
              onClick={() => actions.toggleHabitDay(habit.id, today)}
              aria-pressed={done}
              aria-label={`${habit.name}${done ? ", done today" : ", not done today"}`}
              className="group flex w-full items-center gap-3 rounded-[var(--radius-sm)] py-1.5 text-left transition-colors hover:bg-[color-mix(in_oklab,var(--paper-deep),transparent_40%)]"
            >
              <motion.span
                initial={false}
                animate={{
                  backgroundColor: done ? "#fb6f92" : "rgba(0,0,0,0)",
                  borderColor: done ? "#fb6f92" : "var(--hairline-strong)",
                  scale: done ? 1 : 0.94,
                }}
                whileTap={{ scale: 0.86 }}
                transition={{ type: "spring", stiffness: 420, damping: 24 }}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full border"
              >
                <HabitGlyph
                  name={habit.icon}
                  size={13}
                  className={cn("transition-colors", done ? "text-[#33161f]" : "text-ink-faint")}
                />
              </motion.span>

              <span className={cn("flex-1 text-[14px]", done ? "text-ink" : "text-ink-soft")}>
                {habit.name}
              </span>

              <span className="tabular text-[11.5px] text-ink-faint">
                {streak > 0 ? `${streak}d` : "—"}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
