/**
 * Domain model for Peony.
 *
 * Every entity is a plain, serialisable record so the whole store can move from
 * localStorage to Supabase without touching a single component: the shapes here
 * map 1:1 onto future tables.
 */

export type Priority = "low" | "medium" | "high";

export type DayPart = "morning" | "afternoon" | "evening";

export type Repeat = "none" | "daily" | "weekdays" | "weekly" | "monthly" | "yearly";

/** ISO calendar day, `yyyy-MM-dd`. Never a Date — dates do not survive JSON. */
export type DayKey = string;

/** 24h wall clock, `HH:mm`. */
export type TimeKey = string;

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  notes: string;
  priority: Priority;
  categoryId: string;
  /** The day this task lives on. `null` means it sits in the unscheduled backlog. */
  date: DayKey | null;
  /** Optional hard deadline, shown separately from `date`. */
  due: DayKey | null;
  time: TimeKey | null;
  dayPart: DayPart;
  done: boolean;
  completedAt: string | null;
  repeat: Repeat;
  /** Links every generated occurrence of a repeating task back to its origin. */
  seriesId: string | null;
  subtasks: Subtask[];
  archived: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  /** One of the five roses, referenced by token name. */
  tone: "blush-50" | "blush-100" | "blush-200" | "blush-400" | "blush-600";
  system: boolean;
}

export interface Habit {
  id: string;
  name: string;
  /** Lucide icon name, resolved through the curated icon map. */
  icon: string;
  /** Target completions per week, 1–7. */
  target: number;
  /** Completed days, `yyyy-MM-dd`. */
  log: DayKey[];
  archived: boolean;
  createdAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  done: boolean;
}

export interface Goal {
  id: string;
  title: string;
  intention: string;
  horizon: "short" | "long";
  due: DayKey | null;
  milestones: Milestone[];
  celebratedAt: string | null;
  archived: boolean;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Mood = 1 | 2 | 3 | 4 | 5;

export interface JournalEntry {
  id: string;
  date: DayKey;
  mood: Mood | null;
  gratitude: string;
  body: string;
  updatedAt: string;
}

export interface Reflection {
  id: string;
  /** `2026-W30` for weeks, `2026-07` for months. */
  period: string;
  scope: "week" | "month";
  wins: string;
  lessons: string;
  intention: string;
  updatedAt: string;
}

/** One meal per day — a menu, not a meal-prep spreadsheet. */
export interface Meal {
  id: string;
  date: DayKey;
  title: string;
  note: string;
  updatedAt: string;
}

/** Store sections, so the list reads in the order you walk the shop. */
export type Aisle =
  | "produce"
  | "bakery"
  | "dairy"
  | "meat"
  | "pantry"
  | "frozen"
  | "drinks"
  | "household"
  | "other";

export interface ShoppingItem {
  id: string;
  title: string;
  quantity: string;
  aisle: Aisle;
  done: boolean;
  createdAt: string;
}

export interface Settings {
  name: string;
  theme: "light" | "dark";
  atmosphere: boolean;
  calmMotion: boolean;
  reminders: boolean;
  weather: boolean;
  weekStartsMonday: boolean;
  pomodoroFocus: number;
  pomodoroBreak: number;
}

export interface PlannerState {
  version: number;
  tasks: Task[];
  categories: Category[];
  habits: Habit[];
  goals: Goal[];
  notes: Note[];
  journal: JournalEntry[];
  reflections: Reflection[];
  meals: Meal[];
  shopping: ShoppingItem[];
  settings: Settings;
}

/** Everything a task form can set. Ids and bookkeeping stay with the store. */
export type TaskDraft = Partial<
  Pick<
    Task,
    | "title"
    | "description"
    | "notes"
    | "priority"
    | "categoryId"
    | "date"
    | "due"
    | "time"
    | "dayPart"
    | "repeat"
    | "subtasks"
  >
>;
