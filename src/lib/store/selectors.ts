import { differenceInCalendarDays } from "date-fns";
import { fromKey, toKey, weekDays } from "@/lib/date";
import type { DayKey, DayPart, Goal, Habit, PlannerState, Task } from "@/types";

/**
 * Pure derivations. Components call these inside `useMemo`, which keeps every
 * screen free of ad-hoc filtering logic.
 */

export const activeTasks = (tasks: Task[]) => tasks.filter((task) => !task.archived);

export const byOrder = (a: Task, b: Task) =>
  a.order - b.order || (a.time ?? "99:99").localeCompare(b.time ?? "99:99");

export const tasksOn = (tasks: Task[], day: DayKey) =>
  activeTasks(tasks).filter((task) => task.date === day).sort(byOrder);

export const tasksInPart = (tasks: Task[], day: DayKey, part: DayPart) =>
  tasksOn(tasks, day).filter((task) => task.dayPart === part);

export const unscheduled = (tasks: Task[]) =>
  activeTasks(tasks).filter((task) => task.date === null).sort(byOrder);

export const scheduleFor = (tasks: Task[], day: DayKey) =>
  tasksOn(tasks, day)
    .filter((task) => task.time)
    .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));

export function completion(tasks: Task[]) {
  const total = tasks.length;
  const done = tasks.filter((task) => task.done).length;
  return { total, done, ratio: total === 0 ? 0 : done / total };
}

export function weekCompletion(tasks: Task[], anchor: Date, mondayFirst: boolean) {
  const days = weekDays(anchor, mondayFirst).map(toKey);
  const scoped = activeTasks(tasks).filter((task) => task.date && days.includes(task.date));
  return { ...completion(scoped), days };
}

export function monthCompletion(tasks: Task[], anchor: Date) {
  const prefix = `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, "0")}`;
  const scoped = activeTasks(tasks).filter((task) => task.date?.startsWith(prefix));
  return completion(scoped);
}

/** Deadlines inside the next fortnight, nearest first. */
export function upcomingDeadlines(tasks: Task[], from = new Date(), horizon = 14) {
  return activeTasks(tasks)
    .filter((task) => !task.done && task.due)
    .map((task) => ({ task, days: differenceInCalendarDays(fromKey(task.due!), from) }))
    .filter((entry) => entry.days >= 0 && entry.days <= horizon)
    .sort((a, b) => a.days - b.days);
}

export function habitStreak(habit: Habit, today = new Date()): number {
  const log = new Set(habit.log);
  let streak = 0;
  const cursor = new Date(today);
  // Today not being ticked yet should not break yesterday's streak.
  if (!log.has(toKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (log.has(toKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function habitWeek(habit: Habit, anchor: Date, mondayFirst: boolean) {
  const days = weekDays(anchor, mondayFirst).map(toKey);
  const hit = days.filter((day) => habit.log.includes(day)).length;
  return { days, hit, ratio: Math.min(1, hit / Math.max(1, habit.target)) };
}

export const goalProgress = (goal: Goal) => {
  const total = goal.milestones.length;
  const done = goal.milestones.filter((milestone) => milestone.done).length;
  return { total, done, ratio: total === 0 ? 0 : done / total };
};

export interface SearchHit {
  id: string;
  kind: "task" | "note" | "goal" | "habit" | "journal" | "meal" | "shopping";
  title: string;
  detail: string;
  href: string;
}

/** One index across every entity — the command palette needs nothing else. */
export function search(state: PlannerState, rawQuery: string): SearchHit[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return [];
  const hits: SearchHit[] = [];

  for (const task of activeTasks(state.tasks)) {
    if (`${task.title} ${task.description} ${task.notes}`.toLowerCase().includes(query)) {
      hits.push({
        id: task.id,
        kind: "task",
        title: task.title,
        detail: task.date ?? "Someday",
        href: task.date ? `/today?d=${task.date}` : "/tasks",
      });
    }
  }
  for (const note of state.notes) {
    if (`${note.title} ${note.body}`.toLowerCase().includes(query)) {
      hits.push({ id: note.id, kind: "note", title: note.title || "Untitled note", detail: "Note", href: "/notes" });
    }
  }
  for (const goal of state.goals) {
    if (`${goal.title} ${goal.intention}`.toLowerCase().includes(query)) {
      hits.push({ id: goal.id, kind: "goal", title: goal.title, detail: "Goal", href: "/goals" });
    }
  }
  for (const habit of state.habits) {
    if (habit.name.toLowerCase().includes(query)) {
      hits.push({ id: habit.id, kind: "habit", title: habit.name, detail: "Habit", href: "/habits" });
    }
  }
  for (const meal of state.meals) {
    if (meal.title.toLowerCase().includes(query)) {
      hits.push({ id: meal.id, kind: "meal", title: meal.title, detail: meal.date, href: "/kitchen" });
    }
  }
  for (const item of state.shopping) {
    if (item.title.toLowerCase().includes(query)) {
      hits.push({ id: item.id, kind: "shopping", title: item.title, detail: "To buy", href: "/kitchen" });
    }
  }
  for (const entry of state.journal) {
    if (`${entry.body} ${entry.gratitude}`.toLowerCase().includes(query)) {
      hits.push({ id: entry.id, kind: "journal", title: entry.date, detail: "Journal", href: "/journal" });
    }
  }

  return hits.slice(0, 24);
}
