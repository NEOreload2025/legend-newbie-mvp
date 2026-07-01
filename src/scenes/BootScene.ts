import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.generateTextures();
    this.scene.start('ClassSelectScene');
  }

  private generateTextures(): void {
    // Ground tiles with variants for organic feel
    this.makeDiamondTile('tile_grass', 0x3f6b2e, 0x2f5523);
    this.makeDiamondTile('tile_grass_v', 0x426f32, 0x335a27);
    this.makeDiamondTile('tile_path', 0x8b6b3a, 0x6b4f20);
    this.makeDiamondTile('tile_path_v', 0x82653a, 0x644b22);
    this.makeDiamondTile('tile_training', 0xa88c5c, 0x806b44);

    // Decor
    this.makeBushTexture();
    this.makeRockTexture();

    // Props
    this.makeHouseTexture();
    this.makeTreeTexture('tree');
    this.makeTreeTexture('tree2'); // slight variant

    // Entities
    this.makeDummyTexture();
    this.makePetTexture();

    // Class-specific players
    this.makePlayerWarriorTexture();
    this.makePlayerMageTexture();
    this.makePlayerTaoistTexture();
  }

  // ---------------- Ground tiles ----------------
  private makeDiamondTile(key: string, fill: number, edge: number): void {
    const w = 64;
    const h = 32;
    const g = this.make.graphics({ x: 0, y: 0 });

    // Shadow / edge layer
    g.fillStyle(edge, 1);
    g.beginPath();
    g.moveTo(w / 2, 0);
    g.lineTo(w, h / 2);
    g.lineTo(w / 2, h);
    g.lineTo(0, h / 2);
    g.closePath();
    g.fillPath();

    // Main fill
    g.fillStyle(fill, 1);
    g.beginPath();
    g.moveTo(w / 2, 2);
    g.lineTo(w - 2, h / 2);
    g.lineTo(w / 2, h - 2);
    g.lineTo(2, h / 2);
    g.closePath();
    g.fillPath();

    // Inner detail pass (grass blades / dirt speckles)
    if (key.includes('grass')) {
      g.lineStyle(1, 0x4f8a3a, 0.65);
      for (let i = 0; i < 11; i++) {
        const bx = 8 + ((i * 5) % 48);
        const by = 6 + ((i * 3) % 20);
        g.beginPath();
        g.moveTo(bx, by + 1);
        g.lineTo(bx + 1.5, by - 4);
        g.strokePath();
      }
      // pebbles
      g.fillStyle(0x2a3f22, 0.5);
      g.fillCircle(18, 18, 1.2);
      g.fillCircle(41, 12, 1);
      g.fillCircle(29, 23, 1.1);
    } else if (key.includes('path')) {
      // Dirt speckle texture
      g.fillStyle(0x5a3f1f, 0.55);
      for (let i = 0; i < 14; i++) {
        const px = 6 + ((i * 7 + 3) % 52);
        const py = 5 + ((i * 5 + 2) % 22);
        g.fillCircle(px, py, 1 + (i % 2) * 0.5);
      }
      // Light edge highlight
      g.lineStyle(1, 0xb38a55, 0.35);
      g.beginPath();
      g.moveTo(4, h / 2 - 1);
      g.lineTo(w / 2 - 4, 5);
      g.strokePath();
    } else {
      // Training area marks
      g.lineStyle(1, 0x5c4a2a, 0.5);
      g.beginPath();
      g.moveTo(12, 10);
      g.lineTo(52, 22);
      g.moveTo(12, 22);
      g.lineTo(52, 10);
      g.strokePath();
      g.fillStyle(0x705c38, 0.35);
      g.fillCircle(32, 16, 3);
    }

    g.generateTexture(key, w, h);
    g.destroy();
  }

  // ---------------- Decor (non-obstacles) ----------------
  private makeBushTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x2a4a22, 1);
    g.fillCircle(9, 11, 7);
    g.fillStyle(0x3a6a32, 1);
    g.fillCircle(14, 9, 6);
    g.fillCircle(6, 8, 5);
    g.lineStyle(1, 0x1f351a, 0.6);
    g.strokeCircle(9, 11, 7);
    g.generateTexture('bush', 22, 20);
    g.destroy();
  }

  private makeRockTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x4a463f, 1);
    g.fillEllipse(10, 9, 16, 11);
    g.fillStyle(0x383530, 1);
    g.fillEllipse(7, 8, 5, 4);
    g.lineStyle(1, 0x2f2c27, 0.9);
    g.strokeEllipse(10, 9, 16, 11);
    g.generateTexture('rock', 22, 18);
    g.destroy();
  }

  // ---------------- Props ----------------
  private makeHouseTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    const w = 64;
    const h = 52;

    // Shadow under
    g.fillStyle(0x1a120a, 0.35);
    g.fillRect(10, h - 6, 44, 6);

    // Main wall
    g.fillStyle(0x5c3a22, 1);
    g.fillRect(8, 18, 48, 28);
    g.lineStyle(1.5, 0x3a2518, 1);
    g.strokeRect(8, 18, 48, 28);

    // Roof (thatched look)
    g.fillStyle(0x3a2518, 1);
    g.beginPath();
    g.moveTo(6, 19);
    g.lineTo(32, 2);
    g.lineTo(58, 19);
    g.closePath();
    g.fillPath();
    g.lineStyle(1, 0x2a1a10, 1);
    g.strokePath();

    // Thatch lines
    g.lineStyle(1, 0x4a3222, 0.7);
    for (let i = 0; i < 5; i++) {
      const yy = 6 + i * 2.5;
      g.beginPath();
      g.moveTo(10 + i * 1.5, yy);
      g.lineTo(54 - i * 1.5, yy);
      g.strokePath();
    }

    // Door
    g.fillStyle(0x2f2118, 1);
    g.fillRect(26, 30, 12, 16);
    g.lineStyle(1, 0x1f160f, 1);
    g.strokeRect(26, 30, 12, 16);

    // Windows
    g.fillStyle(0xc8b070, 0.85);
    g.fillRect(14, 26, 7, 6);
    g.fillRect(43, 26, 7, 6);
    g.lineStyle(1, 0x3a2518, 0.9);
    g.strokeRect(14, 26, 7, 6);
    g.strokeRect(43, 26, 7, 6);

    g.generateTexture('house', w, h);
    g.destroy();
  }

  private makeTreeTexture(key: string): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    const trunkX = 30;
    const trunkW = key === 'tree2' ? 11 : 13;

    // Trunk
    g.fillStyle(0x4a2f18, 1);
    g.fillRect(trunkX - trunkW / 2, 32, trunkW, 18);
    g.lineStyle(1, 0x2f1f12, 0.9);
    g.strokeRect(trunkX - trunkW / 2, 32, trunkW, 18);

    // Layered foliage (darker to lighter)
    g.fillStyle(0x224a22, 1);
    g.fillEllipse(trunkX, 18, 32, 24);
    g.fillStyle(0x2f652f, 1);
    g.fillEllipse(trunkX - 2, 14, 26, 20);
    g.fillStyle(0x3c7a35, 1);
    g.fillEllipse(trunkX + 3, 11, 20, 16);

    // Highlights / rim
    g.lineStyle(1.5, 0x1f3a1f, 0.7);
    g.strokeEllipse(trunkX, 18, 32, 24);

    // A few leaf dots for texture
    g.fillStyle(0x4a8f3e, 0.6);
    g.fillCircle(trunkX - 7, 12, 2.5);
    g.fillCircle(trunkX + 8, 17, 2);

    g.generateTexture(key, 62, 52);
    g.destroy();
  }

  // ---------------- Entities ----------------
  private makeDummyTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    // Wooden post base
    g.fillStyle(0x5c4630, 1);
    g.fillRect(4, 8, 20, 30);
    g.lineStyle(1.5, 0x3a2a1f, 1);
    g.strokeRect(4, 8, 20, 30);

    // Straw / target top
    g.fillStyle(0xa08050, 1);
    g.fillRect(2, 2, 24, 10);
    g.lineStyle(1, 0x5c4630, 0.9);
    g.strokeRect(2, 2, 24, 10);

    // Cross bands
    g.lineStyle(1.5, 0x3a2a1f, 0.8);
    g.beginPath();
    g.moveTo(4, 12);
    g.lineTo(24, 12);
    g.moveTo(4, 20);
    g.lineTo(24, 20);
    g.strokePath();

    // Center circle mark
    g.lineStyle(1.5, 0x3a2a1f, 0.95);
    g.strokeCircle(14, 7, 3);

    g.generateTexture('dummy', 28, 40);
    g.destroy();
  }

  private makePetTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    const cx = 13;
    const cy = 13;

    // Body (rounded)
    g.fillStyle(0xc87a3a, 1);
    g.fillEllipse(cx - 1, cy + 2, 15, 11);

    // Head
    g.fillStyle(0xd48a42, 1);
    g.fillCircle(cx + 4, cy - 1, 6.5);

    // Ears
    g.fillStyle(0xa25a22, 1);
    g.beginPath();
    g.moveTo(cx + 1, cy - 5);
    g.lineTo(cx - 2, cy - 10);
    g.lineTo(cx + 3, cy - 6);
    g.closePath();
    g.fillPath();
    g.beginPath();
    g.moveTo(cx + 8, cy - 5);
    g.lineTo(cx + 11, cy - 10);
    g.lineTo(cx + 7, cy - 6);
    g.closePath();
    g.fillPath();

    // Snout
    g.fillStyle(0x8a5528, 1);
    g.fillEllipse(cx + 8, cy + 1, 4, 3);

    // Eyes (lively)
    g.fillStyle(0x222222, 1);
    g.fillCircle(cx + 2, cy - 2, 1.4);
    g.fillCircle(cx + 6, cy - 2, 1.4);
    g.fillStyle(0xeeeecc, 0.9);
    g.fillCircle(cx + 2.3, cy - 2.4, 0.6);
    g.fillCircle(cx + 6.3, cy - 2.4, 0.6);

    // Tail
    g.fillStyle(0xb36a32, 1);
    g.beginPath();
    g.moveTo(cx - 7, cy + 3);
    g.lineTo(cx - 13, cy - 1);
    g.lineTo(cx - 9, cy + 7);
    g.closePath();
    g.fillPath();

    // Tiny legs
    g.fillStyle(0xa25a22, 1);
    g.fillRect(cx - 4, cy + 6, 2.5, 4);
    g.fillRect(cx + 2, cy + 6, 2.5, 4);

    // Outline
    g.lineStyle(1, 0x5a3a22, 0.85);
    g.strokeEllipse(cx - 1, cy + 2, 15, 11);
    g.strokeCircle(cx + 4, cy - 1, 6.5);

    g.generateTexture('pet', 26, 24);
    g.destroy();
  }

  // ---------------- Class players (distinct) ----------------
  private makePlayerWarriorTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    // Legs (dark)
    g.fillStyle(0x2a2118, 1);
    g.fillRect(11, 26, 5, 10);
    g.fillRect(17, 26, 5, 10);
    // Body / armor (red-brown)
    g.fillStyle(0xb33a2e, 1);
    g.fillRect(9, 13, 15, 14);
    g.lineStyle(1.5, 0x3a1f18, 1);
    g.strokeRect(9, 13, 15, 14);
    // Belt
    g.fillStyle(0x3a2518, 1);
    g.fillRect(9, 22, 15, 3);
    // Head + helm
    g.fillStyle(0xe8c8a0, 1);
    g.fillCircle(16, 10, 5);
    g.fillStyle(0x5a2a22, 1);
    g.fillRect(11, 5, 10, 7); // helm
    // Sword on side
    g.lineStyle(2.5, 0x888888, 1);
    g.beginPath();
    g.moveTo(24, 15);
    g.lineTo(28, 28);
    g.strokePath();
    g.lineStyle(1.5, 0x3a2518, 1);
    g.beginPath();
    g.moveTo(24, 18);
    g.lineTo(27, 18);
    g.strokePath();
    // Shoulder accent
    g.fillStyle(0x8a2a22, 1);
    g.fillRect(9, 13, 4, 6);

    g.generateTexture('player_warrior', 32, 38);
    g.destroy();
  }

  private makePlayerMageTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    // Robe bottom
    g.fillStyle(0x2f4a9e, 1);
    g.fillRect(10, 22, 13, 14);
    g.lineStyle(1, 0x1f2f6a, 0.9);
    g.strokeRect(10, 22, 13, 14);
    // Torso
    g.fillStyle(0x3355aa, 1);
    g.fillRect(10, 14, 13, 9);
    // Head + hood
    g.fillStyle(0xe8c8a0, 1);
    g.fillCircle(16, 10, 4.5);
    g.fillStyle(0x1f2f6a, 1);
    g.fillEllipse(16, 9, 11, 7);
    // Staff
    g.lineStyle(2, 0x6b5533, 1);
    g.beginPath();
    g.moveTo(25, 12);
    g.lineTo(26, 30);
    g.strokePath();
    g.fillStyle(0xd4b85a, 1);
    g.fillCircle(26, 9, 3);
    g.lineStyle(1, 0x8a6a22, 0.8);
    g.strokeCircle(26, 9, 3);
    // Trim
    g.fillStyle(0xd4b85a, 0.7);
    g.fillRect(11, 20, 11, 2);

    g.generateTexture('player_mage', 32, 38);
    g.destroy();
  }

  private makePlayerTaoistTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    // Legs
    g.fillStyle(0x2a3a2f, 1);
    g.fillRect(11, 26, 5, 10);
    g.fillRect(17, 26, 5, 10);
    // Robe body (teal-green)
    g.fillStyle(0x2e7a5e, 1);
    g.fillRect(9, 13, 15, 14);
    g.lineStyle(1.5, 0x1f4a3a, 1);
    g.strokeRect(9, 13, 15, 14);
    // Sash / accent
    g.fillStyle(0xc8a44a, 1);
    g.fillRect(9, 21, 15, 3);
    // Head
    g.fillStyle(0xe8c8a0, 1);
    g.fillCircle(16, 10, 5);
    // Head wrap / simple hat
    g.fillStyle(0x3a5a48, 1);
    g.fillRect(12, 6, 8, 5);
    // Small talisman detail
    g.fillStyle(0xc8a44a, 1);
    g.fillRect(22, 17, 3, 5);
    g.lineStyle(1, 0x3a2a1a, 0.7);
    g.strokeRect(22, 17, 3, 5);
    // Shoulder wrap
    g.fillStyle(0x1f4a3a, 1);
    g.fillRect(8, 13, 4, 5);

    g.generateTexture('player_taoist', 32, 38);
    g.destroy();
  }
}
