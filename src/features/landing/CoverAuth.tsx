"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useToast } from "@/components/ui/Toaster";

/**
 * Sign in / create account, styled as part of the cover rather than a form.
 *
 * It never blocks: "just on this device" walks straight into the planner and
 * keeps everything local, because the app was offline-first before it had
 * accounts and still is.
 */
export function CoverAuth({ onSkip }: { onSkip: () => void }) {
  const { signIn, signUp } = useAuth();
  const { notify } = useToast();

  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!/.+@.+\..+/.test(email.trim())) {
      setError("That doesn't look like an email");
      return;
    }
    if (password.length < 8) {
      setError("Password needs at least 8 characters");
      return;
    }

    setBusy(true);
    const failure = mode === "in" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);

    if (failure) {
      setError(failure);
      return;
    }
    // On success the auth state flips and the cover moves on by itself.
    if (mode === "up") notify("Account made — your planner will sync from now on");
  };

  return (
    <motion.div
      key="auth"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onClick={(event) => event.stopPropagation()}
      className="max-w-[360px]"
    >
      <div className="mb-5 flex items-center gap-1">
        {(["in", "up"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setMode(option);
              setError(null);
            }}
            className={`rounded-full px-3 py-1.5 text-[12.5px] transition-colors ${
              mode === option
                ? "bg-[color-mix(in_oklab,var(--color-blush-50),transparent_10%)] text-rose-ink dark:bg-blush-600/25"
                : "text-ink-faint hover:text-ink-soft"
            }`}
          >
            {option === "in" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-[10.5px] uppercase tracking-[0.18em] text-ink-faint">
            Email
          </span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full border-b border-[var(--hairline-strong)] bg-transparent pb-1.5 text-[16px] text-ink placeholder:text-ink-faint/60 focus:border-blush-400 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[10.5px] uppercase tracking-[0.18em] text-ink-faint">
            Password
          </span>
          <input
            type="password"
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            className="w-full border-b border-[var(--hairline-strong)] bg-transparent pb-1.5 text-[16px] text-ink placeholder:text-ink-faint/60 focus:border-blush-400 focus:outline-none"
          />
        </label>

        {error ? <p className="text-[12.5px] text-rose-ink">{error}</p> : null}

        <div className="flex items-center gap-4 pt-1">
          <motion.button
            type="submit"
            disabled={busy}
            whileTap={{ scale: 0.97 }}
            className="inline-flex h-[46px] items-center gap-2.5 rounded-full bg-blush-600 pl-6 pr-5 text-[14px] font-medium text-[#33161f] transition-colors hover:bg-[#f9557f] disabled:opacity-60"
          >
            {busy ? "One moment…" : mode === "in" ? "Sign in" : "Create account"}
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#33161f]/12">
              <ArrowRight size={13} strokeWidth={2} />
            </span>
          </motion.button>
        </div>
      </form>

      <button
        type="button"
        onClick={onSkip}
        className="mt-6 text-[12px] text-ink-faint underline decoration-[var(--hairline-strong)] underline-offset-4 transition-colors hover:text-ink-soft"
      >
        Just use it on this device
      </button>
    </motion.div>
  );
}
