"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Label, Select } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toaster";
import { cn } from "@/lib/cn";
import { format, toKey, todayKey, weekDays } from "@/lib/date";
import { useActions, useHydrated, usePlannerSelector, useSettings } from "@/lib/store/provider";
import { habitStreak, habitWeek } from "@/lib/store/selectors";
import { HabitHeatmap } from "@/features/habits/HabitHeatmap";
import { HabitGlyph } from "@/features/habits/HabitGlyph";
import { HABIT_ICON_KEYS } from "@/features/habits/icons";
import type { Habit } from "@/types";

function HabitBand({ habit, mondayFirst }: { habit: Habit; mondayFirst: boolean }) {
  const actions = useActions();
  const { notify } = useToast();
  const [expanded, setExpanded] = useState(false);
  const today = todayKey();

  const week = useMemo(() => habitWeek(habit, new Date(), mondayFirst), [habit, mondayFirst]);
  const days = useMemo(() => weekDays(new Date(), mondayFirst), [mondayFirst]);
  const streak = habitStreak(habit);
  const monthDone = habit.log.filter((day) => day.startsWith(format(new Date(), "yyyy-MM"))).length;

  return (
    <section className="border-t border-[var(--hairline)] py-7">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--hairline-strong)] text-rose-ink">
            <HabitGlyph name={habit.icon} size={17} />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-[20px] leading-tight text-ink">{habit.name}</h2>
            <p className="mt-0.5 text-[12px] text-ink-soft">
              {streak > 0 ? (
                <>
                  <span className="text-rose-ink">{streak} day streak</span> ·{" "}
                </>
              ) : null}
              {monthDone} this month · aiming for {habit.target}×/week
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            {days.map((day) => {
              const key = toKey(day);
              const done = habit.log.includes(key);
              const future = key > today;
              return (
                <button
                  key={key}
                  disabled={future}
                  onClick={() => actions.toggleHabitDay(habit.id, key)}
                  aria-label={`${format(day, "EEEE")}${done ? ", done" : ""}`}
                  aria-pressed={done}
                  className="group grid place-items-center"
                >
                  <span className="mb-1 text-[9.5px] uppercase tracking-wider text-ink-faint">
                    {format(day, "EEEEE")}
                  </span>
                  <motion.span
                    initial={false}
                    animate={{
                      backgroundColor: done ? "#fb6f92" : "rgba(0,0,0,0)",
                      borderColor: done ? "#fb6f92" : "var(--hairline-strong)",
                    }}
                    whileTap={{ scale: 0.85 }}
                    className={cn(
                      "h-[22px] w-[22px] rounded-full border",
                      future ? "opacity-35" : "group-hover:border-blush-400",
                    )}
                  />
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1">
            <span className="tabular w-10 text-right text-[12.5px] text-ink-soft">
              {Math.round(week.ratio * 100)}%
            </span>
            <IconButton
              label={expanded ? "Hide month" : "Show month"}
              onClick={() => setExpanded((open) => !open)}
            >
              <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.25 }}>
                <ChevronDown size={15} strokeWidth={1.7} />
              </motion.span>
            </IconButton>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="grid gap-8 pt-7 sm:grid-cols-[260px_minmax(0,1fr)]">
              <div>
                <p className="mb-3 text-[10.5px] uppercase tracking-[0.2em] text-ink-faint">
                  {format(new Date(), "MMMM")}
                </p>
                <HabitHeatmap
                  habit={habit}
                  mondayFirst={mondayFirst}
                  onToggle={(day) => actions.toggleHabitDay(habit.id, day)}
                />
              </div>

              <div className="flex flex-col items-start justify-between gap-6">
                <div className="w-full max-w-[220px] space-y-1.5">
                  <Label htmlFor={`${habit.id}-target`}>Times a week</Label>
                  <Select
                    id={`${habit.id}-target`}
                    value={habit.target}
                    onChange={(event) =>
                      actions.updateHabit(habit.id, { target: Number(event.target.value) })
                    }
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                      <option key={value} value={value}>
                        {value}×
                      </option>
                    ))}
                  </Select>
                </div>

                <button
                  onClick={() => {
                    const removed = actions.deleteHabit(habit.id);
                    if (removed)
                      notify(`${removed.name} removed`, {
                        label: "Undo",
                        run: () => actions.restoreHabit(removed),
                      });
                  }}
                  className="flex items-center gap-2 text-[12.5px] text-ink-faint transition-colors hover:text-rose-ink"
                >
                  <Trash2 size={13} strokeWidth={1.7} />
                  Remove habit
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function NewHabitSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const actions = useActions();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(HABIT_ICON_KEYS[0]);
  const [target, setTarget] = useState(5);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    actions.addHabit(name.trim(), icon, target);
    setName("");
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="New habit" description="Small, repeatable, kind to yourself.">
      <form onSubmit={submit} className="space-y-8">
        <div className="space-y-1.5">
          <Label htmlFor="habit-name">Name it</Label>
          <Input
            id="habit-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Stretch, read, drink water…"
            className="font-display text-[19px]"
          />
        </div>

        <div className="space-y-2.5">
          <Label>Mark</Label>
          <div className="flex flex-wrap gap-2">
            {HABIT_ICON_KEYS.map((key) => {
              const active = key === icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIcon(key)}
                  aria-label={key}
                  aria-pressed={active}
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-full border transition-colors",
                    active
                      ? "border-blush-600 bg-blush-50 text-rose-ink dark:bg-blush-600/15"
                      : "border-[var(--hairline)] text-ink-faint hover:border-blush-200",
                  )}
                >
                  <HabitGlyph name={key} size={16} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="max-w-[200px] space-y-1.5">
          <Label htmlFor="habit-target">Times a week</Label>
          <Select
            id="habit-target"
            value={target}
            onChange={(event) => setTarget(Number(event.target.value))}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((value) => (
              <option key={value} value={value}>
                {value}×
              </option>
            ))}
          </Select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add habit</Button>
        </div>
      </form>
    </Sheet>
  );
}

export default function HabitsPage() {
  const habits = usePlannerSelector((state) => state.habits);
  const settings = useSettings();
  const hydrated = useHydrated();
  const [adding, setAdding] = useState(false);

  const active = habits.filter((habit) => !habit.archived);

  return (
    <div>
      <PageHeader
        eyebrow="Kept quietly"
        title="Habits"
        lede="Consistency, not perfection. A missed day is just a missed day."
        aside={
          <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="pl-2.5">
            <Plus size={15} strokeWidth={2} />
            New habit
          </Button>
        }
      />

      {!hydrated ? (
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : active.length === 0 ? (
        <EmptyState
          variant="bud"
          title="No habits yet"
          body="Pick one thing you would like to do most days. One is plenty."
          action={<Button onClick={() => setAdding(true)}>Add your first habit</Button>}
        />
      ) : (
        <div>
          {active.map((habit) => (
            <HabitBand key={habit.id} habit={habit} mondayFirst={settings.weekStartsMonday} />
          ))}
        </div>
      )}

      <NewHabitSheet open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}
