import Phaser from 'phaser';

/**
 * VisualEffects — lightweight, self-cleaning procedural effects.
 * All effects are short-lived and destroy themselves.
 * Used for attack feedback, dummy destruction, and level-up flair.
 */

const COLORS = {
  warrior: 0xcc5533,
  mage: 0x5588ff,
  taoist: 0x33bb99,
  pet: 0x66aa77,
  damage: 0xffffff,
  levelGold: 0xffee66,
  debris: 0xc4a35a,
};

export function createAttackEffect(
  scene: Phaser.Scene,
  ax: number,
  ay: number,
  tx: number,
  ty: number,
  cls?: string,
): void {
  const g = scene.add.graphics();
  g.setDepth(Math.max(ay, ty) + 10);

  const dx = tx - ax;
  const dy = ty - ay;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  const midX = ax + dx * 0.6;
  const midY = ay + dy * 0.6;

  if (cls === 'warrior') {
    // Bold angled slash
    g.lineStyle(3, COLORS.warrior, 0.95);
    g.beginPath();
    g.moveTo(midX - ux * 14 + uy * 7, midY - uy * 14 - ux * 7);
    g.lineTo(midX + ux * 18 - uy * 5, midY + uy * 18 + ux * 5);
    g.strokePath();

    g.lineStyle(1.5, 0xffddaa, 0.7);
    g.beginPath();
    g.moveTo(midX - ux * 9 + uy * 4, midY - uy * 9 - ux * 4);
    g.lineTo(midX + ux * 12 - uy * 3, midY + uy * 12 + ux * 3);
    g.strokePath();
  } else if (cls === 'mage') {
    // Expanding energy burst
    g.lineStyle(2, COLORS.mage, 0.9);
    g.strokeCircle(midX, midY, 6);

    // radial dots
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      const px = midX + Math.cos(a) * 9;
      const py = midY + Math.sin(a) * 9;
      g.fillStyle(0xaaddff, 0.85);
      g.fillCircle(px, py, 1.8);
    }
  } else {
    // Pet / taoist swipe (green arc-ish)
    g.lineStyle(2.5, COLORS.pet, 0.9);
    g.beginPath();
    g.moveTo(midX - uy * 8, midY + ux * 8);
    g.lineTo(midX + ux * 10, midY + uy * 10);
    g.lineTo(midX + uy * 6, midY - ux * 6);
    g.strokePath();
  }

  // Common quick punch pop at contact point
  g.fillStyle(0xffffee, 0.6);
  g.fillCircle(tx + (Math.random() - 0.5) * 4, ty + (Math.random() - 0.5) * 4, 3);

  scene.tweens.add({
    targets: g,
    alpha: 0,
    duration: cls === 'mage' ? 220 : 160,
    ease: 'Cubic.easeOut',
    onComplete: () => g.destroy(),
  });
}

export function createDebris(scene: Phaser.Scene, x: number, y: number, baseColor = COLORS.debris): void {
  const pieces = 4 + Math.floor(Math.random() * 2);
  const colors = [baseColor, 0x8b6b3a, 0x6b5230, 0x9c7a4a];

  for (let i = 0; i < pieces; i++) {
    const w = 4 + Math.random() * 5;
    const h = 3 + Math.random() * 4;
    const piece = scene.add
      .rectangle(
        x + (Math.random() - 0.5) * 6,
        y + (Math.random() - 0.5) * 4,
        w,
        h,
        colors[i % colors.length],
      )
      .setDepth(y + 5);

    const vx = (Math.random() - 0.5) * 28;
    const vy = 8 + Math.random() * 18;
    const rot = (Math.random() - 0.5) * 120;

    scene.tweens.add({
      targets: piece,
      x: piece.x + vx,
      y: piece.y + vy,
      angle: piece.angle + rot,
      alpha: 0,
      duration: 520 + Math.random() * 180,
      ease: 'Cubic.easeOut',
      onComplete: () => piece.destroy(),
    });
  }
}

export function showLevelUpEffect(scene: Phaser.Scene, x: number, y: number): void {
  const ring = scene.add.graphics();
  ring.setDepth(y + 30);
  ring.lineStyle(2, COLORS.levelGold, 0.95);
  ring.strokeCircle(x, y - 8, 12);

  scene.tweens.add({
    targets: ring,
    scaleX: 2.6,
    scaleY: 2.6,
    alpha: 0,
    duration: 520,
    ease: 'Cubic.easeOut',
    onComplete: () => ring.destroy(),
  });

  // radiating sparkles / short rays
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const dist = 11 + Math.random() * 5;
    const sx = x + Math.cos(a) * dist;
    const sy = y - 8 + Math.sin(a) * dist;

    const dot = scene.add
      .circle(sx, sy, 1.6 + Math.random(), COLORS.levelGold)
      .setDepth(y + 31);

    scene.tweens.add({
      targets: dot,
      x: x + Math.cos(a) * (22 + Math.random() * 7),
      y: y - 8 + Math.sin(a) * (22 + Math.random() * 7),
      alpha: 0,
      scaleX: 0.4,
      scaleY: 0.4,
      duration: 420 + Math.random() * 120,
      ease: 'Cubic.easeOut',
      delay: Math.random() * 60,
      onComplete: () => dot.destroy(),
    });
  }

  // small inner flash
  const flash = scene.add.circle(x, y - 8, 7, 0xfff9c0, 0.6).setDepth(y + 29);
  scene.tweens.add({
    targets: flash,
    scaleX: 0.6,
    scaleY: 0.6,
    alpha: 0,
    duration: 180,
    onComplete: () => flash.destroy(),
  });
}
