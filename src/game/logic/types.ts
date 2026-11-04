export const BOARD_WIDTH = 8;
export const BOARD_HEIGHT = 8;

export enum TileType {
  Red = 0,
  Blue = 1,
  Green = 2,
  Yellow = 3,
  Purple = 4,
}

export const TILE_TYPES: TileType[] = [
  TileType.Red,
  TileType.Blue,
  TileType.Green,
  TileType.Yellow,
  TileType.Purple,
];

export type Cell = TileType | null;

/** grid[row][col], row 0 is the top of the board. */
export type Grid = Cell[][];

export interface Position {
  row: number;
  col: number;
}

export type Rng = () => number;
