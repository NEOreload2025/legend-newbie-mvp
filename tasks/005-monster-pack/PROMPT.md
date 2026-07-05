請完整實作 `tasks/005-monster-pack/SPEC.md` 描述的通用怪物系統與三種新怪。

工作要求：
1. 先閱讀 `AGENTS.md`、`tasks/005-monster-pack/SPEC.md`，再閱讀 `src/entities/Slime.ts`（將被重構取代）、`src/data/MonsterStats.ts`、`src/scenes/VillageScene.ts`、`src/utils/IsoMap.ts`、`src/scenes/BootScene.ts`
2. 這是重構任務：Slime.ts 刪除、行為完整搬進通用 Monster.ts，再以 MonsterDef 差異化。重構後所有既有行為（遊蕩/追擊/掉寶/重生/XP）不得退化
3. 最後在專案根目錄執行 `npx tsc` 與 `npm run build`（不要對單一檔案跑 tsc），必須零錯誤
4. 禁止：修改 `tasks/`、修改 `src/systems/` 既有檔案、啟動 dev server、安裝新依賴
5. 完成後條列摘要：改了哪些檔案、做了哪些 SPEC 未明說的決策
