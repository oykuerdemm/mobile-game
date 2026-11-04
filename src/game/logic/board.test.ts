import { describe, expect, it } from 'vitest';
import {
  applyGravity,
  areAdjacent,
  clearMatches,
  createEmptyGrid,
  findMatches,
  generateBoard,
  hasAvailableMove,
  isValidSwap,
  refill,
  resolveCascade,
  shuffleBoard,
  swapTiles,
} from './board';
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

describe('clearMatches', () => {
  it('nulls out only the matched cells', () => {
    const grid: Grid = [[TileType.Red, TileType.Red, TileType.Red, TileType.Blue]];
    const cleared = clearMatches(grid, new Set(['0,0', '0,1', '0,2']));
    expect(cleared).toEqual([[null, null, null, TileType.Blue]]);
  });
});

describe('applyGravity', () => {
  it('drops surviving tiles to the bottom of each column, preserving order', () => {
    const grid: Grid = [
      [TileType.Red, null],
      [null, TileType.Blue],
      [TileType.Green, null],
    ];
    const result = applyGravity(grid);
    expect(result).toEqual([
      [null, null],
      [TileType.Red, null],
      [TileType.Green, TileType.Blue],
    ]);
  });

  it('leaves a full column untouched', () => {
    const grid: Grid = [[TileType.Red], [TileType.Blue], [TileType.Green]];
    expect(applyGravity(grid)).toEqual(grid);
  });
});

describe('refill', () => {
  it('fills every null cell and leaves existing tiles untouched', () => {
    const grid: Grid = [
      [null, TileType.Blue],
      [TileType.Green, null],
    ];
    const filled = refill(grid, mulberry32(7));
    expect(filled[0][1]).toBe(TileType.Blue);
    expect(filled[1][0]).toBe(TileType.Green);
    expect(TILE_TYPES).toContain(filled[0][0]);
    expect(TILE_TYPES).toContain(filled[1][1]);
  });

  it('defaults to avoidMatchChance 0: can still place a tile that completes a match', () => {
    const grid: Grid = [[TileType.Red, TileType.Red, null]];
    let sawRed = false;
    for (let seed = 0; seed < 50 && !sawRed; seed++) {
      if (refill(grid, mulberry32(seed))[0][2] === TileType.Red) sawRed = true;
    }
    expect(sawRed).toBe(true);
  });

  it('with avoidMatchChance 1, excludes a type that would complete a match', () => {
    const grid: Grid = [[TileType.Red, TileType.Red, null]];
    for (let seed = 0; seed < 50; seed++) {
      expect(refill(grid, mulberry32(seed), 1)[0][2]).not.toBe(TileType.Red);
    }
  });

  it('with avoidMatchChance 1, never completes a match using already-placed neighbors', () => {
    for (let seed = 0; seed < 100; seed++) {
      // Simulate a post-gravity board: a match-free base with the top two rows
      // of every column emptied out, as if gravity had just cleared 16 tiles.
      const base = generateBoard(8, 8, mulberry32(seed));
      const postGravity = base.map((row) => row.slice());
      for (let col = 0; col < 8; col++) {
        postGravity[0][col] = null;
        postGravity[1][col] = null;
      }
      const filled = refill(postGravity, mulberry32(seed + 10000), 1);
      expect(findMatches(filled).size).toBe(0);
    }
  });
});

describe('hasAvailableMove', () => {
  it('is true when some swap would create a match', () => {
    const grid: Grid = [
      [TileType.Red, TileType.Red, TileType.Blue],
      [TileType.Green, TileType.Yellow, TileType.Red],
    ];
    expect(hasAvailableMove(grid)).toBe(true);
  });

  it('is false when the board is too small to ever match', () => {
    const grid: Grid = [
      [TileType.Red, TileType.Blue],
      [TileType.Green, TileType.Yellow],
    ];
    expect(hasAvailableMove(grid)).toBe(false);
  });
});

describe('shuffleBoard', () => {
  function tileCounts(grid: Grid): Map<TileType, number> {
    const counts = new Map<TileType, number>();
    for (const row of grid) {
      for (const cell of row) {
        if (cell !== null) counts.set(cell, (counts.get(cell) ?? 0) + 1);
      }
    }
    return counts;
  }

  it('preserves the multiset of tiles', () => {
    const grid = generateBoard(8, 8, mulberry32(5));
    const shuffled = shuffleBoard(grid, mulberry32(9));
    expect(tileCounts(shuffled)).toEqual(tileCounts(grid));
  });

  it('produces a board with no pre-existing matches and at least one available move', () => {
    const grid = generateBoard(8, 8, mulberry32(5));
    const shuffled = shuffleBoard(grid, mulberry32(11));
    expect(findMatches(shuffled).size).toBe(0);
    expect(hasAvailableMove(shuffled)).toBe(true);
  });
});

describe('resolveCascade', () => {
  it('resolves a single match in one pass', () => {
    const grid: Grid = [[TileType.Red, TileType.Red, TileType.Red, TileType.Blue]];
    const result = resolveCascade(grid, mulberry32(1));
    expect(result.passes).toBe(1);
    expect(findMatches(result.finalGrid).size).toBe(0);
  });

  it('returns 0 passes and the same grid when there is nothing to match', () => {
    const grid: Grid = [[TileType.Red, TileType.Blue, TileType.Green]];
    const result = resolveCascade(grid, mulberry32(1));
    expect(result.passes).toBe(0);
    expect(result.finalGrid).toEqual(grid);
  });

  it('chains: clearing a match can bring same-type survivors together in a later pass', () => {
    // Column 0 has A-A-A at the top and a lone B separated from a B-B pair by an X;
    // X is also part of a horizontal match in its row, so pass 1 clears both the
    // A's and the X. That lets the three B's in column 0 fall together — a genuine
    // second-pass match that did not exist in the original grid.
    const R = TileType.Red; // A
    const X = TileType.Blue; // separator, also matches horizontally
    const G = TileType.Green; // B
    const Y = TileType.Yellow;
    const P = TileType.Purple;

    const grid: Grid = [
      [R, Y, P],
      [R, P, Y],
      [R, Y, P],
      [G, P, Y],
      [X, X, X],
      [G, Y, P],
      [G, P, Y],
    ];

    const result = resolveCascade(grid, mulberry32(3));
    expect(result.passes).toBeGreaterThanOrEqual(2);
    expect(findMatches(result.finalGrid).size).toBe(0);
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
