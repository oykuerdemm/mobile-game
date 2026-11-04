import { describe, expect, it } from 'vitest';
import { getLevelById, LEVELS } from './levels';
import { TILE_TYPES } from './types';

describe('LEVELS', () => {
  it('loads exactly 10 levels with unique, sequential ids starting at 1', () => {
    expect(LEVELS).toHaveLength(10);
    expect(LEVELS.map((level) => level.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('gives every level a positive move limit and a valid goal', () => {
    for (const level of LEVELS) {
      expect(level.moveLimit).toBeGreaterThan(0);
      expect(level.goal.count).toBeGreaterThan(0);
      expect(TILE_TYPES).toContain(level.goal.type);
    }
  });
});

describe('getLevelById', () => {
  it('finds a level by id', () => {
    expect(getLevelById(1)?.moveLimit).toBe(25);
  });

  it('returns undefined for an id that does not exist', () => {
    expect(getLevelById(999)).toBeUndefined();
  });
});
