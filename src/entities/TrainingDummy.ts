import Phaser from 'phaser';
import { createDebris } from '../utils/VisualEffects';

export default class TrainingDummy extends Phaser.GameObjects.Sprite {
  maxHp = 30;
  hp = 30;
  def = 2;
  isAlive = true;
  private respawnTimer?: Phaser.Time.TimerEvent;
  private spawnX: number;
  private spawnY: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'dummy');
    this.spawnX = x;
    this.spawnY = y;
    scene.add.existing(this);
    this.setDepth(y);
  }

  takeDamage(amount: number): boolean {
    if (!this.isAlive) return false;

    this.hp -= amount;
    this.setTint(0xffaaaa);

    this.scene.time.delayedCall(100, () => {
      if (this.isAlive) this.clearTint();
    });

    if (this.hp <= 0) {
      this.die();
      return true;
    }

    return false;
  }

  private die(): void {
    this.isAlive = false;

    // Satisfying break-apart visual
    createDebris(this.scene, this.x, this.y - 4);

    this.setAlpha(0.25);
    this.setTint(0x555555);

    this.respawnTimer?.remove();
    this.respawnTimer = this.scene.time.delayedCall(3000, () => this.respawn());
  }

  private respawn(): void {
    this.hp = this.maxHp;
    this.isAlive = true;
    this.setAlpha(1);
    this.clearTint();
    this.setPosition(this.spawnX, this.spawnY);
    this.setDepth(this.spawnY);
  }

  destroy(fromScene?: boolean): void {
    this.respawnTimer?.remove();
    super.destroy(fromScene);
  }
}
