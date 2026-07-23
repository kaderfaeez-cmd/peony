"use client";

import { useEffect, useRef } from "react";
import { useCelebrate } from "@/components/ui/Celebration";
import { useToast } from "@/components/ui/Toaster";
import { todayKey } from "@/lib/date";
import type { Task } from "@/types";

const storageKey = (day: string) => `peony.celebrated.${day}`;

/**
 * Petals when the last box of the day is ticked — once per day, never twice, and
 * never on an empty list.
 */
export function useDailyCelebration(todaysTasks: Task[]) {
  const celebrate = useCelebrate();
  const { notify } = useToast();
  const guard = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const day = todayKey();
    const total = todaysTasks.length;
    const done = todaysTasks.filter((task) => task.done).length;

    if (total === 0 || done < total) {
      guard.current = false;
      return;
    }
    if (guard.current) return;
    if (window.localStorage.getItem(storageKey(day))) return;

    guard.current = true;
    window.localStorage.setItem(storageKey(day), "1");
    celebrate(1.2);
    notify("That's everything for today. Go and enjoy it.");
  }, [todaysTasks, celebrate, notify]);
}
