"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

/**
 * A bud that opens when ticked: the ring contracts, a soft rose fills in and the
 * check draws itself. Deliberately not a square with a tick in it.
 */
export function Checkbox({
  checked,
  onChange,
  label,
  size = 22,
  className,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  size?: number;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn("group relative grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full"
        initial={false}
        animate={{
          backgroundColor: checked ? "#fb6f92" : "rgba(0,0,0,0)",
          borderColor: checked ? "#fb6f92" : "var(--hairline-strong)",
          scale: checked ? 1 : 0.92,
        }}
        whileHover={{ borderColor: "#ff8fab", scale: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 26 }}
        style={{ borderWidth: 1.5, borderStyle: "solid" }}
      />
      <motion.svg
        aria-hidden
        viewBox="0 0 24 24"
        className="relative"
        style={{ width: size * 0.58, height: size * 0.58 }}
        initial={false}
        animate={{ opacity: checked ? 1 : 0, scale: checked ? 1 : 0.5 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.path
          d="M5 12.6 10 17.4 19 7"
          fill="none"
          stroke="#33161f"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.svg>
    </button>
  );
}
