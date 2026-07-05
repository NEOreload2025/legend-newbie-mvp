/** 共同可攻擊目標介面（§7） */
import type { CombatantStats } from '../systems/CombatSystem';

export type KillSource = 'player' | 'pet';
export type DamageStyle = 'normal' | 'mage';

export interface Attackable {
  x: number;
  y: number;
  alive: boolean;
  /** 即時戰鬥屬性（反映等級成長），供 resolveAttack 使用 */
  combatStats: CombatantStats;
  /** 顯示高度（來自 Phaser Sprite），供浮動文字定位 */
  displayHeight: number;
  /** 承受一次命中傷害（由 resolveAttack 判定 hit 後呼叫）；回傳實際扣除量 */
  applyDamage(damage: number, source: KillSource, damageStyle: DamageStyle): number;
}
