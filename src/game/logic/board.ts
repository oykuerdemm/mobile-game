import { TILE_TYPES, type Cell, type Grid, type Position, type Rng, type TileType } from './types';

export function createEmptyGrid(width: number, height: number): Grid {
  return Array.from({ length: height }, () => Array.from({ length: width }, (): Cell => null));
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.slice());
}

export function randomTileType(rng: Rng): TileType {
  return TILE_TYPES[Math.floor(rng() * TILE_TYPES.length)];
}

export function areAdjacent(a: Position, b: Position): boolean {
  const rowDelta = Math.abs(a.row - b.row);
  const colDelta = Math.abs(a.col - b.col);
  return rowDelta + colDelta === 1;
}

/** Returns a new grid with the tiles at the two positions swapped. */
export function swapTiles(grid: Grid, a: Position, b: Position): Grid {
  const next = cloneGrid(grid);
  const temp = next[a.row][a.col];
  next[a.row][a.col] = next[b.row][b.col];
  next[b.row][b.col] = temp;
  return next;
}

/** True if swapping the two (adjacent) positions would create a 3+ match. */
export function isValidSwap(grid: Grid, a: Position, b: Position): boolean {
  if (!areAdjacent(a, b)) return false;
  return findMatches(swapTiles(grid, a, b)).size > 0;
}

/** Returns a new grid with every matched cell emptied (set to null). */
export function clearMatches(grid: Grid, matched: Set<string>): Grid {
  const next = cloneGrid(grid);
  for (const key of matched) {
    const [row, col] = key.split(',').map(Number);
    next[row][col] = null;
  }
  return next;
}

/** Drops every non-null tile in each column down to fill the gaps left by clearing, nulls float to the top. */
export function applyGravity(grid: Grid): Grid {
  const height = grid.length;
  const width = grid[0].length;
  const next = createEmptyGrid(width, height);

  for (let col = 0; col < width; col++) {
    const stack: TileType[] = [];
    for (let row = 0; row < height; row++) {
      const value = grid[row][col];
      if (value !== null) stack.push(value);
    }
    const offset = height - stack.length;
    for (let i = 0; i < stack.length; i++) {
      next[offset + i][col] = stack[i];
    }
  }
  return next;
}

/** Forbidden types for the given cell: ones that would complete a 3+ run with its current neighbors. */
function forbiddenTypesAt(grid: Grid, row: number, col: number): Set<TileType> {
  const height = grid.length;
  const width = grid[0].length;
  const forbidden = new Set<TileType>();

  const left1 = col >= 1 ? grid[row][col - 1] : null;
  const left2 = col >= 2 ? grid[row][col - 2] : null;
  if (left1 !== null && left1 === left2) forbidden.add(left1);

  const right1 = col + 1 < width ? grid[row][col + 1] : null;
  const right2 = col + 2 < width ? grid[row][col + 2] : null;
  if (right1 !== null && right1 === right2) forbidden.add(right1);

  if (left1 !== null && left1 === right1) forbidden.add(left1);

  const up1 = row >= 1 ? grid[row - 1][col] : null;
  const up2 = row >= 2 ? grid[row - 2][col] : null;
  if (up1 !== null && up1 === up2) forbidden.add(up1);

  const down1 = row + 1 < height ? grid[row + 1][col] : null;
  const down2 = row + 2 < height ? grid[row + 2][col] : null;
  if (down1 !== null && down1 === down2) forbidden.add(down1);

  if (up1 !== null && up1 === down1) forbidden.add(up1);

  return forbidden;
}

/**
 * Fills every null cell with a new random tile type.
 *
 * `avoidMatchChance` (0-1) is the probability that a given refilled tile avoids
 * completing an immediate match with its neighbors (survivors below/beside it,
 * or other tiles already placed earlier in this same refill pass) — it reduces
 * but, below 1, does not eliminate the chance of an instant chain reaction.
 * Defaults to 0 (fully random, the original behavior) so existing callers are
 * unaffected; GameScene passes the configured difficulty value explicitly.
 */
export function refill(grid: Grid, rng: Rng = Math.random, avoidMatchChance = 0): Grid {
  const next = cloneGrid(grid);
  for (let row = 0; row < next.length; row++) {
    for (let col = 0; col < next[row].length; col++) {
      if (next[row][col] !== null) continue;

      if (rng() < avoidMatchChance) {
        const forbidden = forbiddenTypesAt(next, row, col);
        const options = TILE_TYPES.filter((type) => !forbidden.has(type));
        next[row][col] = options[Math.floor(rng() * options.length)];
      } else {
        next[row][col] = randomTileType(rng);
      }
    }
  }
  return next;
}

/** True if any adjacent swap on the board would create a 3+ match. */
export function hasAvailableMove(grid: Grid): boolean {
  const height = grid.length;
  const width = grid[0].length;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (col + 1 < width && isValidSwap(grid, { row, col }, { row, col: col + 1 })) return true;
      if (row + 1 < height && isValidSwap(grid, { row, col }, { row: row + 1, col })) return true;
    }
  }
  return false;
}

function fisherYates<T>(items: T[], rng: Rng): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Reshuffles the existing tiles (same multiset) into a new arrangement with no
 * pre-existing matches and at least one available move. Falls back to a fresh
 * generated board if no valid shuffle is found within a bounded number of tries.
 */
export function shuffleBoard(grid: Grid, rng: Rng = Math.random): Grid {
  const height = grid.length;
  const width = grid[0].length;
  const tiles: TileType[] = [];
  for (const row of grid) {
    for (const cell of row) {
      if (cell !== null) tiles.push(cell);
    }
  }

  const maxAttempts = 200;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const shuffled = fisherYates(tiles, rng);
    const next = createEmptyGrid(width, height);
    let i = 0;
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        next[row][col] = shuffled[i++];
      }
    }
    if (findMatches(next).size === 0 && hasAvailableMove(next)) {
      return next;
    }
  }

  return generateBoard(width, height, rng);
}

export interface CascadeResult {
  finalGrid: Grid;
  /** Number of clear+gravity+refill passes applied (1 if there was no chain reaction). */
  passes: number;
}

/** Repeatedly clears matches, drops tiles, and refills until the board is stable. */
export function resolveCascade(grid: Grid, rng: Rng = Math.random): CascadeResult {
  let current = grid;
  let passes = 0;

  while (true) {
    const matched = findMatches(current);
    if (matched.size === 0) break;
    current = refill(applyGravity(clearMatches(current, matched)), rng);
    passes++;
  }

  return { finalGrid: current, passes };
}

export function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function markRuns(cells: Cell[], onRun: (start: number, end: number) => void): void {
  let runStart = 0;
  for (let i = 1; i <= cells.length; i++) {
    const prevType = cells[i - 1];
    const currType = i < cells.length ? cells[i] : null;
    if (currType !== prevType) {
      const runLength = i - runStart;
      if (runLength >= 3 && prevType !== null) {
        onRun(runStart, i - 1);
      }
      runStart = i;
    }
  }
}

/** Returns the set of "row,col" keys for every tile in a 3+ horizontal or vertical run. */
export function findMatches(grid: Grid): Set<string> {
  const height = grid.length;
  const width = grid[0].length;
  const matched = new Set<string>();

  for (let row = 0; row < height; row++) {
    markRuns(grid[row], (start, end) => {
      for (let col = start; col <= end; col++) matched.add(cellKey(row, col));
    });
  }

  for (let col = 0; col < width; col++) {
    const column = grid.map((row) => row[col]);
    markRuns(column, (start, end) => {
      for (let row = start; row <= end; row++) matched.add(cellKey(row, col));
    });
  }

  return matched;
}

/**
 * Fills the board with random tiles such that no cell completes a 3+ run with
 * its already-placed left or upper neighbors (filled in row-major order).
 */
export function generateBoard(width: number, height: number, rng: Rng = Math.random): Grid {
  const grid = createEmptyGrid(width, height);
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const forbidden = forbiddenTypesAt(grid, row, col);
      const options = TILE_TYPES.filter((type) => !forbidden.has(type));
      grid[row][col] = options[Math.floor(rng() * options.length)];
    }
  }
  return grid;
}
