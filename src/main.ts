import Phaser from 'phaser';
import { GameScene } from './game/scenes/GameScene';
import { LevelSelectScene } from './game/scenes/LevelSelectScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#111111',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 720,
    height: 1280,
  },
  scene: [LevelSelectScene, GameScene],
};

new Phaser.Game(config);
