"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { usePlanner } from "@/lib/store/provider";
import { search, type SearchHit } from "@/lib/store/selectors";
import { ALL_NAV_ITEMS } from "@/components/shell/nav";

const KIND_LABEL: Record<SearchHit["kind"], string> = {
  task: "Task",
  note: "Note",
  goal: "Goal",
  habit: "Habit",
  journal: "Journal",
  meal: "Menu",
  shopping: "Shopping",
};

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = usePlanner();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => search(state, query), [state, query]);

  const pages = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ALL_NAV_ITEMS.filter((item) => !needle || item.label.toLowerCase().includes(needle)).slice(0, 5);
  }, [query]);

  const rows = useMemo(
    () => [
      ...pages.map((page) => ({ id: page.href, label: page.label, hint: "Go to", href: page.href })),
      ...results.map((hit) => ({
        id: hit.id,
        label: hit.title,
        hint: `${KIND_LABEL[hit.kind]} · ${hit.detail}`,
        href: hit.href,
      })),
    ],
    [pages, results],
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActive(0);
      return;
    }
    const timer = setTimeout(() => inputRef.current?.focus(), 40);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => setActive(0), [query]);

  const go = (href?: string) => {
    if (!href) return;
    router.push(href);
    onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[55] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div
            className="absolute inset-0 bg-[#3b2a31]/25 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search everything"
            initial={{ opacity: 0, y: -12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="relative w-full max-w-[560px] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--surface)] shadow-[var(--shadow-lift)]"
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((index) => Math.min(index + 1, rows.length - 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((index) => Math.max(index - 1, 0));
              }
              if (event.key === "Enter") {
                event.preventDefault();
                go(rows[active]?.href);
              }
              if (event.key === "Escape") onClose();
            }}
          >
            <div className="flex items-center gap-3 border-b border-[var(--hairline)] px-5 py-4">
              <Search size={16} strokeWidth={1.7} className="text-ink-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tasks, notes, goals…"
                aria-label="Search"
                className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink-faint focus:outline-none"
              />
              <kbd className="rounded-[5px] border border-[var(--hairline)] px-1.5 py-0.5 text-[10px] text-ink-faint">
                esc
              </kbd>
            </div>

            <div className="scrollbar-quiet max-h-[46vh] overflow-y-auto py-2">
              {rows.length === 0 ? (
                <p className="px-5 py-8 text-center text-[13px] text-ink-faint">
                  {query ? "Nothing found. Try another word." : "Start typing to search everything."}
                </p>
              ) : (
                rows.map((row, index) => (
                  <button
                    key={`${row.id}-${index}`}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => go(row.href)}
                    className={cn(
                      "flex w-full items-center justify-between gap-4 px-5 py-2.5 text-left transition-colors",
                      index === active ? "bg-blush-50 dark:bg-blush-600/12" : "",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate text-[14px] text-ink">{row.label}</span>
                    <span className="shrink-0 text-[11px] uppercase tracking-[0.12em] text-ink-faint">
                      {row.hint}
                    </span>
                    {index === active ? (
                      <CornerDownLeft size={13} strokeWidth={1.7} className="shrink-0 text-blush-400" />
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
