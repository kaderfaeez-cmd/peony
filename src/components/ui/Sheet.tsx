"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { IconButton } from "./Button";

/**
 * One dialog primitive for the whole app: a right-hand sheet on desktop, a
 * bottom sheet on phones. Focus is trapped, Escape closes, scroll is locked.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const timer = setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("input, textarea, button")?.focus();
    }, 60);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      clearTimeout(timer);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end">
          <motion.div
            className="absolute inset-0 bg-[#3b2a31]/25 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 40, x: 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
            className={cn(
              "relative flex max-h-[92vh] w-full flex-col bg-[var(--surface)]",
              "rounded-t-[var(--radius-xl)] shadow-[var(--shadow-lift)]",
              "sm:h-full sm:max-h-none sm:w-[min(460px,100vw)] sm:rounded-none sm:rounded-l-[var(--radius-xl)]",
              className,
            )}
          >
            <header className="flex items-start justify-between gap-4 px-7 pb-5 pt-7">
              <div className="min-w-0">
                <h2 className="font-display text-[26px] leading-tight text-ink">{title}</h2>
                {description ? (
                  <p className="mt-1 text-[13px] text-ink-soft">{description}</p>
                ) : null}
              </div>
              <IconButton label="Close" onClick={onClose}>
                <X size={16} strokeWidth={1.6} />
              </IconButton>
            </header>
            <div className="scrollbar-quiet flex-1 overflow-y-auto px-7 pb-6">{children}</div>
            {footer ? (
              <footer className="flex items-center justify-end gap-2 border-t border-[var(--hairline)] px-7 py-4">
                {footer}
              </footer>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
