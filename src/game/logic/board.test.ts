import { describe, expect, it } from 'vitest';
import { areAdjacent, createEmptyGrid, createRandomGrid } from './board';
import { mulberry32 } from './rng';
import { TILE_TYPES } from './types';

describe('createEmptyGrid', () => {
  it('creates a grid with the given dimensions, all cells null', () => {
    const grid = createEmptyGrid(8, 8);
    expect(grid.length).toBe(8);
    for (const row of grid) {
      expect(row.length).toBe(8);
      for (const cell of row) {
        expect(cell).toBeNull();
      }
    }
  });
});

describe('createRandomGrid', () => {
  it('fills every cell with a valid tile type', () => {
    const grid = createRandomGrid(8, 8, mulberry32(1));
    expect(grid.length).toBe(8);
    for (const row of grid) {
      expect(row.length).toBe(8);
      for (const cell of row) {
        expect(TILE_TYPES).toContain(cell);
      }
    }
  });

  it('is deterministic for a given seed', () => {
    const a = createRandomGrid(8, 8, mulberry32(42));
    const b = createRandomGrid(8, 8, mulberry32(42));
    expect(a).toEqual(b);
  });
});

describe('areAdjacent', () => {
  it('is true for horizontal and vertical neighbors', () => {
    expect(areAdjacent({ row: 2, col: 2 }, { row: 2, col: 3 })).toBe(true);
    expect(areAdjacent({ row: 2, col: 2 }, { row: 1, col: 2 })).toBe(true);
  });

  it('is false for diagonal or distant cells', () => {
    expect(areAdjacent({ row: 2, col: 2 }, { row: 3, col: 3 })).toBe(false);
    expect(areAdjacent({ row: 2, col: 2 }, { row: 2, col: 4 })).toBe(false);
    expect(areAdjacent({ row: 2, col: 2 }, { row: 2, col: 2 })).toBe(false);
  });
});
