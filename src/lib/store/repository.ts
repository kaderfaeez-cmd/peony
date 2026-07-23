import type { PlannerState } from "@/types";
import { emptyState, seededState, STATE_VERSION } from "./initial";

/**
 * The only seam between the app and its storage.
 *
 * Swapping to Supabase later means writing a `SupabaseRepository` with these two
 * methods and passing it to `<PlannerProvider repository={...} />`. No component,
 * hook or reducer needs to change.
 */
export interface PlannerRepository {
  load(): Promise<PlannerState | null>;
  save(state: PlannerState): Promise<void>;
}

const STORAGE_KEY = "peony.planner.v1";

/** Fills in fields added by later versions without discarding the user's data. */
export function migrate(raw: unknown): PlannerState | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<PlannerState>;
  if (!Array.isArray(candidate.tasks)) return null;

  const base = emptyState();
  return {
    ...base,
    ...candidate,
    version: STATE_VERSION,
    categories: candidate.categories?.length ? candidate.categories : base.categories,
    settings: { ...base.settings, ...candidate.settings },
  } as PlannerState;
}

export class LocalStorageRepository implements PlannerRepository {
  async load(): Promise<PlannerState | null> {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const seeded = seededState();
        await this.save(seeded);
        return seeded;
      }
      return migrate(JSON.parse(raw));
    } catch {
      // A corrupted payload should never lock her out of her own planner.
      return emptyState();
    }
  }

  async save(state: PlannerState): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("[peony] could not persist state", error);
    }
  }
}

export const clearStorage = () => {
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
};
