"use client";

import { useEffect } from "react";
import { CelebrationProvider } from "@/components/ui/Celebration";
import { ToastProvider } from "@/components/ui/Toaster";
import { PlannerProvider, useSettings } from "@/lib/store/provider";

/** Mirrors preferences onto <html> so CSS (and the boot script) can read them. */
function PreferenceSync() {
  const settings = useSettings();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    localStorage.setItem("peony.theme", settings.theme);

    if (settings.calmMotion) {
      root.dataset.motion = "calm";
      localStorage.setItem("peony.motion", "calm");
    } else {
      delete root.dataset.motion;
      localStorage.removeItem("peony.motion");
    }
  }, [settings.theme, settings.calmMotion]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PlannerProvider>
      <ToastProvider>
        <CelebrationProvider>
          <PreferenceSync />
          {children}
        </CelebrationProvider>
      </ToastProvider>
    </PlannerProvider>
  );
}
