import Phaser from 'phaser';
import { GameState } from '../data/GameState';
import { xpToNextLevel } from '../systems/LevelSystem';
import type Player from '../entities/Player';

export default class Hud {
  private scene: Phaser.Scene;
  private player: Player;
  private levelText!: Phaser.GameObjects.Text;
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private xpBarFill!: Phaser.GameObjects.Rectangle;
  private readonly barWidth = 140;
  private readonly barHeight = 10;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.create();
  }

  private create(): void {
    const classData = GameState.getClassData();
    const depth = 20000;

    this.scene.add
      .text(12, 10, `${classData.nameCn} ${classData.name}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#f0e6c8',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setScrollFactor(0)
      .setDepth(depth);

    this.levelText = this.scene.add
      .text(12, 30, 'Lv.1', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setScrollFactor(0)
      .setDepth(depth);

    this.scene.add
      .rectangle(12, 52, this.barWidth, this.barHeight, 0x333333)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth);

    this.hpBarFill = this.scene.add
      .rectangle(12, 52, this.barWidth, this.barHeight, 0x44aa44)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 1);

    this.scene.add
      .rectangle(12, 68, this.barWidth, this.barHeight, 0x333333)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth);

    this.xpBarFill = this.scene.add
      .rectangle(12, 68, 0, this.barHeight, 0x4488cc)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 1);

    this.scene.add
      .text(400, 580, 'WASD / Arrows: Move  |  SPACE / J: Attack', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#c8b890',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(depth);
  }

  update(): void {
    const hpRatio = this.player.hp / this.player.maxHp;
    this.hpBarFill.width = this.barWidth * hpRatio;

    const xpNeeded = xpToNextLevel(this.player.level);
    const xpRatio = this.player.xp / xpNeeded;
    this.xpBarFill.width = this.barWidth * xpRatio;

    this.levelText.setText(
      `Lv.${this.player.level}  HP ${this.player.hp}/${this.player.maxHp}  XP ${this.player.xp}/${xpNeeded}`,
    );
  }
}
