"use client";

import { useEffect, useRef } from "react";
import { todayKey } from "@/lib/date";
import { usePlannerSelector, useSettings } from "@/lib/store/provider";

const CHECK_INTERVAL = 30_000;

/**
 * Fires a browser notification when a timed task comes due while the app is open.
 * Deliberately in-page: no service worker, no server, nothing that outlives the tab.
 */
export function useReminders() {
  const settings = useSettings();
  const tasks = usePlannerSelector((state) => state.tasks);
  const fired = useRef(new Set<string>());
  const tasksRef = useRef(tasks);

  // Kept in a ref so the checking interval never has to restart when a task changes.
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    if (!settings.reminders) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const check = () => {
      const now = new Date();
      const today = todayKey();
      const minutesNow = now.getHours() * 60 + now.getMinutes();

      for (const task of tasksRef.current) {
        if (task.done || task.archived || task.date !== today || !task.time) continue;
        if (fired.current.has(task.id)) continue;

        const [hours, minutes] = task.time.split(":").map(Number);
        const due = hours * 60 + minutes;
        if (due <= minutesNow && minutesNow - due < 2) {
          fired.current.add(task.id);
          new Notification(task.title, {
            body: task.description || "It's time.",
            icon: "/icon.svg",
            silent: true,
          });
        }
      }
    };

    check();
    const timer = setInterval(check, CHECK_INTERVAL);
    return () => clearInterval(timer);
  }, [settings.reminders]);
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}
