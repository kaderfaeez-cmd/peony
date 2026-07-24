"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getSupabase, PLANNER_TABLE } from "@/lib/supabase/client";
import type { PlannerState } from "@/types";
import { mergeStates } from "./merge";
import { usePlanner } from "./provider";
import { migrate } from "./repository";

type SyncStatus = "off" | "idle" | "syncing" | "error";

interface SyncValue {
  status: SyncStatus;
  lastSyncedAt: string | null;
  error: string | null;
  syncNow: () => void;
}

const SyncContext = createContext<SyncValue>({
  status: "off",
  lastSyncedAt: null,
  error: null,
  syncNow: () => {},
});

/** Push a beat after typing stops; pull when the window comes back to life. */
const PUSH_DELAY = 1500;
const PULL_INTERVAL = 90_000;

/**
 * Keeps the on-device planner and the row in Postgres in step.
 *
 * The device stays the source of truth: everything is written to localStorage
 * first and works offline, and this only mirrors it. The first thing a new
 * session does is *pull* — never push — so signing in on a fresh phone can't
 * overwrite a year of planning with an empty seed.
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { status: authStatus, user } = useAuth();
  const { state, actions, hydrated } = usePlanner();

  const [status, setStatus] = useState<SyncStatus>("off");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stateRef = useRef<PlannerState>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  /** Set once the first pull has landed; until then, pushing is unsafe. */
  const primed = useRef(false);
  const inFlight = useRef(false);

  const write = useCallback(
    async (next: PlannerState) => {
      const supabase = getSupabase();
      if (!supabase || !user) return;

      const { error: writeError } = await supabase.from(PLANNER_TABLE).upsert(
        {
          user_id: user.id,
          state: next,
          revision: next.revision ?? 0,
          updated_at: next.updatedAt ?? new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      if (writeError) throw writeError;
    },
    [user],
  );

  const sync = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !user || inFlight.current) return;

    inFlight.current = true;
    setStatus("syncing");
    setError(null);

    try {
      const { data, error: readError } = await supabase
        .from(PLANNER_TABLE)
        .select("state")
        .eq("user_id", user.id)
        .maybeSingle();

      if (readError) throw readError;

      if (!data) {
        // First device on this account: seed the row from what is already here.
        await write(stateRef.current);
      } else {
        const remote = migrate(data.state);
        const merged = remote ? mergeStates(stateRef.current, remote) : stateRef.current;
        if (remote) actions.replaceAll(merged);
        await write(merged);
      }

      primed.current = true;
      setLastSyncedAt(new Date().toISOString());
      setStatus("idle");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sync failed");
      setStatus("error");
    } finally {
      inFlight.current = false;
    }
  }, [user, actions, write]);

  // Sign in (or out) — pull first, and clear the primed flag when signing out.
  useEffect(() => {
    if (authStatus !== "signed-in" || !user || !hydrated) {
      primed.current = false;
      setStatus(authStatus === "signed-in" ? "syncing" : "off");
      return;
    }
    void sync();
  }, [authStatus, user, hydrated, sync]);

  // Local edits: push, once the first pull has landed.
  useEffect(() => {
    if (authStatus !== "signed-in" || !primed.current) return;

    const timer = setTimeout(() => {
      setStatus("syncing");
      write(stateRef.current)
        .then(() => {
          setLastSyncedAt(new Date().toISOString());
          setStatus("idle");
        })
        .catch((caught: unknown) => {
          setError(caught instanceof Error ? caught.message : "Sync failed");
          setStatus("error");
        });
    }, PUSH_DELAY);

    return () => clearTimeout(timer);
  }, [state.revision, authStatus, write]);

  // Coming back to the tab is the moment another device's changes matter.
  useEffect(() => {
    if (authStatus !== "signed-in") return;

    const onWake = () => {
      if (document.visibilityState === "visible") void sync();
    };

    window.addEventListener("focus", onWake);
    document.addEventListener("visibilitychange", onWake);
    const timer = setInterval(onWake, PULL_INTERVAL);

    return () => {
      window.removeEventListener("focus", onWake);
      document.removeEventListener("visibilitychange", onWake);
      clearInterval(timer);
    };
  }, [authStatus, sync]);

  const value = useMemo(
    () => ({ status, lastSyncedAt, error, syncNow: () => void sync() }),
    [status, lastSyncedAt, error, sync],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSyncStatus() {
  return useContext(SyncContext);
}
