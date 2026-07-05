import Phaser from 'phaser';
import { PET_CONST } from '../data/ClassStats';
import { findNearestTarget, resolveAttack, type CombatantStats } from '../systems/CombatSystem';
import { playAttackBounce, playAttackEffect } from '../utils/VisualEffects';
import { showMissText } from '../utils/DamageText';
import type { Attackable } from './Attackable';

/** 道士跟寵（§7）：跟隨主人左後方、每 2 秒自動攻擊 60px 內目標（假人 + 怪物） */
export class Pet extends Phaser.GameObjects.Sprite {
  get combatStats(): CombatantStats {
    return {
      atk: PET_CONST.atk,
      def: { min: 0, max: 0 },
      accuracy: 10,
      agility: 10,
    };
  }

  private owner: Phaser.GameObjects.Sprite;
  private targets: readonly Attackable[];
  private floatPhase = Math.random() * Math.PI * 2;
  /** 未加漂浮位移前的平滑 y（漂浮僅作用於顯示） */
  private smoothY: number;

  constructor(
    scene: Phaser.Scene,
    owner: Phaser.GameObjects.Sprite,
    targets: readonly Attackable[],
  ) {
    super(
      scene,
      owner.x + PET_CONST.followOffset.x,
      owner.y + PET_CONST.followOffset.y,
      'pet',
    );
    this.owner = owner;
    this.targets = targets;
    this.smoothY = this.y;
    this.setOrigin(0.5, 1);
    scene.add.existing(this);

    // 每 2000ms 自動攻擊
    scene.time.addEvent({
      delay: PET_CONST.attackIntervalMs,
      loop: true,
      callback: () => this.tryAttack(),
    });
  }

  override update(time: number): void {
    // lerp 0.08 平滑跟隨主人左後方
    const targetX = this.owner.x + PET_CONST.followOffset.x;
    const targetY = this.owner.y + PET_CONST.followOffset.y;
    this.x = Phaser.Math.Linear(this.x, targetX, PET_CONST.followLerp);
    this.smoothY = Phaser.Math.Linear(this.smoothY, targetY, PET_CONST.followLerp);
    // 輕微上下漂浮（僅顯示位移，不影響跟隨插值）
    this.y = this.smoothY + Math.sin(time / 350 + this.floatPhase) * 2.5;
    this.setDepth(1000 + this.smoothY);
  }

  private tryAttack(): void {
    const target = findNearestTarget(
      this,
      this.targets,
      PET_CONST.attackRange,
      (d) => d.alive,
    );
    if (!target) return;

    playAttackBounce(this.scene, this);
    // 寵物攻擊沿用道士系綠色符彈特效，改用 resolveAttack 三擲骰
    playAttackEffect(this.scene, 'taoist', this.x, this.y - 8, target.x, target.y);
    const outcome = resolveAttack(this.combatStats, target.combatStats);
    if (outcome.result === 'hit') {
      target.applyDamage(outcome.damage, 'pet', 'normal');
    } else {
      showMissText(this.scene, target.x, target.y - target.displayHeight * 0.6);
    }
  }
}
