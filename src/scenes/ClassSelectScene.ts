import Phaser from 'phaser';
import { CLASS_STATS, type PlayerClass } from '../data/ClassStats';
import { GameState } from '../data/GameState';

const CLASS_ORDER: PlayerClass[] = ['warrior', 'mage', 'taoist'];

export default class ClassSelectScene extends Phaser.Scene {
  constructor() {
    super('ClassSelectScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1208');

    this.add
      .text(400, 50, '熱血傳奇 — 新手村', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        color: '#d4a84b',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.add
      .text(400, 90, 'Choose Your Class  |  選擇職業', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#c8b890',
      })
      .setOrigin(0.5);

    CLASS_ORDER.forEach((classId, index) => {
      this.createClassPanel(classId, 150 + index * 220, 280, index + 1);
    });

    this.add
      .text(400, 520, 'Press 1 / 2 / 3 or click a class to begin', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#888888',
      })
      .setOrigin(0.5);

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ONE', () => this.selectClass('warrior'));
      this.input.keyboard.on('keydown-TWO', () => this.selectClass('mage'));
      this.input.keyboard.on('keydown-THREE', () => this.selectClass('taoist'));
    }
  }

  private createClassPanel(
    classId: PlayerClass,
    x: number,
    y: number,
    shortcut: number,
  ): void {
    const data = CLASS_STATS[classId];
    const panelW = 180;
    const panelH = 220;

    const panel = this.add
      .rectangle(x, y, panelW, panelH, 0x2a1f14, 0.9)
      .setStrokeStyle(2, data.tint)
      .setInteractive({ useHandCursor: true });

    // Use the generated class-specific player sprite for preview
    const previewKey = `player_${classId}`;
    this.add.image(x, y - 70, previewKey).setScale(0.82);
    // subtle frame around preview for definition
    this.add
      .rectangle(x, y - 70, 38, 36, 0x000000, 0)
      .setStrokeStyle(1.5, 0x665533);

    this.add
      .text(x, y - 20, `${data.nameCn}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#f0e6c8',
      })
      .setOrigin(0.5);

    this.add
      .text(x, y + 5, data.name, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    this.add
      .text(x, y + 35, data.description, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#c8b890',
        align: 'center',
        wordWrap: { width: panelW - 20 },
      })
      .setOrigin(0.5);

    this.add
      .text(x, y + 80, `HP ${data.hp}  ATK ${data.atk}  DEF ${data.def}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: '#888888',
      })
      .setOrigin(0.5);

    panel.on('pointerover', () => panel.setFillStyle(0x3a2f24, 0.95));
    panel.on('pointerout', () => panel.setFillStyle(0x2a1f14, 0.9));
    panel.on('pointerdown', () => this.selectClass(classId));

    this.add
      .text(x, y + 95, `[${shortcut}]`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#666666',
      })
      .setOrigin(0.5);
  }

  private selectClass(classId: PlayerClass): void {
    GameState.selectClass(classId);
    this.scene.start('VillageScene');
  }
}
