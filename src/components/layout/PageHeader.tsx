"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

/**
 * The editorial masthead each page opens with: a small eyebrow, a large soft
 * serif line, and an optional aside that sits on the baseline of the title.
 */
export function PageHeader({
  eyebrow,
  title,
  lede,
  aside,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lede?: string;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("pb-10 pt-8 sm:pt-12", className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div className="min-w-0">
          {eyebrow ? (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.24em] text-rose-ink"
            >
              {eyebrow}
            </motion.p>
          ) : null}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[clamp(2.1rem,1.4rem+2.6vw,3.4rem)] leading-[1.02] text-ink"
          >
            {title}
          </motion.h1>
          {lede ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-3 max-w-[46ch] text-[14.5px] leading-relaxed text-ink-soft"
            >
              {lede}
            </motion.p>
          ) : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
    </header>
  );
}

/** A titled band of content. Hairline above, plenty of air, no card. */
export function Section({
  title,
  action,
  children,
  className,
  quiet = false,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  quiet?: boolean;
}) {
  return (
    <section className={cn(quiet ? "" : "border-t border-[var(--hairline)] pt-6", className)}>
      {title ? (
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-[10.5px] font-medium uppercase tracking-[0.2em] text-ink-faint">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Soft raised surface — used sparingly, where content genuinely needs lifting. */
export function Surface({
  children,
  className,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--surface-veil)] backdrop-blur-[10px]",
        padded && "p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
