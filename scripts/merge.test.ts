/**
 * Sync merge tests. Run with: npm run test:merge
 *
 * These cover the cases that would quietly lose her data: a record edited on two
 * devices, a record deleted on one device and untouched on the other, and a
 * deletion that must not resurrect the record on the next sync.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { mergeStates } from "../src/lib/store/merge.ts";

const at = (iso: string) => new Date(iso).toISOString();

function baseState(overrides = {}) {
  return {
    version: 1,
    revision: 1,
    updatedAt: at("2026-07-01T10:00:00Z"),
    tombstones: {},
    tasks: [],
    categories: [],
    habits: [],
    goals: [],
    notes: [],
    journal: [],
    reflections: [],
    meals: [],
    shopping: [],
    settings: { name: "Faeez", theme: "light" },
    ...overrides,
  } as never;
}

const task = (id: string, title: string, updatedAt: string) => ({
  id,
  title,
  description: "",
  notes: "",
  priority: "medium",
  categoryId: "personal",
  date: "2026-07-24",
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
  createdAt: at("2026-07-01T09:00:00Z"),
  updatedAt: at(updatedAt),
});

test("keeps records that only exist on one side", () => {
  const local = baseState({ tasks: [task("a", "Phone task", "2026-07-24T10:00:00Z")] });
  const remote = baseState({ tasks: [task("b", "Laptop task", "2026-07-24T11:00:00Z")] });

  const merged = mergeStates(local, remote);
  assert.deepEqual(
    merged.tasks.map((item) => item.id).sort(),
    ["a", "b"],
  );
});

test("the newer edit of the same record wins", () => {
  const local = baseState({ tasks: [task("a", "Old title", "2026-07-24T10:00:00Z")] });
  const remote = baseState({ tasks: [task("a", "New title", "2026-07-24T12:00:00Z")] });

  assert.equal(mergeStates(local, remote).tasks[0].title, "New title");
  assert.equal(mergeStates(remote, local).tasks[0].title, "New title");
});

test("a deletion on one device removes the record from the other", () => {
  const local = baseState({ tombstones: { a: at("2026-07-24T12:00:00Z") } });
  const remote = baseState({ tasks: [task("a", "Deleted on the phone", "2026-07-24T10:00:00Z")] });

  assert.equal(mergeStates(local, remote).tasks.length, 0);
});

test("an edit made after the deletion is treated as a deliberate restore", () => {
  const local = baseState({ tombstones: { a: at("2026-07-24T10:00:00Z") } });
  const remote = baseState({ tasks: [task("a", "Brought back", "2026-07-24T13:00:00Z")] });

  const merged = mergeStates(local, remote);
  assert.equal(merged.tasks.length, 1);
  assert.equal(merged.tasks[0].title, "Brought back");
});

test("deleting stays deleted across repeated syncs", () => {
  const withRecord = baseState({ tasks: [task("a", "Gone", "2026-07-24T10:00:00Z")] });
  const afterDelete = baseState({ tombstones: { a: at("2026-07-24T11:00:00Z") } });

  const first = mergeStates(afterDelete, withRecord);
  const second = mergeStates(first, withRecord);

  assert.equal(first.tasks.length, 0);
  assert.equal(second.tasks.length, 0, "the record must not come back on the next sync");
});

test("meals and journal entries merge by their day, not by id", () => {
  const local = baseState({
    meals: [{ id: "m1", date: "2026-07-24", title: "Pasta", note: "", updatedAt: at("2026-07-24T10:00:00Z") }],
  });
  const remote = baseState({
    meals: [{ id: "m2", date: "2026-07-24", title: "Curry", note: "", updatedAt: at("2026-07-24T12:00:00Z") }],
  });

  const merged = mergeStates(local, remote);
  assert.equal(merged.meals.length, 1, "one meal per day");
  assert.equal(merged.meals[0].title, "Curry");
});

test("settings follow the document that was written most recently", () => {
  const local = baseState({
    updatedAt: at("2026-07-24T10:00:00Z"),
    settings: { name: "Old", theme: "light" },
  });
  const remote = baseState({
    updatedAt: at("2026-07-24T12:00:00Z"),
    settings: { name: "New", theme: "dark" },
  });

  assert.equal(mergeStates(local, remote).settings.name, "New");
});

test("old tombstones are pruned so the document does not grow forever", () => {
  const ancient = new Date(Date.now() - 200 * 86_400_000).toISOString();
  const recent = new Date(Date.now() - 2 * 86_400_000).toISOString();
  const local = baseState({ tombstones: { old: ancient, fresh: recent } });

  const merged = mergeStates(local, baseState());
  assert.equal(merged.tombstones.old, undefined);
  assert.equal(merged.tombstones.fresh, recent);
});
