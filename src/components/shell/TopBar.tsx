"use client";

import { Menu, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { useShellUI } from "./ui-context";

/**
 * Deliberately not a page header — pages own their own titles. This is just the
 * two things that must always be within reach: find, and add.
 */
export function TopBar() {
  const { setNavOpen, setSearchOpen, openQuickAdd } = useShellUI();
  const [scrolled, setScrolled] = useState(false);
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(format(new Date(), "EEEE, d MMMM"));
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 flex items-center gap-3 px-[var(--space-gutter)] py-4 transition-all duration-300 ${
        scrolled ? "surface-sheet border-b border-[var(--hairline)]" : ""
      }`}
    >
      <IconButton label="Open menu" className="lg:hidden" onClick={() => setNavOpen(true)}>
        <Menu size={17} strokeWidth={1.6} />
      </IconButton>

      <p className="hidden text-[13px] text-ink-faint sm:block">{today}</p>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setSearchOpen(true)}
          className="group flex items-center gap-2 rounded-full border border-[var(--hairline-strong)] py-1.5 pl-3 pr-2 text-[13px] text-ink-faint transition-colors hover:border-blush-400 hover:text-ink-soft"
          aria-label="Search everything"
        >
          <Search size={14} strokeWidth={1.7} />
          <span className="hidden sm:inline">Search</span>
          <kbd className="ml-1 hidden rounded-[5px] border border-[var(--hairline)] px-1.5 py-0.5 text-[10px] tracking-wide text-ink-faint sm:inline">
            /
          </kbd>
        </button>

        <Button size="sm" onClick={() => openQuickAdd()} className="pl-2.5">
          <Plus size={15} strokeWidth={2} />
          <span className="hidden sm:inline">Add task</span>
        </Button>
      </div>
    </header>
  );
}
