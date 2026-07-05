import Phaser from 'phaser';
import { SLIME_CONST, SLIME_WANDER } from '../data/MonsterStats';
import { showDamageText } from '../utils/DamageText';
import { playDeathShards } from '../utils/VisualEffects';
import { computeDamage } from '../systems/CombatSystem';
import type { Attackable, KillSource, DamageStyle } from './Attackable';
import type { Player } from './Player';

/** 史萊姆怪物（§4）：追擊、近身攻擊、5秒重生、玩家/寵物可擊殺 */
export class Slime extends Phaser.Physics.Arcade.Sprite implements Attackable {
  hp: number = SLIME_CONST.hp;
  readonly def: number = SLIME_CONST.def;
  alive = true;

  private targetPlayer: Player;
  private onKilled: (source: KillSource) => void;
  private lastAttackAt = -Infinity;
  private birthX: number;
  private birthY: number;
  private idleTween: Phaser.Tweens.Tween | null = null;

  // 遊蕩狀態（TASK-003）
  private nextWanderTime = 0;
  private wanderEndTime = 0;
  private wanderDirX = 0;
  private wanderDirY = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    targetPlayer: Player,
    onKilled: (source: KillSource) => void,
  ) {
    super(scene, x, y, 'slime');
    this.targetPlayer = targetPlayer;
    this.onKilled = onKilled;
    this.birthX = x;
    this.birthY = y;
    this.nextWanderTime = 0;
    this.wanderEndTime = 0;
    this.wanderDirX = 0;
    this.wanderDirY = 0;

    this.setOrigin(0.5, 1);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // body 約 18×12 貼齊腳底
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(18, 12);
    body.setOffset((this.width - 18) / 2, this.height - 12);
    body.setCollideWorldBounds(true);

    this.setDepth(1000 + y);
    this.startIdleTween();
  }

  private startIdleTween(): void {
    // 待機輕微 squash & stretch
    this.idleTween = this.scene.tweens.add({
      targets: this,
      scaleX: 1.08,
      scaleY: 0.82,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /** 選擇遊蕩方向：優先隨機方向，若預測會超出 radius 則朝出生點方向 */
  private chooseWanderDirection(): { dx: number; dy: number } {
    const speed = SLIME_CONST.moveSpeed * SLIME_WANDER.speedFactor;
    const stepDist = speed * (SLIME_WANDER.durationMs / 1000);

    // 嘗試數個隨機方向
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const ex = this.x + dx * stepDist;
      const ey = this.y + dy * stepDist;
      if (Phaser.Math.Distance.Between(this.birthX, this.birthY, ex, ey) <= SLIME_WANDER.radius) {
        return { dx, dy };
      }
    }

    // fallback：朝出生點方向（或隨機若已在出生點）
    let dx = this.birthX - this.x;
    let dy = this.birthY - this.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) {
      const angle = Math.random() * Math.PI * 2;
      return { dx: Math.cos(angle), dy: Math.sin(angle) };
    }
    return { dx: dx / len, dy: dy / len };
  }

  /** 開始一次遊走：設定方向與結束時間，並排程下次 */
  private startWander(now: number): void {
    const dir = this.chooseWanderDirection();
    this.wanderDirX = dir.dx;
    this.wanderDirY = dir.dy;
    this.wanderEndTime = now + SLIME_WANDER.durationMs;
    this.nextWanderTime =
      this.wanderEndTime +
      Phaser.Math.Between(SLIME_WANDER.intervalMinMs, SLIME_WANDER.intervalMaxMs);
  }

  override update(time: number): void {
    if (!this.alive) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      this.setDepth(1000 + this.y);
      return;
    }

    const px = this.targetPlayer.x;
    const py = this.targetPlayer.y;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, px, py);

    const body = this.body as Phaser.Physics.Arcade.Body;

    if (dist <= SLIME_CONST.attackRange) {
      body.setVelocity(0, 0);
      // 進入攻擊範圍立即中斷遊走
      this.wanderEndTime = 0;
      this.nextWanderTime = time + Phaser.Math.Between(SLIME_WANDER.intervalMinMs, SLIME_WANDER.intervalMaxMs);
      if (time - this.lastAttackAt >= SLIME_CONST.attackIntervalMs) {
        this.lastAttackAt = time;
        this.doAttack();
      }
    } else if (dist <= SLIME_CONST.aggroRange) {
      // 以 moveSpeed 追向玩家；追擊優先於遊走，立即中斷
      this.scene.physics.moveTo(this, px, py, SLIME_CONST.moveSpeed);
      this.wanderEndTime = 0;
      this.nextWanderTime = time + Phaser.Math.Between(SLIME_WANDER.intervalMinMs, SLIME_WANDER.intervalMaxMs);
    } else {
      // 閒置：遊蕩邏輯
      const now = time;
      if (this.nextWanderTime <= 0) {
        this.nextWanderTime = now + Phaser.Math.Between(SLIME_WANDER.intervalMinMs, SLIME_WANDER.intervalMaxMs);
      }
      if (this.wanderEndTime > now) {
        // 持續遊走中
        const speed = SLIME_CONST.moveSpeed * SLIME_WANDER.speedFactor;
        body.setVelocity(this.wanderDirX * speed, this.wanderDirY * speed);
      } else if (now >= this.nextWanderTime) {
        this.startWander(now);
        const speed = SLIME_CONST.moveSpeed * SLIME_WANDER.speedFactor;
        body.setVelocity(this.wanderDirX * speed, this.wanderDirY * speed);
      } else {
        body.setVelocity(0, 0);
      }
    }

    this.setDepth(1000 + this.y);
  }

  private doAttack(): void {
    const dmg = computeDamage(SLIME_CONST.atk, this.targetPlayer.stats.def);
    this.targetPlayer.takeDamage(dmg);
    // 玩家頭上傷害數字（normal）+ 紅閃由 takeDamage 處理
    showDamageText(this.scene, this.targetPlayer.x, this.targetPlayer.y - this.targetPlayer.displayHeight * 0.6, dmg, 'normal');
  }

  receiveAttack(atk: number, source: KillSource, damageStyle: DamageStyle): number {
    if (!this.alive) return 0;
    const damage = computeDamage(atk, this.def);
    this.hp -= damage;

    showDamageText(this.scene, this.x, this.y - this.displayHeight * 0.6, damage, damageStyle);

    // 受擊紅閃
    this.setTintFill(0xff4444);
    this.scene.time.delayedCall(SLIME_CONST.hitFlashMs, () => {
      if (this.alive) this.clearTint();
    });

    if (this.hp <= 0) this.die(source);
    return damage;
  }

  private die(source: KillSource): void {
    this.alive = false;
    this.hp = 0;

    if (this.idleTween) {
      this.idleTween.pause();
    }

    // 重置遊蕩狀態（死亡期間不遊走）
    this.wanderEndTime = 0;
    this.nextWanderTime = 0;
    this.wanderDirX = 0;
    this.wanderDirY = 0;

    // 粒子飛散 + 縮扁淡出
    playDeathShards(this.scene, this.x, this.y - 6);
    this.setTint(0x448833);
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.1,
      alpha: 0,
      duration: 320,
      ease: 'Cubic.easeOut',
    });

    this.onKilled(source);

    // 原出生點 5s 重生
    this.scene.time.delayedCall(SLIME_CONST.respawnMs, () => this.respawn());
  }

  private respawn(): void {
    this.setPosition(this.birthX, this.birthY);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    this.hp = SLIME_CONST.hp;
    this.alive = true;
    this.clearTint();
    this.setAlpha(1);
    this.setScale(1, 1);

    // 重置遊蕩計時（重生後恢復遊蕩，延後首次）
    this.wanderEndTime = 0;
    this.nextWanderTime = 0;
    this.wanderDirX = 0;
    this.wanderDirY = 0;

    if (this.idleTween) {
      this.idleTween.resume();
    } else {
      this.startIdleTween();
    }

    // 重生小彈跳
    this.setScale(0.6, 0.3);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 180,
      ease: 'Back.easeOut',
    });
  }
}
