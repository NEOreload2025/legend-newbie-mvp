import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import ClassSelectScene from './scenes/ClassSelectScene';
import VillageScene from './scenes/VillageScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  backgroundColor: '#2d4a1e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, ClassSelectScene, VillageScene],
};

export default new Phaser.Game(config);
