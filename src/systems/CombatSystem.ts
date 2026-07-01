import Phaser from 'phaser';
import { computeDamage } from '../data/ClassStats';
import { showDamageText } from '../utils/DamageText';
import { createAttackEffect } from '../utils/VisualEffects';
import type TrainingDummy from '../entities/TrainingDummy';

export interface Attacker {
  atk: number;
  playerClass?: string;
  sprite: Phaser.GameObjects.Sprite;
}

export function findNearestDummy(
  x: number,
  y: number,
  dummies: TrainingDummy[],
  range: number,
): TrainingDummy | null {
  let nearest: TrainingDummy | null = null;
  let minDist = range;

  for (const dummy of dummies) {
    if (!dummy.isAlive) continue;
    const dist = Phaser.Math.Distance.Between(x, y, dummy.x, dummy.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = dummy;
    }
  }

  return nearest;
}

export function performAttack(
  scene: Phaser.Scene,
  attacker: Attacker,
  target: TrainingDummy,
  onKill?: (target: TrainingDummy) => void,
): boolean {
  if (!target.isAlive) return false;

  const damage = computeDamage(attacker.atk, target.def);
  const isMage = attacker.playerClass === 'mage';

  showDamageText(scene, target.x, target.y, damage, isMage);

  scene.tweens.add({
    targets: attacker.sprite,
    scaleX: 1.2,
    scaleY: 1.2,
    duration: 80,
    yoyo: true,
  });

  // Class-aware (or pet) attack visual
  createAttackEffect(
    scene,
    attacker.sprite.x,
    attacker.sprite.y,
    target.x,
    target.y,
    attacker.playerClass,
  );

  const killed = target.takeDamage(damage);
  if (killed && onKill) {
    onKill(target);
  }

  return true;
}
