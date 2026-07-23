"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Minimize2, Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, Section } from "@/components/layout/PageHeader";
import { Button, IconButton } from "@/components/ui/Button";
import { useCelebrate } from "@/components/ui/Celebration";
import { useToast } from "@/components/ui/Toaster";
import { cn } from "@/lib/cn";
import { todayKey } from "@/lib/date";
import { usePlannerSelector, useSettings } from "@/lib/store/provider";
import { tasksOn } from "@/lib/store/selectors";

type Phase = "focus" | "break";

const format = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

/** The whole timer, drawn once and reused by both the page and the focus overlay. */
function TimerDial({
  remaining,
  total,
  phase,
  size = 300,
}: {
  remaining: number;
  total: number;
  phase: Phase;
  size?: number;
}) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = total === 0 ? 0 : 1 - remaining / total;

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--hairline)" strokeWidth={3} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={phase === "focus" ? "#fb6f92" : "#ffb3c6"}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - ratio) }}
          transition={{ duration: 0.9, ease: "linear" }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="numeral leading-none text-ink" style={{ fontSize: size * 0.22 }}>
          {format(remaining)}
        </p>
        <p className="mt-3 text-[11px] uppercase tracking-[0.24em] text-ink-faint">
          {phase === "focus" ? "Focus" : "Breathe"}
        </p>
      </div>
    </div>
  );
}

export default function FocusPage() {
  const settings = useSettings();
  const tasks = usePlannerSelector((state) => state.tasks);
  const celebrate = useCelebrate();
  const { notify } = useToast();

  const [phase, setPhase] = useState<Phase>("focus");
  const [rounds, setRounds] = useState(0);
  const [immersive, setImmersive] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);

  /**
   * The timer is driven by a deadline rather than by counting down a number:
   * a throttled background tab can lose ticks, but it cannot lose a timestamp.
   * `left` is null whenever the clock is idle, so it always shows a full round.
   */
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [left, setLeft] = useState<number | null>(null);

  const total = (phase === "focus" ? settings.pomodoroFocus : settings.pomodoroBreak) * 60;
  const remaining = left ?? total;
  const running = endsAt !== null;

  const todays = useMemo(() => tasksOn(tasks, todayKey()).filter((task) => !task.done), [tasks]);
  const current = todays.find((task) => task.id === taskId) ?? null;

  const reset = useCallback((next?: Phase) => {
    setEndsAt(null);
    setLeft(null);
    if (next) setPhase(next);
  }, []);

  const finish = useCallback(() => {
    reset(phase === "focus" ? "break" : "focus");

    if (phase === "focus") {
      setRounds((count) => count + 1);
      celebrate(0.7);
      notify("Round done. Stand up, look out of a window.");
    } else {
      notify("Break over — one more round?");
    }

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(phase === "focus" ? "Focus round finished" : "Break finished", { silent: true });
    }
  }, [phase, celebrate, notify, reset]);

  useEffect(() => {
    if (endsAt === null) return;
    const tick = () => {
      const seconds = Math.round((endsAt - Date.now()) / 1000);
      if (seconds <= 0) {
        setLeft(0);
        finish();
        return;
      }
      setLeft(seconds);
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [endsAt, finish]);

  const toggleRunning = () => {
    if (running) {
      setEndsAt(null); // pause: `left` stays where it is
      return;
    }
    setEndsAt(Date.now() + remaining * 1000);
  };

  const controls = (
    <div className="flex items-center gap-3">
      <Button size="lg" onClick={toggleRunning} className="min-w-[132px]">
        {running ? <Pause size={16} strokeWidth={2} /> : <Play size={16} strokeWidth={2} />}
        {running ? "Pause" : remaining === total ? "Begin" : "Resume"}
      </Button>
      <IconButton label="Reset timer" onClick={() => reset()}>
        <RotateCcw size={16} strokeWidth={1.7} />
      </IconButton>
      <IconButton
        label={immersive ? "Leave focus mode" : "Enter focus mode"}
        onClick={() => setImmersive((value) => !value)}
      >
        {immersive ? <Minimize2 size={16} strokeWidth={1.7} /> : <Maximize2 size={16} strokeWidth={1.7} />}
      </IconButton>
    </div>
  );

  return (
    <div>
      <PageHeader
        eyebrow="One thing at a time"
        title="Focus"
        lede={`${settings.pomodoroFocus} minutes of attention, then ${settings.pomodoroBreak} minutes of nothing at all.`}
        aside={
          rounds > 0 ? (
            <p className="text-right">
              <span className="numeral block text-[34px] leading-none text-ink">{rounds}</span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-ink-faint">
                {rounds === 1 ? "round today" : "rounds today"}
              </span>
            </p>
          ) : null
        }
      />

      <div className="flex flex-col items-center gap-10 py-6">
        <TimerDial remaining={Math.max(0, remaining)} total={total} phase={phase} />
        {controls}
        {current ? (
          <p className="max-w-[40ch] text-center text-[14px] text-ink-soft">
            Working on <span className="text-ink">{current.title}</span>
          </p>
        ) : null}
      </div>

      <Section title="What are you working on?" className="mt-10">
        {todays.length === 0 ? (
          <p className="text-[13.5px] text-ink-soft">
            Nothing open today — focus on whatever you like.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {todays.map((task) => (
              <button
                key={task.id}
                onClick={() => setTaskId(task.id === taskId ? null : task.id)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-[13px] transition-colors",
                  task.id === taskId
                    ? "border-blush-600 bg-blush-50 text-rose-ink dark:bg-blush-600/15"
                    : "border-[var(--hairline)] text-ink-soft hover:border-blush-200",
                )}
              >
                {task.title}
              </button>
            ))}
          </div>
        )}
      </Section>

      <AnimatePresence>
        {immersive ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[65] grid place-items-center bg-[var(--paper)]/97 backdrop-blur-xl"
          >
            <div className="flex flex-col items-center gap-12">
              <TimerDial remaining={Math.max(0, remaining)} total={total} phase={phase} size={380} />
              {current ? (
                <p className="font-display text-[22px] text-ink">{current.title}</p>
              ) : (
                <p className="text-[13px] uppercase tracking-[0.24em] text-ink-faint">Nothing else</p>
              )}
              {controls}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
