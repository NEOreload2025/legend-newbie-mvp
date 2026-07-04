# TASK-004 — 存檔系統（Save System）

> 遵循 `AGENTS.md` 與根目錄 `SPEC.md` 慣例。驗收：`tasks/004-save-system/verify.mjs`（不可修改）。

## 0. 目標

以 localStorage 保存進度（職業/等級/XP/HP/屬性/金幣）；
重新整理後可在職業選擇畫面「繼續遊戲」，或選新職業開新局（覆蓋舊檔）。

## 1. 存檔模組（新檔 `src/systems/SaveSystem.ts`）

> 例外允許：本任務可**新增**此檔於 `src/systems/`，但不得修改該目錄下既有檔案。

```ts
export const SAVE_KEY = 'legend-newbie-save-v1';

export interface SaveData {
  classId: ClassId;
  level: number;
  xp: number;
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  gold: number;
}

export function saveGame(data: SaveData): void;      // JSON 寫入 localStorage
export function loadGame(): SaveData | null;          // 解析失敗/欄位缺漏 → null（try/catch）
export function clearSave(): void;
```

- 純函式風格：不依賴 Phaser、不依賴場景

## 2. 存檔時機

- VillageScene 訂閱 `PLAYER_EVENT_STATS_CHANGED`，每次觸發即存檔（含 gold）
- 拾取金幣/藥水、升級、受傷、擊殺後皆會因既有 emit 而自動觸發

## 3. 讀檔與繼續遊戲（ClassSelectScene / GameState / VillageScene）

- `GameState` 新增 `continueRun: boolean`（預設 false）
- ClassSelectScene：偵測 `loadGame()` 有效存檔時——
  - 畫面顯示「繼續遊戲 Continue」提示區塊（含存檔摘要：職業中文名 + `Lv.X` + `Gold N`）
  - 按鍵盤 **C** 或點擊該區塊 → `continueRun = true`、`selectedClass = save.classId` → 進 Village
  - 無存檔時不顯示
- 選擇任一職業（1/2/3 或點面板）→ `continueRun = false`、`clearSave()`（開新局）
- VillageScene 建立 Player 後：若 `continueRun` 且存檔有效 → 套用 level/xp/maxHp/hp/atk/def/gold
  並 emit 讓 HUD 即時正確；套用後 `continueRun` 重置為 false

## 4. 硬性要求

- `npx tsc` 與 `npm run build` 零錯誤（在專案根目錄跑整包，不要對單檔跑 tsc）；禁用 `any`
- 不得修改：`tasks/**`、`src/systems/` 既有檔案（新增 SaveSystem.ts 除外）
- 不啟動 dev server、不裝新依賴
- README「規格未明處決策」補上新決策（若有）
