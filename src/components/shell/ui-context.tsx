"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { TaskDraft } from "@/types";

interface ShellUI {
  quickAdd: { open: boolean; draft: TaskDraft | null };
  openQuickAdd: (draft?: TaskDraft) => void;
  closeQuickAdd: () => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
}

const ShellUIContext = createContext<ShellUI | null>(null);

export function ShellUIProvider({ children }: { children: React.ReactNode }) {
  const [quickAdd, setQuickAdd] = useState<{ open: boolean; draft: TaskDraft | null }>({
    open: false,
    draft: null,
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const openQuickAdd = useCallback((draft?: TaskDraft) => {
    setQuickAdd({ open: true, draft: draft ?? null });
  }, []);
  const closeQuickAdd = useCallback(() => setQuickAdd({ open: false, draft: null }), []);

  const value = useMemo(
    () => ({ quickAdd, openQuickAdd, closeQuickAdd, searchOpen, setSearchOpen, navOpen, setNavOpen }),
    [quickAdd, openQuickAdd, closeQuickAdd, searchOpen, navOpen],
  );

  return <ShellUIContext.Provider value={value}>{children}</ShellUIContext.Provider>;
}

export function useShellUI() {
  const context = useContext(ShellUIContext);
  if (!context) throw new Error("useShellUI must be used inside <ShellUIProvider>");
  return context;
}
