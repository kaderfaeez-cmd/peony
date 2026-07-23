"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { PlannerState, Task, TaskDraft } from "@/types";
import * as A from "./actions";
import { emptyState } from "./initial";
import { LocalStorageRepository, type PlannerRepository } from "./repository";

type Listener = () => void;

/** One frozen snapshot for the server render — must be referentially stable. */
const SERVER_STATE = emptyState();

function createStore(initial: PlannerState) {
  let state = initial;
  const listeners = new Set<Listener>();

  return {
    get: () => state,
    set(next: PlannerState) {
      state = next;
      listeners.forEach((listener) => listener());
    },
    update(recipe: (current: PlannerState) => PlannerState) {
      this.set(recipe(state));
    },
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

type Store = ReturnType<typeof createStore>;

interface PlannerContextValue {
  store: Store;
  hydrated: boolean;
  actions: ReturnType<typeof buildActions>;
}

const PlannerContext = createContext<PlannerContextValue | null>(null);

function buildActions(store: Store) {
  const find = <T,>(pick: (state: PlannerState) => T) => pick(store.get());

  return {
    /* tasks */
    createTask(draft: TaskDraft) {
      const siblings = store
        .get()
        .tasks.filter((task) => task.date === (draft.date ?? null) && task.dayPart === draft.dayPart);
      const task = A.buildTask(draft, siblings.length);
      store.update((state) => A.addTask(state, task));
      return task;
    },
    updateTask: (id: string, patch: Partial<Task>) => store.update((s) => A.updateTask(s, id, patch)),
    toggleTask: (id: string) => store.update((s) => A.toggleTask(s, id)),
    deleteTask(id: string) {
      const removed = find((s) => s.tasks.find((task) => task.id === id));
      store.update((s) => A.removeTask(s, id));
      return removed ?? null;
    },
    restoreTask: (task: Task) => store.update((s) => A.restoreTask(s, task)),
    archiveTask: (id: string, archived: boolean) => store.update((s) => A.archiveTask(s, id, archived)),
    reorderTasks: (ids: string[]) => store.update((s) => A.reorderTasks(s, ids)),
    addSubtask: (taskId: string, title: string) => store.update((s) => A.addSubtask(s, taskId, title)),
    toggleSubtask: (taskId: string, subId: string) =>
      store.update((s) => A.toggleSubtask(s, taskId, subId)),
    removeSubtask: (taskId: string, subId: string) =>
      store.update((s) => A.removeSubtask(s, taskId, subId)),

    /* categories */
    addCategory: (name: string, tone: Parameters<typeof A.addCategory>[2]) =>
      store.update((s) => A.addCategory(s, name, tone)),
    removeCategory: (id: string) => store.update((s) => A.removeCategory(s, id)),

    /* habits */
    addHabit: (name: string, icon: string, target: number) =>
      store.update((s) => A.addHabit(s, name, icon, target)),
    toggleHabitDay: (id: string, day: string) => store.update((s) => A.toggleHabitDay(s, id, day)),
    updateHabit: (id: string, patch: Parameters<typeof A.updateHabit>[2]) =>
      store.update((s) => A.updateHabit(s, id, patch)),
    deleteHabit(id: string) {
      const removed = find((s) => s.habits.find((habit) => habit.id === id));
      store.update((s) => A.removeHabit(s, id));
      return removed ?? null;
    },
    restoreHabit: (habit: Parameters<typeof A.restoreHabit>[1]) =>
      store.update((s) => A.restoreHabit(s, habit)),

    /* goals */
    addGoal: (goal: Parameters<typeof A.addGoal>[1]) => store.update((s) => A.addGoal(s, goal)),
    updateGoal: (id: string, patch: Parameters<typeof A.updateGoal>[2]) =>
      store.update((s) => A.updateGoal(s, id, patch)),
    toggleMilestone: (goalId: string, milestoneId: string) =>
      store.update((s) => A.toggleMilestone(s, goalId, milestoneId)),
    addMilestone: (goalId: string, title: string) => store.update((s) => A.addMilestone(s, goalId, title)),
    deleteGoal(id: string) {
      const removed = find((s) => s.goals.find((goal) => goal.id === id));
      store.update((s) => A.removeGoal(s, id));
      return removed ?? null;
    },
    restoreGoal: (goal: Parameters<typeof A.restoreGoal>[1]) => store.update((s) => A.restoreGoal(s, goal)),

    /* notes */
    addNote: (note?: Parameters<typeof A.addNote>[1]) => store.update((s) => A.addNote(s, note)),
    updateNote: (id: string, patch: Parameters<typeof A.updateNote>[2]) =>
      store.update((s) => A.updateNote(s, id, patch)),
    deleteNote(id: string) {
      const removed = find((s) => s.notes.find((note) => note.id === id));
      store.update((s) => A.removeNote(s, id));
      return removed ?? null;
    },
    restoreNote: (note: Parameters<typeof A.restoreNote>[1]) => store.update((s) => A.restoreNote(s, note)),

    /* journal + reflections */
    saveJournal: (date: string, patch: Parameters<typeof A.upsertJournal>[2]) =>
      store.update((s) => A.upsertJournal(s, date, patch)),
    saveReflection: (
      period: string,
      scope: Parameters<typeof A.upsertReflection>[2],
      patch: Parameters<typeof A.upsertReflection>[3],
    ) => store.update((s) => A.upsertReflection(s, period, scope, patch)),

    /* settings + data */
    updateSettings: (patch: Parameters<typeof A.updateSettings>[1]) =>
      store.update((s) => A.updateSettings(s, patch)),
    replaceAll: (next: PlannerState) => store.set(next),
  };
}

export function PlannerProvider({
  children,
  repository,
}: {
  children: ReactNode;
  repository?: PlannerRepository;
}) {
  // Lazy state, not refs: both are created exactly once, without touching a ref
  // during render.
  const [store] = useState(() => createStore(emptyState()));
  const [dataSource] = useState<PlannerRepository>(() => repository ?? new LocalStorageRepository());

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    dataSource.load().then((loaded) => {
      if (cancelled) return;
      if (loaded) store.set(loaded);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [store, dataSource]);

  // Persist after the burst of updates settles rather than on every keystroke.
  useEffect(() => {
    if (!hydrated) return;
    let frame: ReturnType<typeof setTimeout>;
    const unsubscribe = store.subscribe(() => {
      clearTimeout(frame);
      frame = setTimeout(() => void dataSource.save(store.get()), 220);
    });
    return () => {
      clearTimeout(frame);
      unsubscribe();
    };
  }, [hydrated, store, dataSource]);

  const actions = useMemo(() => buildActions(store), [store]);
  const value = useMemo(() => ({ store, hydrated, actions }), [store, hydrated, actions]);

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

function usePlannerContext() {
  const context = useContext(PlannerContext);
  if (!context) throw new Error("usePlanner must be used inside <PlannerProvider>");
  return context;
}

/** Subscribe to a slice. Components only re-render when their slice changes. */
export function usePlannerSelector<T>(selector: (state: PlannerState) => T): T {
  const { store } = usePlannerContext();
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(SERVER_STATE),
  );
}

export function usePlanner() {
  const { actions, hydrated } = usePlannerContext();
  const state = usePlannerSelector((current) => current);
  return { state, actions, hydrated };
}

export function useActions() {
  return usePlannerContext().actions;
}

export function useHydrated() {
  return usePlannerContext().hydrated;
}

export function useSettings() {
  return usePlannerSelector((state) => state.settings);
}
