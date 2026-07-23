"use client";

import { isSameMonth } from "date-fns";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, Section } from "@/components/layout/PageHeader";
import { Label, Textarea } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { addDays, format, fromKey, monthGrid, toKey, todayKey } from "@/lib/date";
import { useActions, useHydrated, usePlannerSelector, useSettings } from "@/lib/store/provider";
import { DateNav } from "@/features/planner/DateNav";
import type { Mood } from "@/types";

const MOODS: Array<{ value: Mood; label: string; tone: string }> = [
  { value: 1, label: "Heavy", tone: "#ffe5ec" },
  { value: 2, label: "Low", tone: "#ffc2d1" },
  { value: 3, label: "Even", tone: "#ffb3c6" },
  { value: 4, label: "Good", tone: "#ff8fab" },
  { value: 5, label: "Bright", tone: "#fb6f92" },
];

const moodTone = (mood: Mood | null) => (mood ? MOODS[mood - 1].tone : null);

export default function JournalPage() {
  const journal = usePlannerSelector((state) => state.journal);
  const settings = useSettings();
  const actions = useActions();
  const hydrated = useHydrated();

  const [date, setDate] = useState(todayKey());
  const [draft, setDraft] = useState({ gratitude: "", body: "" });

  const entry = useMemo(() => journal.find((item) => item.date === date) ?? null, [journal, date]);
  const day = fromKey(date);

  useEffect(() => {
    setDraft({ gratitude: entry?.gratitude ?? "", body: entry?.body ?? "" });
  }, [date, entry?.gratitude, entry?.body]);

  // Autosave, quietly.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (draft.gratitude === (entry?.gratitude ?? "") && draft.body === (entry?.body ?? "")) return;
      actions.saveJournal(date, draft);
    }, 600);
    return () => clearTimeout(timer);
  }, [draft, date, entry, actions]);

  const monthDays = useMemo(
    () => monthGrid(day, settings.weekStartsMonday).filter((item) => isSameMonth(item, day)),
    [day, settings.weekStartsMonday],
  );
  const moodByDay = useMemo(
    () => new Map(journal.map((item) => [item.date, item.mood])),
    [journal],
  );

  const recent = useMemo(
    () => [...journal].filter((item) => item.body.trim()).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [journal],
  );

  return (
    <div>
      <PageHeader
        eyebrow={format(day, "EEEE")}
        title={format(day, "d MMMM")}
        lede="A few lines is a whole entry. There is no minimum."
        aside={
          <DateNav
            unit="day"
            showReset={date !== todayKey()}
            onPrevious={() => setDate(toKey(addDays(day, -1)))}
            onNext={() => setDate(toKey(addDays(day, 1)))}
            onReset={() => setDate(todayKey())}
          />
        }
      />

      {!hydrated ? (
        <Skeleton className="h-[400px] w-full" />
      ) : (
        <div className="grid gap-x-14 gap-y-12 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-10">
            <div>
              <Label>How today felt</Label>
              <div className="mt-3 flex items-center gap-3">
                {MOODS.map((mood) => {
                  const selected = entry?.mood === mood.value;
                  return (
                    <button
                      key={mood.value}
                      onClick={() =>
                        actions.saveJournal(date, { mood: selected ? null : mood.value })
                      }
                      aria-pressed={selected}
                      aria-label={mood.label}
                      className="group flex flex-col items-center gap-2"
                    >
                      <motion.span
                        initial={false}
                        animate={{
                          scale: selected ? 1.12 : 1,
                          borderColor: selected ? "#fb6f92" : "var(--hairline)",
                        }}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        transition={{ type: "spring", stiffness: 420, damping: 22 }}
                        className="h-9 w-9 rounded-full border-2"
                        style={{ backgroundColor: mood.tone }}
                      />
                      <span
                        className={cn(
                          "text-[11px] transition-colors",
                          selected ? "text-ink" : "text-ink-faint",
                        )}
                      >
                        {mood.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="journal-gratitude">Grateful for</Label>
              <Textarea
                id="journal-gratitude"
                rows={2}
                value={draft.gratitude}
                onChange={(event) => setDraft({ ...draft, gratitude: event.target.value })}
                placeholder="Three small things, or one big one."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="journal-body">The day</Label>
              <Textarea
                id="journal-body"
                rows={12}
                value={draft.body}
                onChange={(event) => setDraft({ ...draft, body: event.target.value })}
                placeholder="Write freely. Nobody else reads this."
                className="font-display text-[16px] leading-[1.75]"
              />
            </div>
          </div>

          <aside className="space-y-10 xl:border-l xl:border-[var(--hairline)] xl:pl-10">
            <div>
              <h2 className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.2em] text-ink-faint">
                {format(day, "MMMM")} moods
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {monthDays.map((item) => {
                  const key = toKey(item);
                  const tone = moodTone(moodByDay.get(key) ?? null);
                  return (
                    <button
                      key={key}
                      onClick={() => setDate(key)}
                      aria-label={`${format(item, "d MMMM")}${tone ? "" : " — no entry"}`}
                      className={cn(
                        "h-4 w-4 rounded-full border transition-transform hover:scale-125",
                        key === date ? "ring-1 ring-blush-600 ring-offset-1 ring-offset-[var(--paper)]" : "",
                      )}
                      style={{
                        backgroundColor: tone ?? "transparent",
                        borderColor: tone ?? "var(--hairline-strong)",
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <Section title="Recent entries" className="border-t border-[var(--hairline)] pt-6">
              {recent.length === 0 ? (
                <p className="text-[13px] text-ink-soft">Nothing written yet this month.</p>
              ) : (
                <ul className="space-y-3">
                  {recent.map((item) => (
                    <li key={item.id}>
                      <button onClick={() => setDate(item.date)} className="group text-left">
                        <p className="text-[11.5px] uppercase tracking-[0.14em] text-ink-faint">
                          {format(fromKey(item.date), "d MMM")}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-ink-soft transition-colors group-hover:text-ink">
                          {item.body}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </aside>
        </div>
      )}
    </div>
  );
}
