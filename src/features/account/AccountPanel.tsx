"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CloudOff, RefreshCw, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { FieldRow, Input, Label } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toaster";
import { useAuth } from "@/lib/auth/AuthProvider";
import { formatDistanceToNow } from "date-fns";
import { useSyncStatus } from "@/lib/store/sync";

const credentials = z.object({
  email: z.string().trim().email("That doesn't look like an email"),
  // Supabase enforces its own minimum; this is the friendlier front door.
  password: z.string().min(8, "At least 8 characters"),
});

type Credentials = z.infer<typeof credentials>;

function SyncBadge() {
  const { status, lastSyncedAt, error, syncNow } = useSyncStatus();

  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div className="flex items-center gap-3">
        <span
          className={
            status === "error"
              ? "text-rose-ink"
              : status === "syncing"
                ? "text-blush-400"
                : "text-ink-faint"
          }
        >
          {status === "error" ? (
            <TriangleAlert size={15} strokeWidth={1.7} />
          ) : status === "syncing" ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
              className="block"
            >
              <RefreshCw size={15} strokeWidth={1.7} />
            </motion.span>
          ) : (
            <Check size={15} strokeWidth={1.7} />
          )}
        </span>
        <div>
          <p className="text-[13.5px] text-ink">
            {status === "error" ? "Sync had a problem" : status === "syncing" ? "Syncing…" : "Up to date"}
          </p>
          <p className="text-[12px] text-ink-soft">
            {error
              ? error
              : lastSyncedAt
                ? `Last synced ${formatDistanceToNow(new Date(lastSyncedAt))} ago`
                : "Waiting for the first sync"}
          </p>
        </div>
      </div>
      <Button size="sm" variant="quiet" onClick={syncNow}>
        Sync now
      </Button>
    </div>
  );
}

function CredentialsForm({ mode }: { mode: "in" | "up" }) {
  const { signIn, signUp, sendReset } = useAuth();
  const { notify } = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Credentials>({ resolver: zodResolver(credentials) });

  const submit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    const failure = mode === "in" ? await signIn(email, password) : await signUp(email, password);

    if (failure) {
      setFormError(failure);
      return;
    }
    notify(mode === "in" ? "Signed in — syncing your planner" : "Check your email to confirm the account");
  });

  return (
    <form onSubmit={submit} className="max-w-[360px] space-y-6">
      <FieldRow>
        <Label htmlFor="account-email">Email</Label>
        <Input
          id="account-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register("email")}
        />
        {errors.email ? <p className="text-[12px] text-rose-ink">{errors.email.message}</p> : null}
      </FieldRow>

      <FieldRow>
        <Label htmlFor="account-password">Password</Label>
        <Input
          id="account-password"
          type="password"
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          placeholder="At least 8 characters"
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-[12px] text-rose-ink">{errors.password.message}</p>
        ) : null}
      </FieldRow>

      {formError ? <p className="text-[12.5px] text-rose-ink">{formError}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {mode === "in" ? "Sign in" : "Create account"}
        </Button>
        {mode === "in" ? (
          <button
            type="button"
            onClick={async () => {
              const email = getValues("email");
              if (!email) {
                setFormError("Enter your email first, then tap this again.");
                return;
              }
              const failure = await sendReset(email);
              notify(failure ?? "Password reset sent — check your email");
            }}
            className="text-[12.5px] text-ink-faint transition-colors hover:text-rose-ink"
          >
            Forgot password
          </button>
        ) : null}
      </div>
    </form>
  );
}

/**
 * Sync is opt-in: the planner works fully without an account, and signing in
 * simply mirrors it. Nothing here blocks the app.
 */
export function AccountPanel() {
  const { status, user, signOut } = useAuth();
  const { notify } = useToast();
  const [mode, setMode] = useState<"in" | "up">("in");

  if (status === "unavailable") {
    return (
      <div className="flex items-start gap-3">
        <CloudOff size={16} strokeWidth={1.6} className="mt-0.5 text-ink-faint" />
        <p className="max-w-[52ch] text-[13.5px] leading-relaxed text-ink-soft">
          Sync isn&apos;t switched on for this copy. Everything still works and stays on this device —
          add the Supabase keys to turn on syncing across phone and laptop.
        </p>
      </div>
    );
  }

  if (status === "loading") {
    return <p className="text-[13.5px] text-ink-soft">Checking…</p>;
  }

  if (status === "signed-in" && user) {
    return (
      <div>
        <p className="text-[13.5px] text-ink">
          Signed in as <span className="text-rose-ink">{user.email}</span>
        </p>
        <p className="mt-1 max-w-[52ch] text-[12.5px] leading-relaxed text-ink-soft">
          Your planner is mirrored to your account. Open Peony on another device, sign in, and both
          copies merge — nothing overwrites anything.
        </p>

        <div className="mt-2 divide-y divide-[var(--hairline)]">
          <SyncBadge />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={async () => {
            await signOut();
            notify("Signed out — your planner stays on this device");
          }}
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-6 max-w-[52ch] text-[13.5px] leading-relaxed text-ink-soft">
        Make an account to keep the same planner on your phone and your laptop. Everything keeps
        working offline; syncing just catches both copies up when you&apos;re back online.
      </p>

      <div className="mb-6 flex items-center gap-1">
        {(["in", "up"] as const).map((option) => (
          <button
            key={option}
            onClick={() => setMode(option)}
            className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
              mode === option
                ? "bg-blush-50 text-rose-ink dark:bg-blush-600/20"
                : "text-ink-faint hover:text-ink-soft"
            }`}
          >
            {option === "in" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <CredentialsForm mode={mode} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
