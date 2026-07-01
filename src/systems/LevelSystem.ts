import Phaser from 'phaser';
import { showLevelUpFlair } from '../utils/DamageText';

export const XP_PER_KILL = 25;

export interface Levelable {
  level: number;
  xp: number;
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  sprite: Phaser.GameObjects.Sprite;
}

export function xpToNextLevel(level: number): number {
  return level * 50;
}

export function grantXp(scene: Phaser.Scene, entity: Levelable, amount: number): boolean {
  entity.xp += amount;
  let leveledUp = false;

  while (entity.xp >= xpToNextLevel(entity.level)) {
    entity.xp -= xpToNextLevel(entity.level);
    entity.level += 1;
    entity.maxHp += 10;
    entity.hp = entity.maxHp;
    entity.atk += 1;
    entity.def += 1;
    leveledUp = true;

    showLevelUpFlair(scene, entity.sprite.x, entity.sprite.y, entity.level);
  }

  return leveledUp;
}
