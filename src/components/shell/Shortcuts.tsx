"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ALL_NAV_ITEMS } from "./nav";
import { useShellUI } from "./ui-context";

const TYPING = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export const SHORTCUTS: Array<{ keys: string; action: string }> = [
  { keys: "C", action: "Add a task" },
  { keys: "/", action: "Search everything" },
  { keys: "H", action: "Home" },
  { keys: "T", action: "Today" },
  { keys: "W", action: "This week" },
  { keys: "M", action: "This month" },
  { keys: "A", action: "All tasks" },
  { keys: "K", action: "Kitchen" },
  { keys: "B", action: "Habits" },
  { keys: "G", action: "Goals" },
  { keys: "F", action: "Focus timer" },
  { keys: "N", action: "Notes" },
  { keys: "J", action: "Journal" },
  { keys: "?", action: "This list" },
  { keys: "Esc", action: "Close anything" },
];

/** Single-key navigation, ignored the moment she is typing anywhere. */
export function Shortcuts() {
  const router = useRouter();
  const { openQuickAdd, setSearchOpen } = useShellUI();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target && (TYPING.has(target.tagName) || target.isContentEditable || target.closest("[role='dialog']"));

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "/") {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (event.key === "?") {
        event.preventDefault();
        setHelpOpen((open) => !open);
        return;
      }
      if (event.key.toLowerCase() === "c") {
        event.preventDefault();
        openQuickAdd();
        return;
      }

      const item = ALL_NAV_ITEMS.find((entry) => entry.key === event.key.toLowerCase());
      if (item) {
        event.preventDefault();
        router.push(item.href);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openQuickAdd, router, setSearchOpen]);

  return (
    <AnimatePresence>
      {helpOpen ? (
        <div className="fixed inset-0 z-[58] grid place-items-center px-4">
          <motion.div
            className="absolute inset-0 bg-[#3b2a31]/25 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setHelpOpen(false)}
          />
          <motion.div
            role="dialog"
            aria-label="Keyboard shortcuts"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.99 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="relative w-full max-w-[420px] rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--surface)] p-8 shadow-[var(--shadow-lift)]"
          >
            <h2 className="font-display text-[24px] text-ink">Keys</h2>
            <p className="mt-1 text-[13px] text-ink-soft">One key, no chords.</p>
            <ul className="mt-6 grid grid-cols-1 gap-y-2.5 sm:grid-cols-2">
              {SHORTCUTS.map((shortcut) => (
                <li key={shortcut.keys} className="flex items-center gap-3 text-[13px]">
                  <kbd className="grid h-6 min-w-6 place-items-center rounded-[6px] border border-[var(--hairline-strong)] px-1.5 text-[11px] text-ink-soft">
                    {shortcut.keys}
                  </kbd>
                  <span className="text-ink-soft">{shortcut.action}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
