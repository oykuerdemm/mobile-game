import { cellKey, markRuns } from './board';
import { SpecialKind, type Grid, type Position, type SpecialBoard, type SpecialCell, type SpecialTile, type TileType } from './types';

export function createEmptySpecialBoard(width: number, height: number): SpecialBoard {
  return Array.from({ length: height }, () => Array.from({ length: width }, (): SpecialCell => null));
}

export function cloneSpecialBoard(specials: SpecialBoard): SpecialBoard {
  return specials.map((row) => row.slice());
}

export function swapSpecials(specials: SpecialBoard, a: Position, b: Position): SpecialBoard {
  const next = cloneSpecialBoard(specials);
  const temp = next[a.row][a.col];
  next[a.row][a.col] = next[b.row][b.col];
  next[b.row][b.col] = temp;
  return next;
}

/** Mirrors applyGravity()'s column-compaction, using the pre-gravity grid to know which cells survived. */
export function applyGravityToSpecials(beforeGravityGrid: Grid, specials: SpecialBoard): SpecialBoard {
  const height = beforeGravityGrid.length;
  const width = beforeGravityGrid[0].length;
  const next = createEmptySpecialBoard(width, height);

  for (let col = 0; col < width; col++) {
    const survivors: SpecialCell[] = [];
    for (let row = 0; row < height; row++) {
      if (beforeGravityGrid[row][col] !== null) survivors.push(specials[row][col]);
    }
    const offset = height - survivors.length;
    for (let i = 0; i < survivors.length; i++) {
      next[offset + i][col] = survivors[i];
    }
  }
  return next;
}

/** Nulls out every position in `cleared` — used once those specials have activated or been swept away. */
export function clearSpecialsAt(specials: SpecialBoard, cleared: ReadonlySet<string>): SpecialBoard {
  const next = cloneSpecialBoard(specials);
  for (const key of cleared) {
    const [row, col] = key.split(',').map(Number);
    next[row][col] = null;
  }
  return next;
}

export interface SpecialSpawn {
  position: Position;
  tile: SpecialTile;
}

export function placeSpecials(specials: SpecialBoard, spawns: readonly SpecialSpawn[]): SpecialBoard {
  const next = cloneSpecialBoard(specials);
  for (const spawn of spawns) {
    next[spawn.position.row][spawn.position.col] = spawn.tile;
  }
  return next;
}

/** The extra cells (beyond itself) a special clears when activated. */
export function cellsForSpecial(grid: Grid, tile: SpecialTile, row: number, col: number): Position[] {
  const height = grid.length;
  const width = grid[0].length;
  const cells: Position[] = [];

  switch (tile.kind) {
    case SpecialKind.RowClear:
      for (let c = 0; c < width; c++) cells.push({ row, col: c });
      break;
    case SpecialKind.ColClear:
      for (let r = 0; r < height; r++) cells.push({ row: r, col });
      break;
    case SpecialKind.Bomb:
      for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
          if (r >= 0 && r < height && c >= 0 && c < width) cells.push({ row: r, col: c });
        }
      }
      break;
    case SpecialKind.ColorClear:
      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          if (grid[r][c] === tile.color) cells.push({ row: r, col: c });
        }
      }
      break;
  }
  return cells;
}

/**
 * Starting from `seed` cells, repeatedly activates any special tile found
 * among them, adding the cells it clears, until nothing new is added. Pure
 * chain-reaction: one special's blast can reveal and trigger another.
 */
export function expandWithSpecials(grid: Grid, specials: SpecialBoard, seed: ReadonlySet<string>): Set<string> {
  const result = new Set(seed);
  const queue = [...seed];

  while (queue.length > 0) {
    const key = queue.shift() as string;
    const [row, col] = key.split(',').map(Number);
    const tile = specials[row][col];
    if (!tile) continue;

    for (const pos of cellsForSpecial(grid, tile, row, col)) {
      const posKey = cellKey(pos.row, pos.col);
      if (!result.has(posKey)) {
        result.add(posKey);
        queue.push(posKey);
      }
    }
  }
  return result;
}

interface Run {
  orientation: 'horizontal' | 'vertical';
  color: TileType;
  cells: Position[];
}

function findRuns(grid: Grid): Run[] {
  const height = grid.length;
  const width = grid[0].length;
  const runs: Run[] = [];

  for (let row = 0; row < height; row++) {
    markRuns(grid[row], (start, end) => {
      const cells: Position[] = [];
      for (let col = start; col <= end; col++) cells.push({ row, col });
      runs.push({ orientation: 'horizontal', color: grid[row][start] as TileType, cells });
    });
  }

  for (let col = 0; col < width; col++) {
    const column = grid.map((r) => r[col]);
    markRuns(column, (start, end) => {
      const cells: Position[] = [];
      for (let row = start; row <= end; row++) cells.push({ row, col });
      runs.push({ orientation: 'vertical', color: grid[start][col] as TileType, cells });
    });
  }

  return runs;
}

function pickSpawnPosition(cells: Position[], swapPositions: readonly [Position, Position] | null): Position {
  if (swapPositions) {
    for (const swapPos of swapPositions) {
      const hit = cells.find((c) => c.row === swapPos.row && c.col === swapPos.col);
      if (hit) return hit;
    }
  }
  return cells[Math.floor(cells.length / 2)];
}

export interface MatchShapeAnalysis {
  spawns: SpecialSpawn[];
  /** Matched positions that should NOT be cleared because they become a new special instead. */
  keepPositions: Set<string>;
}

function sharedCell(a: Run, b: Run): Position | undefined {
  return a.cells.find((ac) => b.cells.some((bc) => bc.row === ac.row && bc.col === ac.col));
}

/**
 * Looks at the runs that make up `matched` and decides whether any of them
 * form a shape that spawns a special tile:
 * - an L/T (a horizontal and a vertical run of 3+ sharing one cell) spawns a
 *   Bomb at the intersection, taking priority over the plain-line case below;
 * - a plain 4-in-a-row spawns a RowClear/ColClear at whichever swapped
 *   position is part of the run (falling back to the run's center for
 *   cascade-born matches, when `swapPositions` is null).
 * 5+ runs are handled elsewhere as those land.
 */
export function analyzeMatchShapes(
  grid: Grid,
  matched: ReadonlySet<string>,
  swapPositions: readonly [Position, Position] | null,
): MatchShapeAnalysis {
  const runs = findRuns(grid).filter((run) => run.cells.every((c) => matched.has(cellKey(c.row, c.col))));

  const spawns: SpecialSpawn[] = [];
  const keepPositions = new Set<string>();
  const consumed = new Set<Run>();

  const horizontals = runs.filter((r) => r.orientation === 'horizontal' && r.cells.length >= 3);
  const verticals = runs.filter((r) => r.orientation === 'vertical' && r.cells.length >= 3);

  for (const h of horizontals) {
    for (const v of verticals) {
      if (consumed.has(h) || consumed.has(v)) continue;
      const intersection = sharedCell(h, v);
      if (!intersection) continue;

      spawns.push({ position: intersection, tile: { kind: SpecialKind.Bomb, color: h.color } });
      keepPositions.add(cellKey(intersection.row, intersection.col));
      consumed.add(h);
      consumed.add(v);
    }
  }

  for (const run of runs) {
    if (consumed.has(run) || run.cells.length !== 4) continue;

    const position = pickSpawnPosition(run.cells, swapPositions);
    const kind = run.orientation === 'horizontal' ? SpecialKind.RowClear : SpecialKind.ColClear;
    spawns.push({ position, tile: { kind, color: run.color } });
    keepPositions.add(cellKey(position.row, position.col));
  }

  return { spawns, keepPositions };
}
