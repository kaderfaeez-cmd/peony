"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Grain } from "@/components/atmosphere/Atmosphere";
import { cn } from "@/lib/cn";
import { useActions, useHydrated, useSettings } from "@/lib/store/provider";

/** How long the cover takes to swing open before the planner takes over. */
const OPEN_MS = 1150;

/** "Faeez" → "Faeez's". Names already ending in s keep the apostrophe-s. */
const possessive = (name: string) => `${name.trim()}’s`;

/**
 * The cover of the book, and nothing else: the name, what it is, and whose it is.
 *
 * Tapping it hinges the board open on its left edge, revealing the first page,
 * and the planner loads behind. Anyone on reduced motion skips straight through.
 */
export function Landing() {
  const router = useRouter();
  const actions = useActions();
  const settings = useSettings();
  const hydrated = useHydrated();

  const [opening, setOpening] = useState(false);
  const [lifted, setLifted] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [hintVisible, setHintVisible] = useState(false);

  const named = settings.name.trim().length > 0;

  useEffect(() => {
    router.prefetch("/home");
  }, [router]);

  useEffect(() => {
    if (!hydrated || !named) return;
    const timer = setTimeout(() => setHintVisible(true), 1800);
    return () => clearTimeout(timer);
  }, [hydrated, named]);

  const open = useCallback(() => {
    if (opening || !named) return;

    const calm =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motion === "calm";

    if (calm) {
      router.push("/home");
      return;
    }

    setOpening(true);
    window.setTimeout(() => router.push("/home"), OPEN_MS - 180);
  }, [opening, named, router]);

  return (
    <div
      className="relative h-dvh overflow-hidden bg-[var(--paper)]"
      style={{ perspective: "2400px", perspectiveOrigin: "0% 50%" }}
    >
      <FirstPage opening={opening} />

      <motion.div
        onClick={open}
        initial={false}
        // Stops just short of 90° so the mirrored back of the board never shows.
        animate={{ rotateY: opening ? -88 : lifted ? -2.5 : 0 }}
        transition={
          opening
            ? { duration: OPEN_MS / 1000, ease: [0.34, 0, 0.12, 1] }
            : { type: "spring", stiffness: 120, damping: 20 }
        }
        style={{
          transformOrigin: "left center",
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
        }}
        className={cn(
          "relative flex h-dvh flex-col overflow-hidden will-change-transform",
          named ? "cursor-pointer" : "cursor-default",
        )}
      >
        <Backdrop />

        <div className="relative z-10 flex h-full flex-col justify-center px-[var(--space-gutter)]">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="text-[11px] font-medium uppercase tracking-[0.34em] text-rose-ink"
          >
            A quiet planner
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 font-display text-[clamp(3.4rem,1.6rem+9vw,9rem)] leading-[0.9] tracking-[-0.035em] text-ink"
          >
            Peony
          </motion.h1>

          <motion.span
            aria-hidden
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 block h-px w-[clamp(88px,14vw,180px)] origin-left bg-[var(--hairline-strong)]"
          />

          <div className="mt-7 min-h-[52px]">
            <AnimatePresence mode="wait">
              {!hydrated ? null : named ? (
                <motion.p
                  key="named"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="font-display text-[clamp(1.1rem,0.95rem+0.8vw,1.6rem)] text-ink-soft"
                >
                  {possessive(settings.name)} planner
                </motion.p>
              ) : (
                <motion.form
                  key="naming"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  onClick={(event) => event.stopPropagation()}
                  onSubmit={(event) => {
                    event.preventDefault();
                    const value = draftName.trim();
                    if (!value) return;
                    actions.updateSettings({ name: value });
                  }}
                  className="flex max-w-[320px] items-end gap-3"
                >
                  <label className="flex-1">
                    <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-ink-faint">
                      Whose planner is this?
                    </span>
                    <input
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      placeholder="Your name"
                      autoComplete="given-name"
                      className="w-full border-b border-[var(--hairline-strong)] bg-transparent pb-1.5 font-display text-[20px] text-ink placeholder:text-ink-faint/60 focus:border-blush-400 focus:outline-none"
                    />
                  </label>
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.94 }}
                    aria-label="Save name"
                    className="mb-1 grid h-9 w-9 place-items-center rounded-full bg-blush-600 text-[#33161f] transition-colors hover:bg-[#f9557f]"
                  >
                    <ArrowRight size={15} strokeWidth={2} />
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* The only instruction on the cover, and it waits before it appears. */}
        <motion.p
          initial={false}
          animate={{ opacity: hintVisible && !opening ? 1 : 0 }}
          transition={{ duration: 1.2 }}
          className="absolute bottom-9 left-[var(--space-gutter)] z-10 text-[11px] uppercase tracking-[0.24em] text-ink-faint"
        >
          Tap to open
        </motion.p>

        {/* Board edge and gutter shadow — the cues that say "this is a cover". */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-20 w-[10px] bg-[linear-gradient(90deg,rgba(59,42,49,0.16),rgba(59,42,49,0.04)_45%,transparent)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-20 w-[3px] bg-[linear-gradient(90deg,transparent,rgba(59,42,49,0.1))]"
        />

        {/* Light leaves the cover as it turns away from the room. */}
        <motion.span
          aria-hidden
          initial={false}
          animate={{ opacity: opening ? 0.34 : 0 }}
          transition={{ duration: OPEN_MS / 1000, ease: "easeIn" }}
          className="pointer-events-none absolute inset-0 z-30 bg-[linear-gradient(90deg,#2a1a20,rgba(42,26,32,0.35))]"
        />
      </motion.div>

      {/* Keyboard route in: the cover itself is a surface, not a control. */}
      {named ? (
        <button
          onClick={open}
          onFocus={() => setLifted(true)}
          onBlur={() => setLifted(false)}
          className="sr-only focus:not-sr-only focus:absolute focus:bottom-8 focus:right-8 focus:z-40 focus:rounded-full focus:bg-blush-600 focus:px-5 focus:py-2.5 focus:text-[13px] focus:text-[#33161f]"
        >
          Open the planner
        </button>
      ) : null}
    </div>
  );
}

/**
 * What is underneath the cover: paper, a gutter shadow along the spine, and the
 * mark — the app itself then loads over the top of it.
 */
function FirstPage({ opening }: { opening: boolean }) {
  return (
    <div aria-hidden className="absolute inset-0 bg-[var(--paper)]">
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_10%_0%,rgba(255,229,236,0.55),transparent_60%)] dark:bg-[radial-gradient(120%_90%_at_10%_0%,rgba(251,111,146,0.12),transparent_60%)]" />
      <div className="absolute inset-y-0 left-0 w-[46px] bg-[linear-gradient(90deg,rgba(59,42,49,0.13),transparent)]" />
      <Grain />

      <motion.div
        initial={false}
        animate={{ opacity: opening ? 1 : 0, y: opening ? 0 : 8 }}
        transition={{ duration: 0.7, delay: opening ? 0.42 : 0, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 grid place-items-center"
      >
        <div className="flex flex-col items-center gap-3">
          <span className="font-display text-[28px] text-ink">Peony</span>
          <span className="h-1.5 w-1.5 rounded-full bg-blush-600" />
        </div>
      </motion.div>
    </div>
  );
}

/** The cover's own backdrop: the peonies, at full clarity. */
function Backdrop() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-[-2%] bg-[url('/media/atmosphere-poster.webp')] bg-cover bg-center"
        style={{ animation: "peony-drift 40s ease-in-out infinite" }}
      />
      {ready ? (
        <video
          className="absolute inset-[-2%] h-[104%] w-[104%] object-cover opacity-0 transition-opacity duration-[2000ms] data-[ready=true]:opacity-100"
          src="/media/atmosphere.mp4"
          poster="/media/atmosphere-poster.webp"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          onCanPlay={(event) => {
            event.currentTarget.dataset.ready = "true";
          }}
        />
      ) : null}
      <div className="absolute inset-0 bg-[var(--paper)]/[0.1] dark:bg-[var(--paper)]/[0.3]" />
      <div className="atmosphere-wash absolute inset-0" />
      <Grain />
    </div>
  );
}
