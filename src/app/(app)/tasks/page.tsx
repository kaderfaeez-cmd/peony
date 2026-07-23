"use client";

import { useMemo, useState } from "react";
import { PageHeader, Section } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { TaskSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { friendlyDay, todayKey } from "@/lib/date";
import { useHydrated, usePlannerSelector } from "@/lib/store/provider";
import { byOrder } from "@/lib/store/selectors";
import { InlineAdd } from "@/features/tasks/InlineAdd";
import { TaskList } from "@/features/tasks/TaskList";
import type { Task } from "@/types";

type View = "open" | "done" | "archived";

const VIEWS = [
  { value: "open" as const, label: "Open" },
  { value: "done" as const, label: "Done" },
  { value: "archived" as const, label: "Archived" },
];

/** Buckets read as sentences about time, not as database fields. */
function bucketOf(task: Task, today: string): string {
  if (!task.date) return "Someday";
  if (task.date < today) return "Earlier";
  if (task.date === today) return "Today";
  return friendlyDay(task.date);
}

export default function TasksPage() {
  const tasks = usePlannerSelector((state) => state.tasks);
  const categories = usePlannerSelector((state) => state.categories);
  const hydrated = useHydrated();
  const [view, setView] = useState<View>("open");
  const [category, setCategory] = useState<string | null>(null);
  const today = todayKey();

  const filtered = useMemo(() => {
    return tasks
      .filter((task) => {
        if (view === "archived") return task.archived;
        if (task.archived) return false;
        return view === "done" ? task.done : !task.done;
      })
      .filter((task) => (category ? task.categoryId === category : true))
      .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999") || byOrder(a, b));
  }, [tasks, view, category]);

  const groups = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of filtered) {
      const bucket = view === "open" ? bucketOf(task, today) : "All";
      const list = map.get(bucket) ?? [];
      list.push(task);
      map.set(bucket, list);
    }
    return [...map.entries()];
  }, [filtered, view, today]);

  const counts = useMemo(() => {
    const open = tasks.filter((task) => !task.done && !task.archived).length;
    return { open };
  }, [tasks]);

  return (
    <div>
      <PageHeader
        eyebrow="Everything"
        title="Tasks"
        lede={
          counts.open === 0
            ? "Nothing open. That is allowed to feel good."
            : `${counts.open} open ${counts.open === 1 ? "task" : "tasks"} across every day.`
        }
        aside={
          <SegmentedControl
            ariaLabel="Task view"
            value={view}
            segments={VIEWS}
            onChange={setView}
            className="border border-[var(--hairline)]"
          />
        }
      />

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setCategory(null)}
          className={cn(
            "rounded-full border px-3 py-1 text-[12.5px] transition-colors",
            category === null
              ? "border-blush-400 text-rose-ink"
              : "border-[var(--hairline)] text-ink-faint hover:text-ink-soft",
          )}
        >
          All
        </button>
        {categories.map((item) => (
          <button
            key={item.id}
            onClick={() => setCategory(category === item.id ? null : item.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] transition-colors",
              category === item.id
                ? "border-blush-400 text-rose-ink"
                : "border-[var(--hairline)] text-ink-faint hover:text-ink-soft",
            )}
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: `var(--color-${item.tone})` }}
            />
            {item.name}
          </button>
        ))}
      </div>

      {!hydrated ? (
        <TaskSkeleton rows={6} />
      ) : groups.length === 0 ? (
        <EmptyState
          variant="leaf"
          title={view === "open" ? "Nothing open" : view === "done" ? "Nothing finished yet" : "Nothing archived"}
          body={
            view === "open"
              ? "Add something below, or enjoy the quiet."
              : "Completed and archived tasks collect here as a record of the year."
          }
        />
      ) : (
        <div className="space-y-10">
          {groups.map(([bucket, list]) => (
            <Section key={bucket} title={bucket}>
              <TaskList tasks={list} showDate={view !== "open"} />
            </Section>
          ))}
        </div>
      )}

      {view === "open" ? (
        <div className="mt-12 border-t border-[var(--hairline)] pt-4">
          <InlineAdd draft={{ date: today, dayPart: "morning" }} placeholder="Add a task for today" />
        </div>
      ) : null}
    </div>
  );
}
