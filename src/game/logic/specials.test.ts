import { describe, expect, it } from 'vitest';
import {
  analyzeMatchShapes,
  applyGravityToSpecials,
  cellsForSpecial,
  clearSpecialsAt,
  createEmptySpecialBoard,
  expandWithSpecials,
  placeSpecials,
  swapSpecials,
} from './specials';
import { SpecialKind, TileType, type Grid, type SpecialBoard, type SpecialTile } from './types';

describe('createEmptySpecialBoard', () => {
  it('creates a board of the given size, all null', () => {
    const board = createEmptySpecialBoard(3, 2);
    expect(board).toEqual([
      [null, null, null],
      [null, null, null],
    ]);
  });
});

describe('swapSpecials', () => {
  it('swaps the two cells and leaves the rest untouched', () => {
    const tile: SpecialTile = { kind: SpecialKind.Bomb, color: TileType.Red };
    const board: SpecialBoard = [
      [tile, null],
      [null, null],
    ];
    const swapped = swapSpecials(board, { row: 0, col: 0 }, { row: 0, col: 1 });
    expect(swapped).toEqual([
      [null, tile],
      [null, null],
    ]);
  });
});

describe('applyGravityToSpecials', () => {
  it('moves specials down alongside their surviving tiles', () => {
    const beforeGravity: Grid = [
      [null],
      [TileType.Red],
      [null],
      [TileType.Blue],
    ];
    const tile: SpecialTile = { kind: SpecialKind.RowClear, color: TileType.Red };
    const specials: SpecialBoard = [[null], [tile], [null], [null]];
    const result = applyGravityToSpecials(beforeGravity, specials);
    // Column has 2 survivors (rows 1 and 3), dropped to the bottom (rows 2,3) in order.
    expect(result).toEqual([[null], [null], [tile], [null]]);
  });
});

describe('clearSpecialsAt', () => {
  it('nulls out only the given positions', () => {
    const tile: SpecialTile = { kind: SpecialKind.Bomb, color: TileType.Green };
    const board: SpecialBoard = [[tile, tile]];
    const result = clearSpecialsAt(board, new Set(['0,0']));
    expect(result).toEqual([[null, tile]]);
  });
});

describe('placeSpecials', () => {
  it('sets the given positions to their spawned tile', () => {
    const board = createEmptySpecialBoard(2, 1);
    const tile: SpecialTile = { kind: SpecialKind.ColClear, color: TileType.Yellow };
    const result = placeSpecials(board, [{ position: { row: 0, col: 1 }, tile }]);
    expect(result).toEqual([[null, tile]]);
  });
});

describe('cellsForSpecial', () => {
  const grid: Grid = [
    [TileType.Red, TileType.Blue, TileType.Red],
    [TileType.Green, TileType.Red, TileType.Yellow],
    [TileType.Red, TileType.Purple, TileType.Red],
  ];

  it('RowClear returns the whole row', () => {
    const tile: SpecialTile = { kind: SpecialKind.RowClear, color: TileType.Red };
    const cells = cellsForSpecial(grid, tile, 1, 1);
    expect(cells).toEqual([
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
    ]);
  });

  it('ColClear returns the whole column', () => {
    const tile: SpecialTile = { kind: SpecialKind.ColClear, color: TileType.Red };
    const cells = cellsForSpecial(grid, tile, 1, 1);
    expect(cells).toEqual([
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 2, col: 1 },
    ]);
  });

  it('Bomb returns the clamped 3x3 area around it', () => {
    const tile: SpecialTile = { kind: SpecialKind.Bomb, color: TileType.Red };
    const cells = cellsForSpecial(grid, tile, 0, 0);
    expect(cells).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ]);
  });

  it('ColorClear returns every cell matching its stored color', () => {
    const tile: SpecialTile = { kind: SpecialKind.ColorClear, color: TileType.Red };
    const cells = cellsForSpecial(grid, tile, 1, 1);
    expect(cells).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      { row: 1, col: 1 },
      { row: 2, col: 0 },
      { row: 2, col: 2 },
    ]);
  });
});

describe('expandWithSpecials', () => {
  it('returns just the seed when none of it is special', () => {
    const grid: Grid = [[TileType.Red, TileType.Blue]];
    const specials = createEmptySpecialBoard(2, 1);
    const result = expandWithSpecials(grid, specials, new Set(['0,0']));
    expect(result).toEqual(new Set(['0,0']));
  });

  it('activates a special found in the seed, adding its cleared cells', () => {
    const grid: Grid = [[TileType.Red, TileType.Blue, TileType.Green]];
    let specials = createEmptySpecialBoard(3, 1);
    specials = placeSpecials(specials, [
      { position: { row: 0, col: 0 }, tile: { kind: SpecialKind.RowClear, color: TileType.Red } },
    ]);
    const result = expandWithSpecials(grid, specials, new Set(['0,0']));
    expect(result).toEqual(new Set(['0,0', '0,1', '0,2']));
  });

  it('chains: activating one special can reveal and trigger another', () => {
    // Row-clear at (0,0) sweeps row 0, which includes a col-clear at (0,2),
    // which in turn sweeps column 2 (including row 1).
    const grid: Grid = [
      [TileType.Red, TileType.Blue, TileType.Green],
      [TileType.Yellow, TileType.Purple, TileType.Red],
    ];
    let specials = createEmptySpecialBoard(3, 2);
    specials = placeSpecials(specials, [
      { position: { row: 0, col: 0 }, tile: { kind: SpecialKind.RowClear, color: TileType.Red } },
      { position: { row: 0, col: 2 }, tile: { kind: SpecialKind.ColClear, color: TileType.Green } },
    ]);
    const result = expandWithSpecials(grid, specials, new Set(['0,0']));
    expect(result).toEqual(new Set(['0,0', '0,1', '0,2', '1,2']));
  });
});

describe('analyzeMatchShapes', () => {
  it('spawns a RowClear for a 4-in-a-row horizontal match, at the swap position', () => {
    const grid: Grid = [[TileType.Red, TileType.Red, TileType.Red, TileType.Red, TileType.Blue]];
    const matched = new Set(['0,0', '0,1', '0,2', '0,3']);
    const swapPositions: [import('./types').Position, import('./types').Position] = [
      { row: 0, col: 2 },
      { row: 5, col: 5 },
    ];
    const { spawns, keepPositions } = analyzeMatchShapes(grid, matched, swapPositions);
    expect(spawns).toEqual([{ position: { row: 0, col: 2 }, tile: { kind: SpecialKind.RowClear, color: TileType.Red } }]);
    expect(keepPositions).toEqual(new Set(['0,2']));
  });

  it('spawns a ColClear for a 4-in-a-row vertical match', () => {
    const grid: Grid = [[TileType.Red], [TileType.Red], [TileType.Red], [TileType.Red]];
    const matched = new Set(['0,0', '1,0', '2,0', '3,0']);
    const { spawns } = analyzeMatchShapes(grid, matched, null);
    expect(spawns).toEqual([{ position: { row: 2, col: 0 }, tile: { kind: SpecialKind.ColClear, color: TileType.Red } }]);
  });

  it('does not spawn anything for a plain 3-match', () => {
    const grid: Grid = [[TileType.Red, TileType.Red, TileType.Red]];
    const matched = new Set(['0,0', '0,1', '0,2']);
    const { spawns, keepPositions } = analyzeMatchShapes(grid, matched, null);
    expect(spawns).toEqual([]);
    expect(keepPositions.size).toBe(0);
  });

  it('falls back to the run center when neither swap position is part of the run', () => {
    const grid: Grid = [[TileType.Red, TileType.Red, TileType.Red, TileType.Red]];
    const matched = new Set(['0,0', '0,1', '0,2', '0,3']);
    const { spawns } = analyzeMatchShapes(grid, matched, [
      { row: 5, col: 5 },
      { row: 6, col: 6 },
    ]);
    expect(spawns[0].position).toEqual({ row: 0, col: 2 });
  });

  it('spawns a Bomb at the intersection of an L/T shaped match', () => {
    // Horizontal run row1 (cols 0-2) crosses vertical run col1 (rows 0-2) at (1,1).
    const R = TileType.Red;
    const B = TileType.Blue;
    const grid: Grid = [
      [B, R, B],
      [R, R, R],
      [B, R, B],
    ];
    const matched = new Set(['1,0', '1,1', '1,2', '0,1', '2,1']);
    const { spawns, keepPositions } = analyzeMatchShapes(grid, matched, null);
    expect(spawns).toEqual([{ position: { row: 1, col: 1 }, tile: { kind: SpecialKind.Bomb, color: TileType.Red } }]);
    expect(keepPositions).toEqual(new Set(['1,1']));
  });

  it('an L/T intersection takes priority over treating either arm as a plain 4-match', () => {
    // Horizontal run row1 (cols 0-3, length 4) crosses vertical run col1 (rows 0-2) at (1,1).
    const R = TileType.Red;
    const B = TileType.Blue;
    const grid: Grid = [
      [B, R, B, B],
      [R, R, R, R],
      [B, R, B, B],
    ];
    const matched = new Set(['1,0', '1,1', '1,2', '1,3', '0,1', '2,1']);
    const { spawns } = analyzeMatchShapes(grid, matched, null);
    expect(spawns).toHaveLength(1);
    expect(spawns[0].tile.kind).toBe(SpecialKind.Bomb);
  });
});
