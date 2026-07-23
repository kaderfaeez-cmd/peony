"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { Sprig } from "./Sprig";

export function EmptyState({
  title,
  body,
  action,
  variant = "stem",
  compact = false,
  className,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
  variant?: "stem" | "bud" | "leaf";
  compact?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex flex-col items-center text-center", compact ? "py-8" : "py-16", className)}
    >
      <Sprig variant={variant} size={compact ? 56 : 88} />
      <p className={cn("font-display text-ink", compact ? "mt-2 text-[17px]" : "mt-4 text-[22px]")}>
        {title}
      </p>
      {body ? (
        <p className="mt-1.5 max-w-[34ch] text-[13px] leading-relaxed text-ink-soft">{body}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </motion.div>
  );
}
