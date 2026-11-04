import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, 'Match-3 Prototip', {
        fontFamily: 'sans-serif',
        fontSize: '48px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
  }
}
