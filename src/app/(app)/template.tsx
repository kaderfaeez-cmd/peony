"use client";

import { motion } from "framer-motion";

/**
 * `template.tsx` remounts on every navigation, which is exactly what a page
 * transition needs — a short rise and fade, never a slide-in carnival.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
