import { createId } from "@/lib/id";
import { nextOccurrence, todayKey } from "@/lib/date";
import type {
  Category,
  Goal,
  Habit,
  JournalEntry,
  Mood,
  Note,
  PlannerState,
  Reflection,
  Settings,
  ShoppingItem,
  Task,
  TaskDraft,
} from "@/types";

/**
 * Every function here is `(state, ...args) => state` and never mutates its
 * input. That makes undo, time-travel and a future server sync trivial.
 */

const stamp = () => new Date().toISOString();

const replace = <T extends { id: string }>(list: T[], id: string, patch: Partial<T>): T[] =>
  list.map((item) => (item.id === id ? { ...item, ...patch } : item));

/* ---------------------------------------------------------------- tasks -- */

export function buildTask(draft: TaskDraft, order: number): Task {
  const now = stamp();
  return {
    id: createId("task"),
    title: draft.title?.trim() || "Untitled",
    description: draft.description ?? "",
    notes: draft.notes ?? "",
    priority: draft.priority ?? "medium",
    categoryId: draft.categoryId ?? "personal",
    date: draft.date ?? todayKey(),
    due: draft.due ?? null,
    time: draft.time ?? null,
    dayPart: draft.dayPart ?? "morning",
    done: false,
    completedAt: null,
    repeat: draft.repeat ?? "none",
    seriesId: null,
    subtasks: draft.subtasks ?? [],
    archived: false,
    order,
    createdAt: now,
    updatedAt: now,
  };
}

export const addTask = (state: PlannerState, task: Task): PlannerState => ({
  ...state,
  tasks: [...state.tasks, task],
});

export const updateTask = (state: PlannerState, id: string, patch: Partial<Task>): PlannerState => ({
  ...state,
  tasks: replace(state.tasks, id, { ...patch, updatedAt: stamp() }),
});

/**
 * Completing a repeating task closes today's instance and quietly plants the
 * next one, so a streak never depends on remembering to re-add it.
 */
export function toggleTask(state: PlannerState, id: string): PlannerState {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return state;

  const done = !task.done;
  const tasks = replace(state.tasks, id, {
    done,
    completedAt: done ? stamp() : null,
    updatedAt: stamp(),
  });

  if (!done || task.repeat === "none" || !task.date) return { ...state, tasks };

  const nextDate = nextOccurrence(task.date, task.repeat);
  if (!nextDate) return { ...state, tasks };

  const seriesId = task.seriesId ?? task.id;
  const alreadyPlanted = tasks.some(
    (item) => item.seriesId === seriesId && item.date === nextDate && !item.archived,
  );
  if (alreadyPlanted) return { ...state, tasks };

  const nextInstance: Task = {
    ...task,
    id: createId("task"),
    date: nextDate,
    done: false,
    completedAt: null,
    seriesId,
    subtasks: task.subtasks.map((sub) => ({ ...sub, id: createId("sub"), done: false })),
    createdAt: stamp(),
    updatedAt: stamp(),
  };

  return { ...state, tasks: [...tasks, nextInstance] };
}

export const removeTask = (state: PlannerState, id: string): PlannerState => ({
  ...state,
  tasks: state.tasks.filter((task) => task.id !== id),
});

export const restoreTask = (state: PlannerState, task: Task): PlannerState => ({
  ...state,
  tasks: [...state.tasks, task],
});

export const archiveTask = (state: PlannerState, id: string, archived: boolean): PlannerState =>
  updateTask(state, id, { archived });

/** Reorders one bucket (a day + part) by writing dense order values. */
export const reorderTasks = (state: PlannerState, orderedIds: string[]): PlannerState => {
  const rank = new Map(orderedIds.map((id, index) => [id, index]));
  return {
    ...state,
    tasks: state.tasks.map((task) =>
      rank.has(task.id) ? { ...task, order: rank.get(task.id)!, updatedAt: stamp() } : task,
    ),
  };
};

export const addSubtask = (state: PlannerState, taskId: string, title: string): PlannerState => ({
  ...state,
  tasks: state.tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          subtasks: [...task.subtasks, { id: createId("sub"), title, done: false }],
          updatedAt: stamp(),
        }
      : task,
  ),
});

export const toggleSubtask = (state: PlannerState, taskId: string, subId: string): PlannerState => ({
  ...state,
  tasks: state.tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          subtasks: task.subtasks.map((sub) =>
            sub.id === subId ? { ...sub, done: !sub.done } : sub,
          ),
          updatedAt: stamp(),
        }
      : task,
  ),
});

export const removeSubtask = (state: PlannerState, taskId: string, subId: string): PlannerState => ({
  ...state,
  tasks: state.tasks.map((task) =>
    task.id === taskId
      ? { ...task, subtasks: task.subtasks.filter((sub) => sub.id !== subId), updatedAt: stamp() }
      : task,
  ),
});

/* ----------------------------------------------------------- categories -- */

export const addCategory = (state: PlannerState, name: string, tone: Category["tone"]): PlannerState => ({
  ...state,
  categories: [...state.categories, { id: createId("cat"), name, tone, system: false }],
});

export const removeCategory = (state: PlannerState, id: string): PlannerState => ({
  ...state,
  categories: state.categories.filter((category) => category.id !== id || category.system),
  tasks: state.tasks.map((task) =>
    task.categoryId === id ? { ...task, categoryId: "personal" } : task,
  ),
});

/* --------------------------------------------------------------- habits -- */

export const addHabit = (state: PlannerState, name: string, icon: string, target: number): PlannerState => ({
  ...state,
  habits: [
    ...state.habits,
    { id: createId("habit"), name, icon, target, log: [], archived: false, createdAt: stamp() },
  ],
});

export const toggleHabitDay = (state: PlannerState, id: string, day: string): PlannerState => ({
  ...state,
  habits: state.habits.map((habit) =>
    habit.id === id
      ? {
          ...habit,
          log: habit.log.includes(day)
            ? habit.log.filter((entry) => entry !== day)
            : [...habit.log, day].sort(),
        }
      : habit,
  ),
});

export const updateHabit = (state: PlannerState, id: string, patch: Partial<Habit>): PlannerState => ({
  ...state,
  habits: replace(state.habits, id, patch),
});

export const removeHabit = (state: PlannerState, id: string): PlannerState => ({
  ...state,
  habits: state.habits.filter((habit) => habit.id !== id),
});

export const restoreHabit = (state: PlannerState, habit: Habit): PlannerState => ({
  ...state,
  habits: [...state.habits, habit],
});

/* ---------------------------------------------------------------- goals -- */

export const addGoal = (state: PlannerState, goal: Omit<Goal, "id" | "createdAt">): PlannerState => ({
  ...state,
  goals: [...state.goals, { ...goal, id: createId("goal"), createdAt: stamp() }],
});

export const updateGoal = (state: PlannerState, id: string, patch: Partial<Goal>): PlannerState => ({
  ...state,
  goals: replace(state.goals, id, patch),
});

export const toggleMilestone = (state: PlannerState, goalId: string, milestoneId: string): PlannerState => ({
  ...state,
  goals: state.goals.map((goal) =>
    goal.id === goalId
      ? {
          ...goal,
          milestones: goal.milestones.map((milestone) =>
            milestone.id === milestoneId ? { ...milestone, done: !milestone.done } : milestone,
          ),
        }
      : goal,
  ),
});

export const addMilestone = (state: PlannerState, goalId: string, title: string): PlannerState => ({
  ...state,
  goals: state.goals.map((goal) =>
    goal.id === goalId
      ? { ...goal, milestones: [...goal.milestones, { id: createId("ms"), title, done: false }] }
      : goal,
  ),
});

export const removeGoal = (state: PlannerState, id: string): PlannerState => ({
  ...state,
  goals: state.goals.filter((goal) => goal.id !== id),
});

export const restoreGoal = (state: PlannerState, goal: Goal): PlannerState => ({
  ...state,
  goals: [...state.goals, goal],
});

/* ---------------------------------------------------------------- notes -- */

export const addNote = (state: PlannerState, note?: Partial<Note>): PlannerState => ({
  ...state,
  notes: [
    {
      id: createId("note"),
      title: note?.title ?? "",
      body: note?.body ?? "",
      pinned: false,
      createdAt: stamp(),
      updatedAt: stamp(),
    },
    ...state.notes,
  ],
});

export const updateNote = (state: PlannerState, id: string, patch: Partial<Note>): PlannerState => ({
  ...state,
  notes: replace(state.notes, id, { ...patch, updatedAt: stamp() }),
});

export const removeNote = (state: PlannerState, id: string): PlannerState => ({
  ...state,
  notes: state.notes.filter((note) => note.id !== id),
});

export const restoreNote = (state: PlannerState, note: Note): PlannerState => ({
  ...state,
  notes: [note, ...state.notes],
});

/* -------------------------------------------------------------- journal -- */

export function upsertJournal(
  state: PlannerState,
  date: string,
  patch: Partial<Pick<JournalEntry, "mood" | "gratitude" | "body">>,
): PlannerState {
  const existing = state.journal.find((entry) => entry.date === date);
  if (existing) {
    return {
      ...state,
      journal: state.journal.map((entry) =>
        entry.date === date ? { ...entry, ...patch, updatedAt: stamp() } : entry,
      ),
    };
  }
  const entry: JournalEntry = {
    id: createId("journal"),
    date,
    mood: (patch.mood as Mood | null) ?? null,
    gratitude: patch.gratitude ?? "",
    body: patch.body ?? "",
    updatedAt: stamp(),
  };
  return { ...state, journal: [...state.journal, entry] };
}

export function upsertReflection(
  state: PlannerState,
  period: string,
  scope: Reflection["scope"],
  patch: Partial<Pick<Reflection, "wins" | "lessons" | "intention">>,
): PlannerState {
  const existing = state.reflections.find((item) => item.period === period);
  if (existing) {
    return {
      ...state,
      reflections: state.reflections.map((item) =>
        item.period === period ? { ...item, ...patch, updatedAt: stamp() } : item,
      ),
    };
  }
  return {
    ...state,
    reflections: [
      ...state.reflections,
      {
        id: createId("ref"),
        period,
        scope,
        wins: patch.wins ?? "",
        lessons: patch.lessons ?? "",
        intention: patch.intention ?? "",
        updatedAt: stamp(),
      },
    ],
  };
}

/* -------------------------------------------------------------- kitchen -- */

/** One meal per day: writing over a day replaces it, clearing it removes it. */
export function setMeal(state: PlannerState, date: string, title: string): PlannerState {
  const trimmed = title.trim();
  const existing = state.meals.find((meal) => meal.date === date);

  if (!trimmed) {
    return { ...state, meals: state.meals.filter((meal) => meal.date !== date) };
  }
  if (existing) {
    return {
      ...state,
      meals: state.meals.map((meal) =>
        meal.date === date ? { ...meal, title: trimmed, updatedAt: stamp() } : meal,
      ),
    };
  }
  return {
    ...state,
    meals: [
      ...state.meals,
      { id: createId("meal"), date, title: trimmed, note: "", updatedAt: stamp() },
    ],
  };
}

export const addShoppingItem = (
  state: PlannerState,
  item: Pick<ShoppingItem, "title" | "quantity" | "aisle">,
): PlannerState => ({
  ...state,
  shopping: [
    ...state.shopping,
    { ...item, id: createId("shop"), done: false, createdAt: stamp() },
  ],
});

export const updateShoppingItem = (
  state: PlannerState,
  id: string,
  patch: Partial<ShoppingItem>,
): PlannerState => ({ ...state, shopping: replace(state.shopping, id, patch) });

export const toggleShoppingItem = (state: PlannerState, id: string): PlannerState => ({
  ...state,
  shopping: state.shopping.map((item) =>
    item.id === id ? { ...item, done: !item.done } : item,
  ),
});

export const removeShoppingItem = (state: PlannerState, id: string): PlannerState => ({
  ...state,
  shopping: state.shopping.filter((item) => item.id !== id),
});

export const restoreShoppingItems = (state: PlannerState, items: ShoppingItem[]): PlannerState => ({
  ...state,
  shopping: [...state.shopping, ...items],
});

export const clearTickedShopping = (state: PlannerState): PlannerState => ({
  ...state,
  shopping: state.shopping.filter((item) => !item.done),
});

/* ------------------------------------------------------------- settings -- */

export const updateSettings = (state: PlannerState, patch: Partial<Settings>): PlannerState => ({
  ...state,
  settings: { ...state.settings, ...patch },
});
