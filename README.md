# 熱血傳奇 — 新手村 MVP (Legend Newbie Village)

Phaser + TypeScript 實作的簡易等角新手村原型。

視覺風格參考早期經典熱血傳奇，全部使用程式產生圖形（無外部素材），適合快速迭代。

## 特色

- 等角地圖（草地、泥土路、訓練區、房屋、樹木）
- 三種職業：戰士、魔法師、道士（各自外觀不同 + 道士有跟寵）
- 鍵盤 + 滑鼠點擊移動
- 即時戰鬥（攻擊訓練假人）
- 升級系統 + 視覺特效
- 全部程式產生視覺（可直接 `npm run dev` 執行）

## 快速開始

```bash
npm install
npm run dev
```

開啟後選擇職業進入新手村。

## 操作方式

- **WASD / 方向鍵**：移動
- **滑鼠左鍵點擊地面**：點擊移動（設定目的地後自動走到那裡）
- **空白鍵 / J**：攻擊附近訓練假人
- 點擊職業面板或按 1/2/3 選擇職業

## 技術堆疊

- Phaser 3 (arcade physics)
- TypeScript + Vite
- 純程式生成貼圖與特效

## 開發筆記

- 所有視覺都在 `BootScene.ts` 使用 Graphics 產生
- 地圖產生在 `utils/IsoMap.ts`
- 玩家、寵物、假人分別在 `entities/`
- 戰鬥與升級在 `systems/`
- 最近一次更新：視覺大幅精進 + 滑鼠點擊移動支援

歡迎 fork 繼續擴充（更多地圖元素、技能特效、存檔等）。

## License

MIT (or whatever you prefer)
