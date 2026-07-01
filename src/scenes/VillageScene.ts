import Phaser from 'phaser';
import { GameState } from '../data/GameState';
import Player from '../entities/Player';
import Pet from '../entities/Pet';
import TrainingDummy from '../entities/TrainingDummy';
import Hud from '../ui/Hud';
import { createIsoMap } from '../utils/IsoMap';

export default class VillageScene extends Phaser.Scene {
  private player!: Player;
  private pet?: Pet;
  private dummies: TrainingDummy[] = [];
  private hud!: Hud;
  private sortableObjects: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('VillageScene');
  }

  create(): void {
    const map = createIsoMap(this);

    this.physics.world.setBounds(0, 0, map.width, map.height);
    this.cameras.main.setBounds(0, 0, map.width, map.height);
    this.cameras.main.setZoom(1.1);

    // Very subtle atmospheric overlay (earthy, low impact)
    const overlay = this.add.rectangle(
      map.width / 2,
      map.height / 2,
      map.width,
      map.height,
      0x1a140b,
      0.035,
    );
    overlay.setDepth(9999);

    // Direction label (slightly more visible)
    this.add
      .text(map.spawnX + 70, map.spawnY + 18, '訓練場 →', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: '#d4c090',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(map.spawnY + 10);

    this.player = new Player(this, map.spawnX, map.spawnY);
    this.physics.add.collider(this.player, map.obstacles);

    this.dummies = map.dummyPositions.map(
      (pos) => new TrainingDummy(this, pos.x, pos.y),
    );

    this.player.setDummies(this.dummies, () => this.hud.update());

    if (GameState.selectedClass === 'taoist') {
      this.pet = new Pet(this, this.player, this.dummies);
    }

    this.sortableObjects = [
      this.player,
      ...this.dummies,
      ...(this.pet ? [this.pet] : []),
    ];

    this.hud = new Hud(this, this.player);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  update(): void {
    this.player.update();
    this.pet?.update();
    this.hud.update();
    this.depthSort();
  }

  private depthSort(): void {
    for (const obj of this.sortableObjects) {
      if ('y' in obj && 'setDepth' in obj && typeof obj.setDepth === 'function') {
        obj.setDepth((obj as Phaser.GameObjects.Sprite).y);
      }
    }
  }
}
