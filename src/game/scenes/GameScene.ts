import Phaser from 'phaser';
import { areAdjacent, generateBoard, swapTiles } from '../logic/board';
import { BOARD_HEIGHT, BOARD_WIDTH, type Grid, type Position } from '../logic/types';
import { createTileTextures, textureKeyForTile, TILE_SIZE } from '../render/textures';
import { tweenPromise } from '../render/tween';

const CELL_SIZE = 80;
const SPRITE_SCALE = (CELL_SIZE * 0.82) / TILE_SIZE;
const SWAP_DURATION = 150;
const DRAG_THRESHOLD = CELL_SIZE * 0.3;

export class GameScene extends Phaser.Scene {
  private grid!: Grid;
  private sprites!: Phaser.GameObjects.Image[][];
  private boardOffsetX = 0;
  private boardOffsetY = 0;
  private dragOrigin: Position | null = null;
  private dragTriggered = false;
  private busy = false;

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
    this.sprites = [];
    this.renderBoard();

    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
  }

  private cellToWorld(row: number, col: number): { x: number; y: number } {
    return {
      x: this.boardOffsetX + col * CELL_SIZE + CELL_SIZE / 2,
      y: this.boardOffsetY + row * CELL_SIZE + CELL_SIZE / 2,
    };
  }

  private renderBoard(): void {
    for (let row = 0; row < BOARD_HEIGHT; row++) {
      this.sprites[row] = [];
      for (let col = 0; col < BOARD_WIDTH; col++) {
        const type = this.grid[row][col];
        if (type === null) continue;
        this.sprites[row][col] = this.createTileSprite(row, col, type);
      }
    }
  }

  private createTileSprite(row: number, col: number, type: NonNullable<Grid[number][number]>): Phaser.GameObjects.Image {
    const { x, y } = this.cellToWorld(row, col);
    const sprite = this.add.image(x, y, textureKeyForTile(type)).setScale(SPRITE_SCALE).setInteractive();
    sprite.setData('row', row);
    sprite.setData('col', col);
    sprite.on('pointerdown', () => this.handlePointerDown({ row, col }));
    return sprite;
  }

  private handlePointerDown(position: Position): void {
    if (this.busy) return;
    this.dragOrigin = position;
    this.dragTriggered = false;
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.busy || !this.dragOrigin || this.dragTriggered) return;

    const dx = pointer.x - pointer.downX;
    const dy = pointer.y - pointer.downY;
    if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;

    const direction: Position =
      Math.abs(dx) > Math.abs(dy) ? { row: 0, col: dx > 0 ? 1 : -1 } : { row: dy > 0 ? 1 : -1, col: 0 };
    const target: Position = { row: this.dragOrigin.row + direction.row, col: this.dragOrigin.col + direction.col };

    if (target.row < 0 || target.row >= BOARD_HEIGHT || target.col < 0 || target.col >= BOARD_WIDTH) return;

    this.dragTriggered = true;
    void this.attemptSwap(this.dragOrigin, target);
  }

  private handlePointerUp(): void {
    this.dragOrigin = null;
    this.dragTriggered = false;
  }

  private async attemptSwap(a: Position, b: Position): Promise<void> {
    if (!areAdjacent(a, b)) return;
    this.busy = true;

    this.grid = swapTiles(this.grid, a, b);
    this.swapSpritesInPlace(a, b);
    await this.tweenSwap(a, b);

    this.busy = false;
  }

  private swapSpritesInPlace(a: Position, b: Position): void {
    const spriteA = this.sprites[a.row][a.col];
    const spriteB = this.sprites[b.row][b.col];
    this.sprites[a.row][a.col] = spriteB;
    this.sprites[b.row][b.col] = spriteA;
    spriteA.setData('row', b.row).setData('col', b.col);
    spriteB.setData('row', a.row).setData('col', a.col);
  }

  private async tweenSwap(a: Position, b: Position): Promise<void> {
    const spriteAtA = this.sprites[a.row][a.col];
    const spriteAtB = this.sprites[b.row][b.col];
    const worldA = this.cellToWorld(a.row, a.col);
    const worldB = this.cellToWorld(b.row, b.col);

    await Promise.all([
      tweenPromise(this, { targets: spriteAtA, x: worldA.x, y: worldA.y, duration: SWAP_DURATION, ease: 'Quad.easeInOut' }),
      tweenPromise(this, { targets: spriteAtB, x: worldB.x, y: worldB.y, duration: SWAP_DURATION, ease: 'Quad.easeInOut' }),
    ]);
  }
}
