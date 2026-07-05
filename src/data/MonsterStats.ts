/** 怪物數值常數（§1 of slime task） */
export const SLIME_CONST = {
  hp: 20,
  atk: 5,
  def: 1,
  moveSpeed: 40, // px/s
  aggroRange: 90, // px，開始追擊
  attackRange: 22, // px，停下攻擊
  attackIntervalMs: 1500,
  xpReward: 40, // 玩家親自擊殺才給
  respawnMs: 5000,
  hitFlashMs: 100,
} as const;

/** 史萊姆遊蕩行為常數（TASK-003） */
export const SLIME_WANDER = {
  intervalMinMs: 2000, // 下次遊走間隔下限
  intervalMaxMs: 4000, // 上限（均勻隨機）
  durationMs: 1000, // 每次遊走行走時間
  speedFactor: 0.5, // 遊走速度 = moveSpeed × 此係數
  radius: 80, // 遊蕩半徑：與出生點距離上限
} as const;
