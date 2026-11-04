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

/** Fills every cell with a random tile type, with no guarantee against pre-existing matches. */
export function createRandomGrid(width: number, height: number, rng: Rng = Math.random): Grid {
  const grid = createEmptyGrid(width, height);
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      grid[row][col] = randomTileType(rng);
    }
  }
  return grid;
}

export function areAdjacent(a: Position, b: Position): boolean {
  const rowDelta = Math.abs(a.row - b.row);
  const colDelta = Math.abs(a.col - b.col);
  return rowDelta + colDelta === 1;
}
