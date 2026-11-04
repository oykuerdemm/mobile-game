import { describe, expect, it } from 'vitest';
import { loadUnlockedLevel, markLevelCompleted, type ProgressStorage } from './progress';

function createMemoryStorage(): ProgressStorage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

describe('loadUnlockedLevel', () => {
  it('defaults to 1 when nothing is stored', () => {
    expect(loadUnlockedLevel(createMemoryStorage())).toBe(1);
  });

  it('defaults to 1 for garbage stored values', () => {
    const storage = createMemoryStorage();
    storage.setItem('match3-progress', 'not-a-number');
    expect(loadUnlockedLevel(storage)).toBe(1);
  });

  it('reads back a previously stored value', () => {
    const storage = createMemoryStorage();
    storage.setItem('match3-progress', '4');
    expect(loadUnlockedLevel(storage)).toBe(4);
  });
});

describe('markLevelCompleted', () => {
  it('unlocks the next level', () => {
    const storage = createMemoryStorage();
    markLevelCompleted(storage, 1);
    expect(loadUnlockedLevel(storage)).toBe(2);
  });

  it('never moves progress backwards', () => {
    const storage = createMemoryStorage();
    markLevelCompleted(storage, 5);
    markLevelCompleted(storage, 1);
    expect(loadUnlockedLevel(storage)).toBe(6);
  });
});
