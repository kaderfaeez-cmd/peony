"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createId } from "@/lib/id";

interface Toast {
  id: string;
  message: string;
  action?: { label: string; run: () => void };
}

const ToastContext = createContext<{
  notify: (message: string, action?: Toast["action"]) => void;
} | null>(null);

const LIFETIME = 6000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, action?: Toast["action"]) => {
      const id = createId("toast");
      setToasts((current) => [...current.slice(-2), { id, message, action }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), LIFETIME),
      );
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-start sm:p-6"
        role="status"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              className="pointer-events-auto flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--surface)] py-2.5 pl-5 pr-2.5 shadow-[var(--shadow-lift)]"
            >
              <span className="text-[13px] text-ink">{toast.message}</span>
              {toast.action ? (
                <button
                  onClick={() => {
                    toast.action?.run();
                    dismiss(toast.id);
                  }}
                  className="rounded-full px-3 py-1 text-[13px] font-medium text-rose-ink transition-colors hover:bg-blush-50 dark:hover:bg-blush-600/15"
                >
                  {toast.action.label}
                </button>
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
