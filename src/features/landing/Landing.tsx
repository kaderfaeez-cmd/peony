"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Grain } from "@/components/atmosphere/Atmosphere";
import { quoteOfDay } from "@/lib/quotes";

const rise = {
  hidden: { opacity: 0, y: 18 },
  show: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay: 0.16 * index, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/** How long the cover takes to swing open before the planner takes over. */
const OPEN_MS = 1150;

/**
 * The front door — a closed cover you tap to open.
 *
 * The whole page is the front board of a book: it hinges on the left edge and
 * swings away to reveal the first page underneath, and only then does the app
 * take over. Anyone on reduced motion skips straight through.
 */
export function Landing() {
  const router = useRouter();
  const [now, setNow] = useState("");
  const [opening, setOpening] = useState(false);
  const [lifted, setLifted] = useState(false);
  const quote = quoteOfDay();

  useEffect(() => {
    setNow(format(new Date(), "EEEE, d MMMM"));
    router.prefetch("/home");
  }, [router]);

  const open = useCallback(() => {
    if (opening) return;

    const calm =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motion === "calm";

    if (calm) {
      router.push("/home");
      return;
    }

    setOpening(true);
    window.setTimeout(() => router.push("/home"), OPEN_MS - 180);
  }, [opening, router]);

  return (
    <div
      className="relative h-dvh overflow-hidden bg-[var(--paper)]"
      style={{ perspective: "2400px", perspectiveOrigin: "0% 50%" }}
    >
      <FirstPage opening={opening} />

      {/* The cover. Hinged on the left, tappable anywhere. */}
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
        className="relative flex h-dvh cursor-pointer flex-col overflow-hidden will-change-transform"
      >
        <Backdrop />

        <header className="relative z-10 flex items-center justify-between px-[var(--space-gutter)] py-8">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-[22px] text-ink">Peony</span>
            <span className="mb-0.5 h-1.5 w-1.5 rounded-full bg-blush-600" />
          </div>
          <p className="hidden text-[12.5px] tracking-wide text-ink-soft sm:block">{now}</p>
        </header>

        <main className="relative z-10 flex flex-1 items-center px-[var(--space-gutter)]">
          <div className="w-full max-w-[62rem] pb-24">
            <motion.p
              custom={0}
              variants={rise}
              initial="hidden"
              animate="show"
              className="text-[11px] font-medium uppercase tracking-[0.3em] text-rose-ink"
            >
              A quiet planner
            </motion.p>

            <h1 className="mt-7 font-display text-[clamp(2.9rem,1.4rem+7vw,7.2rem)] leading-[0.94] tracking-[-0.03em] text-ink">
              <motion.span custom={1} variants={rise} initial="hidden" animate="show" className="block">
                Take the day
              </motion.span>
              <motion.span
                custom={2}
                variants={rise}
                initial="hidden"
                animate="show"
                className="block pl-[0.06em]"
              >
                <span className="text-rose-ink">gently</span>.
              </motion.span>
            </h1>

            <motion.p
              custom={3}
              variants={rise}
              initial="hidden"
              animate="show"
              className="mt-9 max-w-[38ch] text-[clamp(1rem,0.95rem+0.3vw,1.15rem)] leading-relaxed text-ink-soft"
            >
              Days, weeks and months in one unhurried place. Write it down, tick it off, and let the rest
              wait until tomorrow.
            </motion.p>

            <motion.div
              custom={4}
              variants={rise}
              initial="hidden"
              animate="show"
              className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-5"
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  open();
                }}
                onMouseEnter={() => setLifted(true)}
                onMouseLeave={() => setLifted(false)}
                onFocus={() => setLifted(true)}
                onBlur={() => setLifted(false)}
                className="group inline-flex h-[52px] items-center gap-3 rounded-full bg-blush-600 pl-7 pr-6 text-[15px] font-medium text-[#33161f] shadow-[0_18px_40px_-18px_rgba(251,111,146,0.95)] transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[#f9557f] active:translate-y-0"
              >
                Open the planner
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#33161f]/12 transition-transform duration-300 group-hover:translate-x-0.5">
                  <ArrowRight size={15} strokeWidth={2} />
                </span>
              </button>
              <p className="text-[12.5px] leading-relaxed text-ink-faint">
                Tap anywhere to open it.
                <br />
                No account — everything stays on this device.
              </p>
            </motion.div>
          </div>
        </main>

        <motion.footer
          custom={5}
          variants={rise}
          initial="hidden"
          animate="show"
          className="relative z-10 flex items-end justify-between gap-8 border-t border-[var(--hairline)] px-[var(--space-gutter)] py-7"
        >
          <p className="max-w-[46ch] text-[13px] leading-relaxed text-ink-soft">
            <span className="font-display text-[15px] text-ink">“{quote.line}”</span>
            <span className="mt-1 block text-[11.5px] uppercase tracking-[0.16em] text-ink-faint">
              {quote.source}
            </span>
          </p>
          <p className="hidden shrink-0 text-[11.5px] uppercase tracking-[0.18em] text-ink-faint sm:block">
            Made slowly
          </p>
        </motion.footer>

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

/** Landing keeps its own backdrop: the video, at full clarity. */
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
