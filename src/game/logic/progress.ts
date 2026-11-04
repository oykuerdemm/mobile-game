const STORAGE_KEY = 'match3-progress';

/** Minimal structural subset of the Web Storage API, so this is testable without a real browser. */
export interface ProgressStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Highest level id the player is allowed to play (level 1 is always unlocked). */
export function loadUnlockedLevel(storage: ProgressStorage): number {
  const raw = storage.getItem(STORAGE_KEY);
  const parsed = raw !== null ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

/** Call once a level is won: unlocks the next level if it isn't already unlocked. */
export function markLevelCompleted(storage: ProgressStorage, levelId: number): void {
  const unlocked = loadUnlockedLevel(storage);
  const next = Math.max(unlocked, levelId + 1);
  storage.setItem(STORAGE_KEY, String(next));
}
