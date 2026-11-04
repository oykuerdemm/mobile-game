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

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

function markRuns(cells: Cell[], onRun: (start: number, end: number) => void): void {
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
      const forbidden = new Set<TileType>();

      const left1 = col >= 1 ? grid[row][col - 1] : null;
      const left2 = col >= 2 ? grid[row][col - 2] : null;
      if (left1 !== null && left1 === left2) forbidden.add(left1);

      const up1 = row >= 1 ? grid[row - 1][col] : null;
      const up2 = row >= 2 ? grid[row - 2][col] : null;
      if (up1 !== null && up1 === up2) forbidden.add(up1);

      const options = TILE_TYPES.filter((type) => !forbidden.has(type));
      grid[row][col] = options[Math.floor(rng() * options.length)];
    }
  }
  return grid;
}
