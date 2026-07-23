"use client";

import { Atmosphere } from "@/components/atmosphere/Atmosphere";
import { CommandPalette } from "@/components/search/CommandPalette";
import { QuickAddSheet } from "@/features/tasks/TaskDetailSheet";
import { useReminders } from "@/hooks/useReminders";
import { useSettings } from "@/lib/store/provider";
import { NavDrawer, NavRail } from "./NavRail";
import { Shortcuts } from "./Shortcuts";
import { TopBar } from "./TopBar";
import { ShellUIProvider, useShellUI } from "./ui-context";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { quickAdd, closeQuickAdd, searchOpen, setSearchOpen } = useShellUI();
  const settings = useSettings();
  useReminders();

  return (
    <>
      <Atmosphere enabled={settings.atmosphere} />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-blush-600 focus:px-4 focus:py-2 focus:text-[13px] focus:text-[#33161f]"
      >
        Skip to content
      </a>

      <div className="flex min-h-dvh">
        <NavRail />
        <NavDrawer />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main id="main" className="flex-1 px-[var(--space-gutter)] pb-28 pt-1">
            {children}
          </main>
        </div>
      </div>

      <QuickAddSheet open={quickAdd.open} draft={quickAdd.draft} onClose={closeQuickAdd} />
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Shortcuts />
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ShellUIProvider>
      <ShellInner>{children}</ShellInner>
    </ShellUIProvider>
  );
}
