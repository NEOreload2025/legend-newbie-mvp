# TASK-003 — 遊蕩怪物與刷怪區（Wandering & Spawn Zone）

> 遵循 `AGENTS.md` 與根目錄 `SPEC.md` 慣例。驗收：`tasks/003-wander-spawn/verify.mjs`（不可修改）。

## 0. 目標

史萊姆閒置時不再站樁——在出生點附近隨機遊走；地圖右上新增刷怪區 3 隻史萊姆（共 6 隻）。

## 1. 數值（加入 `src/data/MonsterStats.ts`）

```ts
export const SLIME_WANDER = {
  intervalMinMs: 2000,  // 下次遊走間隔下限
  intervalMaxMs: 4000,  // 上限（均勻隨機）
  durationMs: 1000,     // 每次遊走行走時間
  speedFactor: 0.5,     // 遊走速度 = moveSpeed × 此係數
  radius: 80,           // 遊蕩半徑：與出生點距離上限
} as const;
```

## 2. 遊蕩行為（`src/entities/Slime.ts`）

- 優先序：**追擊/攻擊（玩家 ≤ aggroRange）> 遊走**；進入追擊立即中斷遊走
- 閒置（玩家 > aggroRange）時：每隔 `intervalMinMs..intervalMaxMs` 隨機，朝隨機方向以
  `moveSpeed × speedFactor` 行走 `durationMs`，然後停下等待下一次
- **不得離出生點超過 `radius`**：若遊走目標方向會超出，改朝出生點方向走（或 clamp）
- 死亡期間不遊走；重生後恢復遊蕩
- 與障礙物碰撞照舊（撞到就停/滑動皆可）

## 3. 刷怪區（`src/utils/IsoMap.ts`）

- `SLIME_TILES` 追加 3 個右上區 tiles：`(15,2)`、`(17,3)`、`(15,5)`（已確認不與障礙物碰撞區重疊）
- 總計 6 隻史萊姆，全部行為一致（遊蕩/追擊/掉寶/重生）

## 4. 硬性要求

- `npx tsc` 與 `npm run build` 零錯誤；禁用 `any`
- 不得修改：`tasks/**`、`src/systems/**`
- 不啟動 dev server、不裝新依賴（**執行 tsc 時不要對單檔跑，避免產生 .js 污染**）
- README「規格未明處決策」補上新決策（若有）
