import Phaser from 'phaser';
import { GameState } from '../data/GameState';
import type { ClassData } from '../data/ClassStats';
import { findNearestDummy, performAttack } from '../systems/CombatSystem';
import { grantXp, XP_PER_KILL, type Levelable } from '../systems/LevelSystem';
import type TrainingDummy from './TrainingDummy';

export default class Player extends Phaser.GameObjects.Sprite implements Levelable {
  level = 1;
  xp = 0;
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  readonly playerClass: string;
  readonly attackSpeed: number;

  private speed = 120;
  private lastAttackTime = 0;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private attackKey!: Phaser.Input.Keyboard.Key;
  private altAttackKey!: Phaser.Input.Keyboard.Key;
  private dummies: TrainingDummy[] = [];
  private onDummyKill?: () => void;

  // 滑鼠點擊移動目標（click-to-move）
  private moveTarget?: { x: number; y: number };

  get sprite(): Phaser.GameObjects.Sprite {
    return this;
  }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const classData: ClassData = GameState.getClassData();
    const texKey = `player_${classData.id}`;
    super(scene, x, y, texKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.playerClass = classData.id;
    this.maxHp = classData.hp;
    this.hp = classData.hp;
    this.atk = classData.atk;
    this.def = classData.def;
    this.attackSpeed = classData.attackSpeed;

    // Class color is now baked into the generated sprite; only tiny accent possible
    this.setDepth(y);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    // Slightly taller body to match new class sprites (visual center ~ higher)
    body.setSize(18, 22);
    body.setOffset(7, 13);

    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasd = {
        W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      this.attackKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.altAttackKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    }

    // 滑鼠左鍵點擊移動：設定目的地，角色會持續走向該點（可被鍵盤操作打斷）
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.setMoveTarget(pointer.worldX, pointer.worldY);
      }
    });
  }

  setMoveTarget(x: number, y: number): void {
    this.moveTarget = { x, y };
  }

  setDummies(dummies: TrainingDummy[], onKill: () => void): void {
    this.dummies = dummies;
    this.onDummyKill = onKill;
  }

  update(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    let vx = 0;
    let vy = 0;

    const kLeft = this.cursors?.left.isDown || this.wasd?.A.isDown;
    const kRight = this.cursors?.right.isDown || this.wasd?.D.isDown;
    const kUp = this.cursors?.up.isDown || this.wasd?.W.isDown;
    const kDown = this.cursors?.down.isDown || this.wasd?.S.isDown;

    const keyboardMoving = kLeft || kRight || kUp || kDown;

    if (keyboardMoving) {
      // 鍵盤優先，同時清除滑鼠目的地
      if (kLeft) vx = -1;
      else if (kRight) vx = 1;

      if (kUp) vy = -1;
      else if (kDown) vy = 1;

      this.moveTarget = undefined;
    } else if (this.moveTarget) {
      // 滑鼠點擊移動（click-to-move）：走向目的地，直到抵達或被鍵盤打斷
      const dist = Phaser.Math.Distance.Between(this.x, this.y, this.moveTarget.x, this.moveTarget.y);
      if (dist < 6) {
        this.moveTarget = undefined;
      } else {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.moveTarget.x, this.moveTarget.y);
        vx = Math.cos(angle);
        vy = Math.sin(angle);
      }
    }

    if (vx !== 0 && vy !== 0) {
      const norm = Math.SQRT1_2;
      vx *= norm;
      vy *= norm;
    }

    body.setVelocity(vx * this.speed, vy * this.speed);
    this.setDepth(this.y);

    if (
      Phaser.Input.Keyboard.JustDown(this.attackKey) ||
      Phaser.Input.Keyboard.JustDown(this.altAttackKey)
    ) {
      this.tryAttack();
    }
  }

  private tryAttack(): void {
    const now = this.scene.time.now;
    if (now - this.lastAttackTime < this.attackSpeed) return;

    const target = findNearestDummy(this.x, this.y, this.dummies, 56);
    if (!target) return;

    this.lastAttackTime = now;
    performAttack(
      this.scene,
      { atk: this.atk, playerClass: this.playerClass, sprite: this },
      target,
      () => {
        grantXp(this.scene, this, XP_PER_KILL);
        this.onDummyKill?.();
      },
    );
  }
}
