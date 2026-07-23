import { createId } from "@/lib/id";
import { toKey, addDays } from "@/lib/date";
import type { Category, PlannerState, Settings, Task } from "@/types";

export const STATE_VERSION = 1;

export const DEFAULT_SETTINGS: Settings = {
  name: "",
  theme: "light",
  atmosphere: true,
  calmMotion: false,
  reminders: false,
  weather: false,
  weekStartsMonday: true,
  pomodoroFocus: 25,
  pomodoroBreak: 5,
};

export const SYSTEM_CATEGORIES: Category[] = [
  { id: "personal", name: "Personal", tone: "blush-400", system: true },
  { id: "work", name: "Work", tone: "blush-600", system: true },
  { id: "university", name: "University", tone: "blush-200", system: true },
  { id: "shopping", name: "Shopping", tone: "blush-100", system: true },
  { id: "fitness", name: "Fitness", tone: "blush-600", system: true },
  { id: "health", name: "Health", tone: "blush-400", system: true },
  { id: "appointments", name: "Appointments", tone: "blush-200", system: true },
  { id: "birthdays", name: "Birthdays", tone: "blush-100", system: true },
  { id: "family", name: "Family", tone: "blush-400", system: true },
];

export function emptyState(): PlannerState {
  return {
    version: STATE_VERSION,
    tasks: [],
    categories: SYSTEM_CATEGORIES,
    habits: [],
    goals: [],
    notes: [],
    journal: [],
    reflections: [],
    settings: DEFAULT_SETTINGS,
  };
}

function seedTask(partial: Partial<Task>): Task {
  const now = new Date().toISOString();
  return {
    id: createId("task"),
    title: "",
    description: "",
    notes: "",
    priority: "medium",
    categoryId: "personal",
    date: toKey(new Date()),
    due: null,
    time: null,
    dayPart: "morning",
    done: false,
    completedAt: null,
    repeat: "none",
    seriesId: null,
    subtasks: [],
    archived: false,
    order: 0,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

/**
 * A first-run garden. Small enough to clear in a minute, warm enough that the
 * app never opens as an empty grey shell.
 */
export function seededState(): PlannerState {
  const now = new Date();
  const today = toKey(now);
  const base = emptyState();

  return {
    ...base,
    tasks: [
      seedTask({
        title: "Slow coffee, no phone",
        dayPart: "morning",
        time: "07:30",
        categoryId: "personal",
        priority: "low",
        date: today,
        order: 0,
      }),
      seedTask({
        title: "Plan the week ahead",
        description: "Three things that matter. Everything else is a bonus.",
        dayPart: "morning",
        categoryId: "personal",
        priority: "high",
        date: today,
        order: 1,
        subtasks: [
          { id: createId("sub"), title: "Look at the calendar", done: false },
          { id: createId("sub"), title: "Pick three", done: false },
        ],
      }),
      seedTask({
        title: "Long walk before sunset",
        dayPart: "evening",
        time: "17:30",
        categoryId: "fitness",
        priority: "medium",
        date: today,
        order: 2,
      }),
      seedTask({
        title: "Groceries — flowers for the table",
        dayPart: "afternoon",
        categoryId: "shopping",
        priority: "low",
        date: toKey(addDays(now, 2)),
        order: 0,
      }),
    ],
    habits: [
      { id: createId("habit"), name: "Water", icon: "droplet", target: 7, log: [], archived: false, createdAt: now.toISOString() },
      { id: createId("habit"), name: "Read", icon: "book", target: 5, log: [], archived: false, createdAt: now.toISOString() },
      { id: createId("habit"), name: "Move", icon: "sparkles", target: 4, log: [], archived: false, createdAt: now.toISOString() },
    ],
    goals: [
      {
        id: createId("goal"),
        title: "A calmer, kinder year",
        intention: "Fewer things, done with more attention.",
        horizon: "long",
        due: null,
        milestones: [
          { id: createId("ms"), title: "A morning routine that sticks", done: false },
          { id: createId("ms"), title: "One book a month", done: false },
          { id: createId("ms"), title: "Weekends that feel like weekends", done: false },
        ],
        celebratedAt: null,
        archived: false,
        createdAt: now.toISOString(),
      },
    ],
    notes: [
      {
        id: createId("note"),
        title: "Read this first",
        body:
          "Welcome to your planner.\n\n" +
          "- Press **N** anywhere to add a task\n" +
          "- Press **/** to search everything\n" +
          "- [ ] Try ticking this box\n" +
          "- [x] Notes understand markdown\n\n" +
          "Everything lives on this device. Nothing is sent anywhere.",
        pinned: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ],
  };
}
