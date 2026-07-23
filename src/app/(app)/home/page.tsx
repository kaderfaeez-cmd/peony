"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, Section } from "@/components/layout/PageHeader";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { EmptyState } from "@/components/ui/EmptyState";
import { TaskSkeleton } from "@/components/ui/Skeleton";
import { MiniMonth } from "@/features/calendar/MiniMonth";
import { HabitTicks } from "@/features/habits/HabitTicks";
import { InlineAdd } from "@/features/tasks/InlineAdd";
import { TaskList } from "@/features/tasks/TaskList";
import { WeatherWidget } from "@/features/weather/WeatherWidget";
import { useDailyCelebration } from "@/hooks/useDailyCelebration";
import { format, friendlyDay, friendlyTime, partOfDay, todayKey } from "@/lib/date";
import { useHydrated, usePlannerSelector, useSettings } from "@/lib/store/provider";
import {
  completion,
  monthCompletion,
  scheduleFor,
  tasksOn,
  upcomingDeadlines,
  weekCompletion,
} from "@/lib/store/selectors";
import { quoteOfDay } from "@/lib/quotes";

const GREETINGS = {
  morning: "Good morning",
  afternoon: "Good afternoon",
  evening: "Good evening",
} as const;

export default function DashboardPage() {
  const tasks = usePlannerSelector((state) => state.tasks);
  const settings = useSettings();
  const hydrated = useHydrated();
  const [greeting, setGreeting] = useState("Hello");
  const [today, setToday] = useState(todayKey());

  useEffect(() => {
    setGreeting(GREETINGS[partOfDay()]);
    setToday(todayKey());
  }, []);

  const todays = useMemo(() => tasksOn(tasks, today), [tasks, today]);
  const day = useMemo(() => completion(todays), [todays]);
  const week = useMemo(
    () => weekCompletion(tasks, new Date(), settings.weekStartsMonday),
    [tasks, settings.weekStartsMonday],
  );
  const month = useMemo(() => monthCompletion(tasks, new Date()), [tasks]);
  const schedule = useMemo(() => scheduleFor(tasks, today), [tasks, today]);
  const deadlines = useMemo(() => upcomingDeadlines(tasks), [tasks]);
  const quote = quoteOfDay();

  useDailyCelebration(todays);

  return (
    <div>
      <PageHeader
        eyebrow={format(new Date(), "EEEE, d MMMM")}
        title={
          <>
            {greeting}
            {settings.name ? <span className="text-rose-ink">, {settings.name}</span> : null}.
          </>
        }
        lede={
          day.total === 0
            ? "Nothing on the list yet. Start with one small thing."
            : day.done === day.total
              ? "Everything is done. The rest of the day is yours."
              : `${day.total - day.done} ${day.total - day.done === 1 ? "thing" : "things"} left today, and no rush.`
        }
        aside={<ProgressRing value={day.ratio} label="Today" size={104} />}
      />

      <div className="grid gap-x-14 gap-y-12 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* ---------------------------------------------------------- main */}
        <div className="space-y-12">
          <Section quiet>
            <div className="mb-2 flex items-baseline justify-between gap-4">
              <h2 className="font-display text-[22px] text-ink">Today</h2>
              <Link
                href="/today"
                className="group flex items-center gap-1 text-[12.5px] text-ink-faint transition-colors hover:text-rose-ink"
              >
                Open the day
                <ArrowUpRight size={13} strokeWidth={1.8} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            {!hydrated ? (
              <TaskSkeleton rows={4} />
            ) : (
              <>
                <TaskList
                  tasks={todays}
                  empty={
                    <EmptyState
                      compact
                      variant="bud"
                      title="A clear day"
                      body="Write the first thing below and the day starts shaping itself."
                    />
                  }
                />
                <InlineAdd
                  draft={{ date: today, dayPart: partOfDay() }}
                  placeholder="Add to today"
                  className="mt-1 border-t border-[var(--hairline)] pt-3"
                />
              </>
            )}
          </Section>

          <Section title="Today's shape">
            {schedule.length === 0 ? (
              <p className="text-[13.5px] text-ink-soft">
                Nothing is scheduled — the whole day is unclaimed.
              </p>
            ) : (
              <ol className="space-y-0">
                {schedule.map((task, index) => (
                  <li
                    key={task.id}
                    className="grid grid-cols-[64px_1fr] items-baseline gap-4 border-t border-[var(--hairline)] py-3 first:border-t-0"
                    style={{ opacity: task.done ? 0.5 : 1 }}
                  >
                    <span className="tabular text-[12px] text-ink-faint">{friendlyTime(task.time)}</span>
                    <span className="flex items-center gap-2 text-[14.5px] text-ink">
                      {task.title}
                      {index === 0 && !task.done ? (
                        <span className="rounded-full bg-blush-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-rose-ink dark:bg-blush-600/15">
                          next
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Section>

          <Section title="Coming up">
            {deadlines.length === 0 ? (
              <p className="text-[13.5px] text-ink-soft">No deadlines in the next two weeks.</p>
            ) : (
              <ul className="space-y-0">
                {deadlines.slice(0, 5).map(({ task, days }) => (
                  <li
                    key={task.id}
                    className="flex items-baseline justify-between gap-6 border-t border-[var(--hairline)] py-3 first:border-t-0"
                  >
                    <span className="truncate text-[14.5px] text-ink">{task.title}</span>
                    <span className="shrink-0 text-[12px] text-ink-faint">
                      {days === 0 ? "today" : days === 1 ? "tomorrow" : friendlyDay(task.due!)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        {/* --------------------------------------------------------- aside */}
        <aside className="space-y-11 xl:border-l xl:border-[var(--hairline)] xl:pl-10">
          <div>
            <h2 className="mb-4 text-[10.5px] font-medium uppercase tracking-[0.2em] text-ink-faint">
              Progress
            </h2>
            <div className="flex items-center gap-8">
              <ProgressRing value={week.ratio} size={78} stroke={5} label="Week" tone="#ff8fab" />
              <ProgressRing value={month.ratio} size={78} stroke={5} label="Month" tone="#ffb3c6" />
            </div>
            <p className="mt-4 text-[12.5px] leading-relaxed text-ink-soft">
              {week.done} of {week.total || 0} done this week · {month.done} of {month.total || 0} this
              month.
            </p>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[10.5px] font-medium uppercase tracking-[0.2em] text-ink-faint">Habits</h2>
              <Link href="/habits" className="text-[11.5px] text-ink-faint hover:text-rose-ink">
                all
              </Link>
            </div>
            <HabitTicks limit={5} />
          </div>

          {settings.weather ? (
            <div>
              <h2 className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.2em] text-ink-faint">
                Outside
              </h2>
              <WeatherWidget />
            </div>
          ) : null}

          <div>
            <MiniMonth />
          </div>

          <figure className="border-t border-[var(--hairline)] pt-6">
            <blockquote className="font-display text-[16px] leading-snug text-ink">
              “{quote.line}”
            </blockquote>
            <figcaption className="mt-2 text-[11px] uppercase tracking-[0.16em] text-ink-faint">
              {quote.source}
            </figcaption>
          </figure>
        </aside>
      </div>
    </div>
  );
}
