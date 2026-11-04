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

/**
 * A special tile sits "on top of" a normal colored tile (the grid keeps its
 * TileType; the board of specials is a parallel overlay). Activating one
 * clears extra cells beyond the tiles it was directly matched with.
 */
export enum SpecialKind {
  /** Clears its entire row. Born from a 4-in-a-row horizontal match. */
  RowClear = 'row-clear',
  /** Clears its entire column. Born from a 4-in-a-row vertical match. */
  ColClear = 'col-clear',
  /** Clears a 3x3 area around itself. Born from an L/T shaped match. */
  Bomb = 'bomb',
  /** Clears every tile of its stored color. Born from a 5-in-a-row match. */
  ColorClear = 'color-clear',
}

export interface SpecialTile {
  kind: SpecialKind;
  /** The color/shape the special renders as, and the target color for ColorClear. */
  color: TileType;
}

export type SpecialCell = SpecialTile | null;

/** specials[row][col], same dimensions as the matching Grid. */
export type SpecialBoard = SpecialCell[][];
