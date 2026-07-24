"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Moon, Settings2, Sun as SunIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useActions, useSettings } from "@/lib/store/provider";
import { NAV } from "./nav";
import { useShellUI } from "./ui-context";

function Wordmark() {
  return (
    <Link href="/home" className="group flex items-baseline gap-1.5" aria-label="Peony, go home">
      <span className="font-display text-[23px] leading-none text-ink">Peony</span>
      <motion.span
        className="mb-0.5 h-1.5 w-1.5 rounded-full bg-blush-600"
        initial={false}
        whileHover={{ scale: 1.6 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      />
    </Link>
  );
}

function ThemeToggle() {
  const settings = useSettings();
  const actions = useActions();
  const dark = settings.theme === "dark";

  return (
    <button
      onClick={() => actions.updateSettings({ theme: dark ? "light" : "dark" })}
      aria-label={dark ? "Switch to light" : "Switch to dark"}
      className="flex items-center gap-2 text-[13px] text-ink-soft transition-colors hover:text-ink"
    >
      <span className="relative grid h-7 w-7 place-items-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={dark ? "moon" : "sun"}
            initial={{ opacity: 0, rotate: -35, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 35, scale: 0.7 }}
            transition={{ duration: 0.24 }}
            className="absolute"
          >
            {dark ? <Moon size={15} strokeWidth={1.6} /> : <SunIcon size={15} strokeWidth={1.6} />}
          </motion.span>
        </AnimatePresence>
      </span>
      {dark ? "Dusk" : "Daylight"}
    </button>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex flex-col gap-5">
      {NAV.map((group) => (
        <div key={group.title}>
          <p className="mb-2 pl-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-faint">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href} className="relative">
                  {active ? (
                    <motion.span
                      layoutId="nav-marker"
                      className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-blush-600"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  ) : null}
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-[var(--radius-sm)] px-4 py-[5px] text-[14px] transition-colors duration-200",
                      active ? "text-ink" : "text-ink-soft hover:text-ink",
                    )}
                  >
                    <Icon
                      size={15}
                      strokeWidth={1.6}
                      className={cn(
                        "transition-colors",
                        active ? "text-rose-ink" : "text-ink-faint group-hover:text-blush-400",
                      )}
                    />
                    <span className={cn(active && "font-medium")}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function RailFooter({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="space-y-2.5 border-t border-[var(--hairline)] pt-4">
      <Link
        href="/settings"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-2 text-[13px] transition-colors",
          pathname === "/settings" ? "text-ink" : "text-ink-soft hover:text-ink",
        )}
      >
        <span className="grid h-7 w-7 place-items-center">
          <Settings2 size={15} strokeWidth={1.6} />
        </span>
        Settings
      </Link>
      <ThemeToggle />
    </div>
  );
}

export function NavRail() {
  return (
    // Scrolls rather than clips: on a short window the footer must stay reachable.
    <aside className="scrollbar-quiet sticky top-0 hidden h-dvh w-[236px] shrink-0 flex-col overflow-y-auto border-r border-[var(--hairline)] px-6 py-7 lg:flex">
      <div className="space-y-7">
        <Wordmark />
        <NavLinks />
      </div>
      <div className="mt-auto pt-6">
        <RailFooter />
      </div>
    </aside>
  );
}

export function NavDrawer() {
  const { navOpen, setNavOpen } = useShellUI();

  return (
    <AnimatePresence>
      {navOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            className="absolute inset-0 bg-[#3b2a31]/25 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNavOpen(false)}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
            className="scrollbar-quiet relative flex h-full w-[264px] flex-col overflow-y-auto bg-[var(--surface)] px-6 py-8 shadow-[var(--shadow-lift)]"
          >
            <div className="space-y-8">
              <Wordmark />
              <NavLinks onNavigate={() => setNavOpen(false)} />
            </div>
            <div className="mt-auto pt-8">
              <RailFooter onNavigate={() => setNavOpen(false)} />
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
