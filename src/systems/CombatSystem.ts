/** 戰鬥系統：純函式，與場景解耦（§5） */

import type { StatRange } from '../data/ClassStats';

export { type StatRange };

export interface CombatantStats {
  atk: StatRange;   // MinDC..MaxDC
  def: StatRange;   // MinAC..MaxAC
  accuracy: number;
  agility: number;
}

export type AttackOutcome = { result: 'miss' | 'hit'; damage: number };

/** 區間整數擲骰：floor(rng() * (max - min + 1)) + min；max < min 時取 min */
export function rollRange(range: StatRange, rng: () => number): number {
  const min = range.min;
  const max = range.max;
  if (max < min) return min;
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * 完整攻擊判定。RNG「恰好、依序」呼叫 3 次——即使第 1 骰已判定 miss，
 * 仍須照樣消耗第 2、3 骰（結果不變），讓 RNG 序列固定可測：
 * 1) 命中骰：dodge = floor(rng() * (defender.agility + 1))；dodge > attacker.accuracy → miss
 * 2) 傷害骰：damage = rollRange(attacker.atk, rng)
 * 3) 防禦骰：armour = rollRange(defender.def, rng)
 * 未命中 → { result:'miss', damage: 0 }
 * armour >= damage → { result:'miss', damage: 0 }（被防禦硬吃）
 * 否則 → { result:'hit', damage: damage - armour }（此時必然 ≥ 1）
 */
export function resolveAttack(
  attacker: CombatantStats,
  defender: CombatantStats,
  rng: () => number = Math.random,
): AttackOutcome {
  // 1) 命中判定（dodge）
  const dodge = Math.floor(rng() * (defender.agility + 1));
  if (dodge > attacker.accuracy) {
    // 仍消耗後續兩次 RNG（傷害骰、防禦骰）
    rng();
    rng();
    return { result: 'miss', damage: 0 };
  }

  // 2) 傷害骰
  const damage = rollRange(attacker.atk, rng);

  // 3) 防禦骰
  const armour = rollRange(defender.def, rng);

  if (armour >= damage) {
    return { result: 'miss', damage: 0 };
  }
  return { result: 'hit', damage: damage - armour };
}

export interface Positioned {
  x: number;
  y: number;
}

/**
 * 從候選目標中找出 range 內最近的一個；找不到回傳 null。
 * alive 判定由呼叫端以 filter 先行處理或傳入 isValid。
 */
export function findNearestTarget<T extends Positioned>(
  from: Positioned,
  candidates: readonly T[],
  range: number,
  isValid: (t: T) => boolean,
): T | null {
  let best: T | null = null;
  let bestDistSq = range * range;
  for (const c of candidates) {
    if (!isValid(c)) continue;
    const dx = c.x - from.x;
    const dy = c.y - from.y;
    const distSq = dx * dx + dy * dy;
    if (distSq <= bestDistSq) {
      bestDistSq = distSq;
      best = c;
    }
  }
  return best;
}
