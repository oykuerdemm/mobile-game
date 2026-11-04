import Phaser from 'phaser';
import {
  applyGravity,
  areAdjacent,
  clearMatches,
  findMatches,
  generateBoard,
  hasAvailableMove,
  refill,
  shuffleBoard,
  swapTiles,
} from '../logic/board';
import { applyMove, createSession, type SessionState } from '../logic/level';
import { getLevelById } from '../logic/levels';
import { markLevelCompleted } from '../logic/progress';
import { BOARD_HEIGHT, BOARD_WIDTH, type Grid, type Position, type TileType } from '../logic/types';
import { createTileTextures, textureKeyForTile, TILE_SIZE } from '../render/textures';
import { tweenPromise } from '../render/tween';

const CELL_SIZE = 80;
const SPRITE_SCALE = (CELL_SIZE * 0.82) / TILE_SIZE;
const SWAP_DURATION = 112;
const REVERT_DURATION = 144;
const CLEAR_DURATION = 128;
const FALL_DURATION_BASE = 72;
const FALL_DURATION_PER_ROW = 36;
const FALL_DURATION_MIN = 112;
const FALL_DURATION_MAX = 336;
const SHUFFLE_FADE_DURATION = 160;
const DRAG_THRESHOLD = CELL_SIZE * 0.3;
const HUD_HEIGHT = 200;

function fallDuration(rowsFallen: number): number {
  return Phaser.Math.Clamp(FALL_DURATION_BASE + rowsFallen * FALL_DURATION_PER_ROW, FALL_DURATION_MIN, FALL_DURATION_MAX);
}

type Sprite = Phaser.GameObjects.Image;

export class GameScene extends Phaser.Scene {
  private grid!: Grid;
  private sprites!: (Sprite | null)[][];
  private boardOffsetX = 0;
  private boardOffsetY = 0;
  private dragOrigin: Position | null = null;
  private dragTriggered = false;
  private busy = false;
  private session!: SessionState;
  private goalText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;
  private levelId!: number;

  constructor() {
    super('GameScene');
  }

  init(data: { levelId?: number }): void {
    this.levelId = data?.levelId ?? 1;
  }

  create(): void {
    createTileTextures(this);
    const level = getLevelById(this.levelId);
    if (!level) throw new Error(`Unknown level id: ${this.levelId}`);
    this.session = createSession(level);

    const boardPixelWidth = CELL_SIZE * BOARD_WIDTH;
    const boardPixelHeight = CELL_SIZE * BOARD_HEIGHT;
    const availableHeight = this.scale.height - HUD_HEIGHT;
    this.boardOffsetX = (this.scale.width - boardPixelWidth) / 2;
    this.boardOffsetY = HUD_HEIGHT + (availableHeight - boardPixelHeight) / 2;

    this.createHud();

    this.grid = generateBoard(BOARD_WIDTH, BOARD_HEIGHT);
    if (!hasAvailableMove(this.grid)) {
      this.grid = shuffleBoard(this.grid);
    }
    this.sprites = [];
    this.renderBoard();

    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
  }

  private createHud(): void {
    const hudY = HUD_HEIGHT / 2;
    this.add.image(60, hudY, textureKeyForTile(this.session.level.goal.type)).setScale(SPRITE_SCALE);
    this.goalText = this.add
      .text(100, hudY, '', { fontFamily: 'sans-serif', fontSize: '32px', color: '#ffffff' })
      .setOrigin(0, 0.5);
    this.movesText = this.add
      .text(this.scale.width - 30, hudY, '', { fontFamily: 'sans-serif', fontSize: '32px', color: '#ffffff' })
      .setOrigin(1, 0.5);
    this.updateHud();
  }

  private updateHud(): void {
    this.goalText.setText(`${this.session.collected}/${this.session.level.goal.count}`);
    this.movesText.setText(`Hamle: ${this.session.movesRemaining}`);
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

  private createTileSprite(row: number, col: number, type: TileType): Sprite {
    const { x, y } = this.cellToWorld(row, col);
    const sprite = this.add.image(x, y, textureKeyForTile(type)).setScale(SPRITE_SCALE).setInteractive();
    sprite.setData('row', row);
    sprite.setData('col', col);
    sprite.on('pointerdown', () => {
      this.handlePointerDown({ row: sprite.getData('row'), col: sprite.getData('col') });
    });
    return sprite;
  }

  private handlePointerDown(position: Position): void {
    if (this.busy || this.session.status !== 'playing') return;
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
    await this.tweenSwap(a, b, SWAP_DURATION, 'Quad.easeInOut');

    const matched = findMatches(this.grid);
    if (matched.size === 0) {
      this.grid = swapTiles(this.grid, a, b);
      this.swapSpritesInPlace(a, b);
      await this.tweenSwap(a, b, REVERT_DURATION, 'Back.easeOut');
    } else {
      const cleared = await this.resolveCascade();
      this.session = applyMove(this.session, cleared);
      this.updateHud();
    }

    if (this.session.status === 'playing' && !hasAvailableMove(this.grid)) {
      await this.shuffleWithAnimation();
    }

    this.busy = false;

    if (this.session.status !== 'playing') {
      this.showEndOverlay();
    }
  }

  private showEndOverlay(): void {
    const won = this.session.status === 'won';
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    if (won) {
      markLevelCompleted(window.localStorage, this.levelId);
    }

    this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000000, 0.75);
    this.add
      .text(centerX, centerY - 160, won ? 'Kazandın!' : 'Kaybettin', {
        fontFamily: 'sans-serif',
        fontSize: '56px',
        color: won ? '#2ecc71' : '#e74c3c',
      })
      .setOrigin(0.5);

    let buttonY = centerY - 60;
    const nextLevel = won ? getLevelById(this.levelId + 1) : undefined;

    if (nextLevel) {
      this.createButton(centerX, buttonY, 'Sonraki Level', () => {
        this.scene.start('GameScene', { levelId: nextLevel.id });
      });
      buttonY += 90;
    }

    this.createButton(centerX, buttonY, 'Tekrar Dene', () => {
      this.scene.restart({ levelId: this.levelId });
    });
    buttonY += 90;

    this.createButton(centerX, buttonY, 'Level Seçimi', () => {
      this.scene.start('LevelSelectScene');
    });
  }

  private createButton(x: number, y: number, label: string, onClick: () => void): void {
    const text = this.add.text(0, 0, label, { fontFamily: 'sans-serif', fontSize: '28px', color: '#ffffff' }).setOrigin(0.5);
    const paddingX = 28;
    const paddingY = 16;
    const background = this.add
      .rectangle(0, 0, text.width + paddingX * 2, text.height + paddingY * 2, 0x3b3b3b)
      .setStrokeStyle(2, 0xffffff);
    const button = this.add.container(x, y, [background, text]);
    button.setSize(background.width, background.height);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', onClick);
  }

  /** Repeatedly resolves matches (clear/gravity/refill) until the board has none left. Returns how many tiles of each type were cleared, for goal tracking. */
  private async resolveCascade(): Promise<Map<TileType, number>> {
    const totalCleared = new Map<TileType, number>();
    let matched = findMatches(this.grid);
    while (matched.size > 0) {
      for (const key of matched) {
        const [row, col] = key.split(',').map(Number);
        const type = this.grid[row][col];
        if (type !== null) totalCleared.set(type, (totalCleared.get(type) ?? 0) + 1);
      }
      await this.resolveMatches(matched);
      matched = findMatches(this.grid);
    }
    return totalCleared;
  }

  /** Fades the board out, reshuffles the tiles, and fades the new layout back in. */
  private async shuffleWithAnimation(): Promise<void> {
    const message = this.add
      .text(this.scale.width / 2, this.boardOffsetY - 40, 'Hamle kalmadı, karıştırılıyor...', {
        fontFamily: 'sans-serif',
        fontSize: '26px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    await tweenPromise(this, { targets: message, alpha: 1, duration: SHUFFLE_FADE_DURATION });

    const oldSprites = this.sprites.flat().filter((sprite): sprite is Sprite => sprite !== null);
    await Promise.all(oldSprites.map((sprite) => tweenPromise(this, { targets: sprite, alpha: 0, duration: SHUFFLE_FADE_DURATION })));
    oldSprites.forEach((sprite) => sprite.destroy());

    this.grid = shuffleBoard(this.grid);
    this.sprites = [];
    this.renderBoard();

    const newSprites = this.sprites.flat().filter((sprite): sprite is Sprite => sprite !== null);
    newSprites.forEach((sprite) => sprite.setAlpha(0));
    await Promise.all(newSprites.map((sprite) => tweenPromise(this, { targets: sprite, alpha: 1, duration: SHUFFLE_FADE_DURATION })));

    await tweenPromise(this, { targets: message, alpha: 0, duration: SHUFFLE_FADE_DURATION });
    message.destroy();
  }

  private swapSpritesInPlace(a: Position, b: Position): void {
    const spriteA = this.sprites[a.row][a.col];
    const spriteB = this.sprites[b.row][b.col];
    this.sprites[a.row][a.col] = spriteB;
    this.sprites[b.row][b.col] = spriteA;
    spriteA?.setData('row', b.row).setData('col', b.col);
    spriteB?.setData('row', a.row).setData('col', a.col);
  }

  private async tweenSwap(a: Position, b: Position, duration: number, ease: string): Promise<void> {
    const spriteAtA = this.sprites[a.row][a.col];
    const spriteAtB = this.sprites[b.row][b.col];
    const worldA = this.cellToWorld(a.row, a.col);
    const worldB = this.cellToWorld(b.row, b.col);

    await Promise.all([
      tweenPromise(this, { targets: spriteAtA, x: worldA.x, y: worldA.y, duration, ease }),
      tweenPromise(this, { targets: spriteAtB, x: worldB.x, y: worldB.y, duration, ease }),
    ]);
  }

  /** Clears the given matches, applies gravity, and refills empty cells from the top — one pass, no cascade. */
  private async resolveMatches(matched: Set<string>): Promise<void> {
    this.grid = clearMatches(this.grid, matched);
    await this.animateClear(matched);

    this.grid = applyGravity(this.grid);
    await this.animateGravity();

    const beforeRefill = this.grid;
    this.grid = refill(this.grid);
    await this.animateRefill(beforeRefill, this.grid);
  }

  private async animateClear(matched: Set<string>): Promise<void> {
    const tweens: Promise<void>[] = [];
    for (const key of matched) {
      const [row, col] = key.split(',').map(Number);
      const sprite = this.sprites[row][col];
      if (!sprite) continue;
      tweens.push(tweenPromise(this, { targets: sprite, scale: 0, alpha: 0, duration: CLEAR_DURATION, ease: 'Back.easeIn' }));
    }
    await Promise.all(tweens);
    for (const key of matched) {
      const [row, col] = key.split(',').map(Number);
      this.sprites[row][col]?.destroy();
      this.sprites[row][col] = null;
    }
  }

  private async animateGravity(): Promise<void> {
    const nextSprites: (Sprite | null)[][] = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
    const tweens: Promise<void>[] = [];

    for (let col = 0; col < BOARD_WIDTH; col++) {
      const survivors: { row: number; sprite: Sprite }[] = [];
      for (let row = 0; row < BOARD_HEIGHT; row++) {
        const sprite = this.sprites[row][col];
        if (sprite) survivors.push({ row, sprite });
      }
      const offset = BOARD_HEIGHT - survivors.length;
      survivors.forEach(({ row, sprite }, i) => {
        const newRow = offset + i;
        nextSprites[newRow][col] = sprite;
        sprite.setData('row', newRow).setData('col', col);
        if (newRow !== row) {
          const { y } = this.cellToWorld(newRow, col);
          const duration = fallDuration(newRow - row);
          tweens.push(tweenPromise(this, { targets: sprite, y, duration, ease: 'Quad.easeIn' }));
        }
      });
    }

    this.sprites = nextSprites;
    await Promise.all(tweens);
  }

  private async animateRefill(before: Grid, after: Grid): Promise<void> {
    const tweens: Promise<void>[] = [];

    for (let col = 0; col < BOARD_WIDTH; col++) {
      const emptyRows: number[] = [];
      for (let row = 0; row < BOARD_HEIGHT; row++) {
        if (before[row][col] === null) emptyRows.push(row);
      }

      emptyRows.forEach((row, indexFromTop) => {
        const type = after[row][col];
        if (type === null) return;
        const target = this.cellToWorld(row, col);
        const spawnY = this.boardOffsetY + (indexFromTop - emptyRows.length) * CELL_SIZE + CELL_SIZE / 2;
        const sprite = this.createTileSprite(row, col, type);
        sprite.setPosition(target.x, spawnY);
        this.sprites[row][col] = sprite;
        const duration = fallDuration((target.y - spawnY) / CELL_SIZE);
        tweens.push(tweenPromise(this, { targets: sprite, y: target.y, duration, ease: 'Quad.easeIn' }));
      });
    }

    await Promise.all(tweens);
  }
}
