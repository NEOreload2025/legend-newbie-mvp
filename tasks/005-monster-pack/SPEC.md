# TASK-005 — 原版新手村怪物包（Monster Pack）

> 遵循 `AGENTS.md` 慣例。驗收：`tasks/005-monster-pack/verify.mjs`（不可修改）。
> 數值取材自熱血傳奇 1.76 社群資料（雞/鹿/骷髏），按本專案戰鬥尺度調整。

## 0. 目標

把史萊姆重構為**通用怪物系統**，新增三種經典怪：
雞（被動）、鹿（被打才反擊）、骷髏（主動攻擊的門檻怪）。

## 1. 通用怪物定義（重構 `src/data/MonsterStats.ts`）

```ts
export type MonsterId = 'slime' | 'chicken' | 'deer' | 'skeleton';
export type AggroMode = 'aggressive' | 'retaliate' | 'passive';

export interface MonsterDef {
  id: MonsterId;
  nameZh: string;
  textureKey: string;      // 同 id
  hp: number;
  atk: number;             // passive 怪填 0
  def: number;
  moveSpeed: number;       // px/s
  aggroMode: AggroMode;
  aggroRange: number;      // aggressive 用；retaliate 的脫戰距離固定 150
  attackRange: number;
  attackIntervalMs: number;
  xpReward: number;
  respawnMs: number;
  goldMin: number;
  goldMax: number;
  potionDropChance: number;
}

export const MONSTER_DEFS: Record<MonsterId, MonsterDef> = {
  slime:    { id: 'slime',    nameZh: '史萊姆', textureKey: 'slime',    hp: 20, atk: 5, def: 1, moveSpeed: 40, aggroMode: 'aggressive', aggroRange: 90,  attackRange: 22, attackIntervalMs: 1500, xpReward: 40, respawnMs: 5000, goldMin: 3, goldMax: 8,  potionDropChance: 0.3 },
  chicken:  { id: 'chicken',  nameZh: '雞',     textureKey: 'chicken',  hp: 5,  atk: 0, def: 0, moveSpeed: 50, aggroMode: 'passive',    aggroRange: 0,   attackRange: 0,  attackIntervalMs: 0,    xpReward: 5,  respawnMs: 4000, goldMin: 1, goldMax: 2,  potionDropChance: 0 },
  deer:     { id: 'deer',     nameZh: '鹿',     textureKey: 'deer',     hp: 25, atk: 3, def: 0, moveSpeed: 55, aggroMode: 'retaliate',  aggroRange: 0,   attackRange: 24, attackIntervalMs: 1500, xpReward: 15, respawnMs: 6000, goldMin: 2, goldMax: 4,  potionDropChance: 0.1 },
  skeleton: { id: 'skeleton', nameZh: '骷髏',   textureKey: 'skeleton', hp: 90, atk: 8, def: 2, moveSpeed: 55, aggroMode: 'aggressive', aggroRange: 100, attackRange: 24, attackIntervalMs: 1400, xpReward: 75, respawnMs: 8000, goldMin: 8, goldMax: 15, potionDropChance: 0.4 },
};
```

- 既有 `SLIME_CONST`/`SLIME_WANDER` 併入上表與共用遊蕩常數（`MONSTER_WANDER`，值沿用原 SLIME_WANDER）；不留重複定義

## 2. 通用怪物實體（新檔 `src/entities/Monster.ts`，**刪除** `src/entities/Slime.ts`）

- `Monster extends Phaser.Physics.Arcade.Sprite implements Attackable`，以 `MonsterDef` 驅動
- 沿用現有 Slime 的全部機制：遊蕩（半徑 80）、受擊紅閃、傷害數字、死亡粒子+縮扁淡出、
  原出生點重生、掉寶（金幣範圍與藥水機率改用 def 值）、depth = 1000 + y
- **AI 模式**：
  - `aggressive`：與現有史萊姆相同（≤ aggroRange 追、≤ attackRange 停下攻擊）
  - `retaliate`：平時只遊蕩；`receiveAttack` 被打後進入反擊狀態（追擊+攻擊玩家），
    玩家距離 > 150px 時脫戰回到遊蕩；死亡/重生重置狀態
  - `passive`：只遊蕩、永不攻擊；被打時朝攻擊來向的**反方向**以 `moveSpeed × 2` 逃跑 1 秒
- 待機 squash & stretch 視覺沿用

## 3. 佈點（`src/utils/IsoMap.ts`）

以 `MONSTER_SPAWNS: readonly { id: MonsterId; col: number; row: number }[]` 取代 `SLIME_TILES`：

- slime ×6：沿用現有六點 `(3,9) (6,10) (3,13) (15,2) (17,3) (15,5)`
- chicken ×3：`(7,4) (12,5) (6,9)`（村莊附近）
- deer ×2：`(3,5) (18,9)`
- skeleton ×2：`(1,9) (19,9)`（地圖東西兩側）

（以上座標已檢查不與房屋/樹木碰撞區重疊）

## 4. 場景整合（VillageScene）

- `this.monsters: Monster[]`（**命名必須是 `monsters`**，驗證腳本讀取；不再有 `slimes` 欄位）
- 玩家/寵物攻擊目標清單 = 假人 + monsters
- 擊殺回呼：玩家親自擊殺 → `gainKillXp(def.xpReward)`；掉寶按 def 生成
- collider(monster, obstacles) 照舊

## 5. 貼圖（BootScene 程式生成）

- `'chicken'` 約 16×16：白色圓身 + 紅雞冠 + 黃喙 + 兩腳
- `'deer'` 約 26×28：棕色身體 + 四腳 + 頭 + 一對簡單鹿角 + 白尾
- `'skeleton'` 約 22×34：灰白人形——顱骨 + 肋骨線條 + 四肢，深色眼窩
- `'slime'` 沿用

## 6. 硬性要求

- `npx tsc` 與 `npm run build` 零錯誤（根目錄跑整包）；禁用 `any`
- 不得修改：`tasks/**`、`src/systems/` 既有檔案
- 不啟動 dev server、不裝新依賴
- Monster 實體上需可讀 `monsterId`（MonsterId）、`hp`、`alive`（驗證腳本讀取）
- README「規格未明處決策」補上新決策（若有）
