import Phaser from 'phaser';
import { LEVELS } from '../logic/levels';
import { loadUnlockedLevel } from '../logic/progress';

const COLUMNS = 5;
const BUTTON_SIZE = 110;
const GAP = 24;

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelectScene');
  }

  create(): void {
    const unlocked = loadUnlockedLevel(window.localStorage);

    this.add
      .text(this.scale.width / 2, 140, 'Level Seç', {
        fontFamily: 'sans-serif',
        fontSize: '48px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const totalWidth = COLUMNS * BUTTON_SIZE + (COLUMNS - 1) * GAP;
    const startX = (this.scale.width - totalWidth) / 2 + BUTTON_SIZE / 2;
    const startY = 320;

    LEVELS.forEach((level, index) => {
      const col = index % COLUMNS;
      const row = Math.floor(index / COLUMNS);
      const x = startX + col * (BUTTON_SIZE + GAP);
      const y = startY + row * (BUTTON_SIZE + GAP);
      this.createLevelButton(x, y, level.id, level.id <= unlocked);
    });
  }

  private createLevelButton(x: number, y: number, levelId: number, unlocked: boolean): void {
    const background = this.add
      .rectangle(0, 0, BUTTON_SIZE, BUTTON_SIZE, unlocked ? 0x3b3b3b : 0x1c1c1c)
      .setStrokeStyle(2, unlocked ? 0xffffff : 0x555555);
    const label = this.add
      .text(0, 0, String(levelId), {
        fontFamily: 'sans-serif',
        fontSize: '40px',
        color: unlocked ? '#ffffff' : '#555555',
      })
      .setOrigin(0.5);

    const button = this.add.container(x, y, [background, label]);
    if (unlocked) {
      button.setSize(BUTTON_SIZE, BUTTON_SIZE);
      button.setInteractive({ useHandCursor: true });
      button.on('pointerdown', () => this.scene.start('GameScene', { levelId }));
    }
  }
}
