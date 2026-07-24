"use client";

import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSupabase, isSyncConfigured } from "@/lib/supabase/client";

type AuthStatus = "unavailable" | "loading" | "signed-out" | "signed-in";

interface AuthValue {
  status: AuthStatus;
  user: User | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  sendReset: (email: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Supabase phrases some errors for developers; these are for her. */
function readableError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login")) return "That email and password don't match.";
  if (lower.includes("already registered")) return "There's already an account with that email.";
  if (lower.includes("email not confirmed")) return "Check your email to confirm the account first.";
  if (lower.includes("rate limit") || lower.includes("too many"))
    return "Too many tries. Give it a minute.";
  if (lower.includes("password")) return "That password is too short — use at least 8 characters.";
  if (lower.includes("failed to fetch")) return "Can't reach the server. Check your connection.";
  return message;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(isSyncConfigured ? "loading" : "unavailable");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setStatus(data.session ? "signed-in" : "signed-out");
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setStatus(next ? "signed-in" : "signed-out");
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return "Sync isn't configured for this copy of Peony.";
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error ? readableError(error.message) : null;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return "Sync isn't configured for this copy of Peony.";
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/settings` },
    });
    return error ? readableError(error.message) : null;
  }, []);

  const signOut = useCallback(async () => {
    await getSupabase()?.auth.signOut();
  }, []);

  const sendReset = useCallback(async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) return "Sync isn't configured for this copy of Peony.";
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/settings`,
    });
    return error ? readableError(error.message) : null;
  }, []);

  const value = useMemo(
    () => ({ status, user: session?.user ?? null, signIn, signUp, signOut, sendReset }),
    [status, session, signIn, signUp, signOut, sendReset],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
