import type { PlannerState, Tombstones } from "@/types";

/**
 * Merging two copies of the planner.
 *
 * Sync here is last-writer-wins *per record*, not per document: if the phone
 * added a task while the laptop ticked a habit, both survive. Three rules:
 *
 *   1. Records are matched by id and the newer `updatedAt` wins.
 *   2. A record is dropped when either side buried it *after* its last edit —
 *      that is what stops a deleted task reappearing from the other device.
 *   3. Settings are a single small object, so the newer document wins outright.
 */

type Identified = { id: string; updatedAt?: string; createdAt?: string };

const timeOf = (record: Identified) => record.updatedAt ?? record.createdAt ?? "";

function mergeCollection<T extends Identified>(
  local: T[],
  remote: T[],
  tombstones: Tombstones,
): T[] {
  const merged = new Map<string, T>();

  for (const record of [...local, ...remote]) {
    const existing = merged.get(record.id);
    if (!existing || timeOf(record) > timeOf(existing)) merged.set(record.id, record);
  }

  return [...merged.values()].filter((record) => {
    const buriedAt = tombstones[record.id];
    // A record edited after it was deleted is a deliberate restore — keep it.
    return !buriedAt || timeOf(record) > buriedAt;
  });
}

/** Keyed collections (journal by day, reflections by period) have no stable id. */
function mergeKeyed<T extends { updatedAt: string }>(
  local: T[],
  remote: T[],
  keyOf: (record: T) => string,
): T[] {
  const merged = new Map<string, T>();
  for (const record of [...local, ...remote]) {
    const existing = merged.get(keyOf(record));
    if (!existing || record.updatedAt > existing.updatedAt) merged.set(keyOf(record), record);
  }
  return [...merged.values()];
}

function mergeTombstones(local: Tombstones, remote: Tombstones): Tombstones {
  const merged: Tombstones = { ...remote };
  for (const [id, at] of Object.entries(local)) {
    if (!merged[id] || at > merged[id]) merged[id] = at;
  }
  return merged;
}

/**
 * Tombstones are kept for a season and then forgotten — long enough for every
 * device to have seen the deletion, short enough that the document stays small.
 */
const TOMBSTONE_TTL_DAYS = 90;

function pruneTombstones(tombstones: Tombstones): Tombstones {
  const cutoff = new Date(Date.now() - TOMBSTONE_TTL_DAYS * 86_400_000).toISOString();
  return Object.fromEntries(Object.entries(tombstones).filter(([, at]) => at > cutoff));
}

export function mergeStates(local: PlannerState, remote: PlannerState): PlannerState {
  const tombstones = mergeTombstones(local.tombstones ?? {}, remote.tombstones ?? {});
  const newerDocument = (remote.updatedAt ?? "") > (local.updatedAt ?? "") ? remote : local;

  return {
    version: Math.max(local.version, remote.version),
    revision: Math.max(local.revision ?? 0, remote.revision ?? 0) + 1,
    updatedAt: new Date().toISOString(),
    tombstones: pruneTombstones(tombstones),

    tasks: mergeCollection(local.tasks, remote.tasks, tombstones),
    categories: mergeCollection(local.categories, remote.categories, tombstones),
    habits: mergeCollection(local.habits, remote.habits, tombstones),
    goals: mergeCollection(local.goals, remote.goals, tombstones),
    notes: mergeCollection(local.notes, remote.notes, tombstones),
    meals: mergeKeyed(local.meals, remote.meals, (meal) => meal.date),
    shopping: mergeCollection(local.shopping, remote.shopping, tombstones),
    journal: mergeKeyed(local.journal, remote.journal, (entry) => entry.date),
    reflections: mergeKeyed(local.reflections, remote.reflections, (item) => item.period),

    // One small object of preferences: no point splitting it field by field.
    settings: newerDocument.settings,
  };
}
