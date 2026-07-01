import Phaser from 'phaser';
import { performAttack } from '../systems/CombatSystem';
import type Player from './Player';
import type TrainingDummy from './TrainingDummy';

export default class Pet extends Phaser.GameObjects.Sprite {
  private owner: Player;
  private dummies: TrainingDummy[];
  private attackTimer?: Phaser.Time.TimerEvent;
  readonly atk = 3;

  constructor(scene: Phaser.Scene, owner: Player, dummies: TrainingDummy[]) {
    super(scene, owner.x - 20, owner.y + 10, 'pet');
    this.owner = owner;
    this.dummies = dummies;
    scene.add.existing(this);
    this.setDepth(owner.y);

    this.attackTimer = scene.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => this.tryAttack(),
    });
  }

  update(): void {
    const targetX = this.owner.x - 24;
    const targetY = this.owner.y + 16;
    this.x = Phaser.Math.Linear(this.x, targetX, 0.08);
    // Light idle bob for liveliness (purely visual)
    const bob = Math.sin(this.scene.time.now / 290) * 0.95;
    this.y = Phaser.Math.Linear(this.y, targetY, 0.08) + bob;
    this.setDepth(this.y);
  }

  private tryAttack(): void {
    const range = 60;
    let nearest: TrainingDummy | null = null;
    let minDist = range;

    for (const dummy of this.dummies) {
      if (!dummy.isAlive) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, dummy.x, dummy.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = dummy;
      }
    }

    if (nearest) {
      performAttack(this.scene, { atk: this.atk, sprite: this }, nearest);
    }
  }

  destroy(fromScene?: boolean): void {
    this.attackTimer?.remove();
    super.destroy(fromScene);
  }
}
