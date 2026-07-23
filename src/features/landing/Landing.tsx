"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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

/**
 * The front door. One idea, one action.
 *
 * The video is allowed to be a little more present here than inside the app —
 * this is the only screen with nothing to read carefully.
 */
export function Landing() {
  const [now, setNow] = useState("");
  const quote = quoteOfDay();

  useEffect(() => {
    setNow(format(new Date(), "EEEE, d MMMM"));
  }, []);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
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
            <motion.span custom={2} variants={rise} initial="hidden" animate="show" className="block pl-[0.06em]">
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
            Days, weeks and months in one unhurried place. Write it down, tick it off, and let the rest wait
            until tomorrow.
          </motion.p>

          <motion.div
            custom={4}
            variants={rise}
            initial="hidden"
            animate="show"
            className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-5"
          >
            <Link
              href="/home"
              className="group inline-flex h-[52px] items-center gap-3 rounded-full bg-blush-600 pl-7 pr-6 text-[15px] font-medium text-[#33161f] shadow-[0_18px_40px_-18px_rgba(251,111,146,0.95)] transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[#f9557f] active:translate-y-0"
            >
              Start planning
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/18 transition-transform duration-300 group-hover:translate-x-0.5">
                <ArrowRight size={15} strokeWidth={2} />
              </span>
            </Link>
            <p className="text-[12.5px] leading-relaxed text-ink-faint">
              No account, no sign-up.
              <br />
              Everything stays on this device.
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
    </div>
  );
}

/** Landing keeps its own backdrop: less blur, a touch more presence. */
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
