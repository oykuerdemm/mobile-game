import Phaser from 'phaser';
import { generateBoard } from '../logic/board';
import { BOARD_HEIGHT, BOARD_WIDTH, type Grid } from '../logic/types';
import { createTileTextures, textureKeyForTile, TILE_SIZE } from '../render/textures';

const CELL_SIZE = 80;
const SPRITE_SCALE = (CELL_SIZE * 0.82) / TILE_SIZE;

export class GameScene extends Phaser.Scene {
  private grid!: Grid;
  private boardOffsetX = 0;
  private boardOffsetY = 0;

  constructor() {
    super('GameScene');
  }

  create(): void {
    createTileTextures(this);

    const boardPixelWidth = CELL_SIZE * BOARD_WIDTH;
    const boardPixelHeight = CELL_SIZE * BOARD_HEIGHT;
    this.boardOffsetX = (this.scale.width - boardPixelWidth) / 2;
    this.boardOffsetY = (this.scale.height - boardPixelHeight) / 2;

    this.grid = generateBoard(BOARD_WIDTH, BOARD_HEIGHT);
    this.renderBoard();
  }

  private cellToWorld(row: number, col: number): { x: number; y: number } {
    return {
      x: this.boardOffsetX + col * CELL_SIZE + CELL_SIZE / 2,
      y: this.boardOffsetY + row * CELL_SIZE + CELL_SIZE / 2,
    };
  }

  private renderBoard(): void {
    for (let row = 0; row < BOARD_HEIGHT; row++) {
      for (let col = 0; col < BOARD_WIDTH; col++) {
        const type = this.grid[row][col];
        if (type === null) continue;
        const { x, y } = this.cellToWorld(row, col);
        this.add.image(x, y, textureKeyForTile(type)).setScale(SPRITE_SCALE);
      }
    }
  }
}
