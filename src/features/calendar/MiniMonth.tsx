"use client";

import { isSameMonth, isToday } from "date-fns";
import Link from "next/link";
import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { format, monthGrid, toKey } from "@/lib/date";
import { usePlannerSelector, useSettings } from "@/lib/store/provider";

const WEEKDAYS_MONDAY = ["M", "T", "W", "T", "F", "S", "S"];
const WEEKDAYS_SUNDAY = ["S", "M", "T", "W", "T", "F", "S"];

/** A month at a glance: numbers, and a dot when something lives on that day. */
export function MiniMonth({ anchor = new Date() }: { anchor?: Date }) {
  const tasks = usePlannerSelector((state) => state.tasks);
  const { weekStartsMonday } = useSettings();

  const days = useMemo(() => monthGrid(anchor, weekStartsMonday), [anchor, weekStartsMonday]);
  const density = useMemo(() => {
    const map = new Map<string, number>();
    for (const task of tasks) {
      if (!task.date || task.archived) continue;
      map.set(task.date, (map.get(task.date) ?? 0) + 1);
    }
    return map;
  }, [tasks]);

  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between">
        <p className="font-display text-[15px] text-ink">{format(anchor, "MMMM")}</p>
        <span className="tabular text-[11px] text-ink-faint">{format(anchor, "yyyy")}</span>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {(weekStartsMonday ? WEEKDAYS_MONDAY : WEEKDAYS_SUNDAY).map((day, index) => (
          <span key={`${day}-${index}`} className="pb-1 text-[9.5px] uppercase tracking-wider text-ink-faint">
            {day}
          </span>
        ))}

        {days.map((day) => {
          const key = toKey(day);
          const count = density.get(key) ?? 0;
          const outside = !isSameMonth(day, anchor);
          const today = isToday(day);

          return (
            <Link
              key={key}
              href={`/today?d=${key}`}
              className="group relative grid h-7 place-items-center"
              aria-label={`${format(day, "d MMMM")}${count ? `, ${count} tasks` : ""}`}
            >
              <span
                className={cn(
                  "tabular grid h-6 w-6 place-items-center rounded-full text-[11.5px] transition-colors",
                  outside ? "text-ink-faint/45" : "text-ink-soft",
                  today && "bg-blush-600 font-medium text-[#33161f]",
                  !today && "group-hover:bg-blush-50 dark:group-hover:bg-blush-600/15",
                )}
              >
                {day.getDate()}
              </span>
              {count > 0 && !today ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute bottom-0 h-[3px] w-[3px] rounded-full",
                    outside ? "bg-blush-200/60" : "bg-blush-400",
                  )}
                />
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
