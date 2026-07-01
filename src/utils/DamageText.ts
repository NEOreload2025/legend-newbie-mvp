import Phaser from 'phaser';
import { showLevelUpEffect } from './VisualEffects';

export function showDamageText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  damage: number,
  isMage = false,
): void {
  const color = isMage ? '#ffdd55' : '#f8f0d8';
  const fontSize = isMage ? '17px' : '13px';

  const text = scene.add
    .text(x + (Math.random() - 0.5) * 6, y - 18, String(damage), {
      fontFamily: 'Arial, sans-serif',
      fontSize,
      color,
      stroke: '#000000',
      strokeThickness: isMage ? 3 : 2,
    })
    .setOrigin(0.5)
    .setDepth(10000);

  // Small pop on spawn for feedback
  text.setScale(isMage ? 1.15 : 0.95);
  scene.tweens.add({
    targets: text,
    scaleX: 1,
    scaleY: 1,
    y: y - 46,
    alpha: 0,
    duration: isMage ? 620 : 560,
    ease: 'Cubic.easeOut',
    onComplete: () => text.destroy(),
  });
}

export function showFloatingText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  message: string,
  color = '#ffcc00',
): void {
  const text = scene.add
    .text(x, y, message, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '19px',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    })
    .setOrigin(0.5)
    .setDepth(10000);

  // Pop + rise
  text.setScale(0.8);
  scene.tweens.add({
    targets: text,
    scaleX: 1,
    scaleY: 1,
    y: y - 42,
    alpha: 0,
    duration: 980,
    ease: 'Cubic.easeOut',
    onComplete: () => text.destroy(),
  });
}

/** Combined level-up flair: ring/sparkles + prominent text */
export function showLevelUpFlair(scene: Phaser.Scene, x: number, y: number, level: number): void {
  showLevelUpEffect(scene, x, y);

  const txt = scene.add
    .text(x, y - 32, 'LEVEL UP!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#ffeb66',
      stroke: '#000000',
      strokeThickness: 3,
    })
    .setOrigin(0.5)
    .setDepth(10010);

  scene.tweens.add({
    targets: txt,
    y: y - 52,
    alpha: 0,
    duration: 1100,
    ease: 'Cubic.easeOut',
    onComplete: () => txt.destroy(),
  });

  // Optional small level indicator
  const lv = scene.add
    .text(x, y - 50, `Lv.${level}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#ddcc88',
      stroke: '#111111',
      strokeThickness: 2,
    })
    .setOrigin(0.5)
    .setDepth(10010);

  scene.tweens.add({
    targets: lv,
    y: y - 62,
    alpha: 0,
    duration: 900,
    ease: 'Cubic.easeOut',
    delay: 120,
    onComplete: () => lv.destroy(),
  });
}
