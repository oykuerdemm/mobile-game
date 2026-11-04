import { describe, expect, it } from 'vitest';
import { areAdjacent, createEmptyGrid, findMatches, generateBoard, isValidSwap, swapTiles } from './board';
import { mulberry32 } from './rng';
import { TILE_TYPES, TileType, type Grid } from './types';

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

describe('generateBoard', () => {
  it('fills every cell with a valid tile type', () => {
    const grid = generateBoard(8, 8, mulberry32(1));
    expect(grid.length).toBe(8);
    for (const row of grid) {
      expect(row.length).toBe(8);
      for (const cell of row) {
        expect(TILE_TYPES).toContain(cell);
      }
    }
  });

  it('is deterministic for a given seed', () => {
    const a = generateBoard(8, 8, mulberry32(42));
    const b = generateBoard(8, 8, mulberry32(42));
    expect(a).toEqual(b);
  });

  it('never contains a pre-existing 3+ match, across many seeds', () => {
    for (let seed = 0; seed < 200; seed++) {
      const grid = generateBoard(8, 8, mulberry32(seed));
      expect(findMatches(grid).size).toBe(0);
    }
  });
});

describe('findMatches', () => {
  function gridFrom(rows: TileType[][]): Grid {
    return rows;
  }

  it('finds a horizontal run of 3', () => {
    const grid = gridFrom([
      [TileType.Red, TileType.Red, TileType.Red, TileType.Blue],
      [TileType.Blue, TileType.Green, TileType.Yellow, TileType.Purple],
    ]);
    const matches = findMatches(grid);
    expect(matches).toEqual(new Set(['0,0', '0,1', '0,2']));
  });

  it('finds a vertical run of 3', () => {
    const grid = gridFrom([
      [TileType.Red, TileType.Blue],
      [TileType.Red, TileType.Green],
      [TileType.Red, TileType.Yellow],
    ]);
    const matches = findMatches(grid);
    expect(matches).toEqual(new Set(['0,0', '1,0', '2,0']));
  });

  it('finds an L-shaped overlap of horizontal and vertical runs', () => {
    const grid = gridFrom([
      [TileType.Red, TileType.Red, TileType.Red],
      [TileType.Red, TileType.Blue, TileType.Green],
      [TileType.Red, TileType.Yellow, TileType.Purple],
    ]);
    const matches = findMatches(grid);
    expect(matches).toEqual(new Set(['0,0', '0,1', '0,2', '1,0', '2,0']));
  });

  it('returns an empty set when there are no matches', () => {
    const grid = gridFrom([
      [TileType.Red, TileType.Blue, TileType.Green],
      [TileType.Blue, TileType.Green, TileType.Red],
      [TileType.Green, TileType.Red, TileType.Blue],
    ]);
    expect(findMatches(grid).size).toBe(0);
  });

  it('does not match a run of only 2', () => {
    const grid = gridFrom([[TileType.Red, TileType.Red, TileType.Blue]]);
    expect(findMatches(grid).size).toBe(0);
  });
});

describe('swapTiles', () => {
  it('swaps the two cells and leaves the rest untouched', () => {
    const grid: Grid = [
      [TileType.Red, TileType.Blue],
      [TileType.Green, TileType.Yellow],
    ];
    const swapped = swapTiles(grid, { row: 0, col: 0 }, { row: 0, col: 1 });
    expect(swapped).toEqual([
      [TileType.Blue, TileType.Red],
      [TileType.Green, TileType.Yellow],
    ]);
  });

  it('does not mutate the original grid', () => {
    const grid: Grid = [[TileType.Red, TileType.Blue]];
    const original = grid.map((row) => row.slice());
    swapTiles(grid, { row: 0, col: 0 }, { row: 0, col: 1 });
    expect(grid).toEqual(original);
  });
});

describe('isValidSwap', () => {
  it('is true when the swap completes a 3+ run', () => {
    const grid: Grid = [
      [TileType.Red, TileType.Red, TileType.Blue],
      [TileType.Green, TileType.Yellow, TileType.Red],
    ];
    expect(isValidSwap(grid, { row: 0, col: 2 }, { row: 1, col: 2 })).toBe(true);
  });

  it('is false when the swap creates no match', () => {
    const grid: Grid = [
      [TileType.Red, TileType.Blue, TileType.Green],
      [TileType.Blue, TileType.Green, TileType.Red],
    ];
    expect(isValidSwap(grid, { row: 0, col: 0 }, { row: 0, col: 1 })).toBe(false);
  });

  it('is false for non-adjacent positions even if it would create a match', () => {
    const grid: Grid = [[TileType.Red, TileType.Red, TileType.Blue, TileType.Red]];
    expect(isValidSwap(grid, { row: 0, col: 0 }, { row: 0, col: 3 })).toBe(false);
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
