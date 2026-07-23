"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "soft" | "outline" | "quiet";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  // Ink on rose, not white on rose: white would sit at 2.6:1 against #FB6F92.
  primary:
    "bg-blush-600 text-[#33161f] shadow-[0_10px_24px_-12px_rgba(251,111,146,0.9)] hover:bg-[#f9557f]",
  soft: "bg-blush-50 text-[#8a3f5a] hover:bg-blush-100 dark:bg-blush-600/15 dark:text-blush-200",
  outline: "border border-[var(--hairline-strong)] text-ink hover:border-blush-400 hover:text-rose-ink",
  quiet: "text-ink-soft hover:text-ink hover:bg-[color-mix(in_oklab,var(--paper-deep),transparent_25%)]",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-[var(--radius-sm)] gap-1.5",
  md: "h-10 px-4 text-sm rounded-[var(--radius-md)] gap-2",
  lg: "h-12 px-6 text-[15px] rounded-[var(--radius-lg)] gap-2.5",
};

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.975, y: 0 }}
      transition={{ type: "spring", stiffness: 520, damping: 32 }}
      className={cn(
        "inline-flex select-none items-center justify-center font-medium",
        "transition-colors duration-200 disabled:pointer-events-none disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
});

/** Square, borderless, for toolbars and row affordances. */
export const IconButton = forwardRef<HTMLButtonElement, ButtonProps & { label: string }>(
  function IconButton({ className, label, ...props }, ref) {
    return (
      <Button
        ref={ref}
        aria-label={label}
        title={label}
        variant="quiet"
        className={cn("h-8 w-8 shrink-0 rounded-full p-0", className)}
        {...props}
      />
    );
  },
);
