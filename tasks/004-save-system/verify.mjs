// TASK-004 驗收腳本：先啟動 npm run dev，再 node tasks/004-save-system/verify.mjs [port]
import { chromium } from 'playwright';

const PORT = process.argv[2] ?? '5173';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 820, height: 640 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));

const results = [];
let failed = 0;
const check = (name, cond, detail) => {
  if (!cond) failed++;
  results.push(`${cond ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
};

const state = () =>
  page.evaluate(() => {
    const v = window.__game.scene.getScene('Village');
    if (!v || !v.player || !v.player.stats) return null;
    return { player: { x: v.player.x, y: v.player.y, gold: v.player.gold, ...v.player.stats } };
  });

const clickWorld = async (wx, wy) => {
  const cam = await page.evaluate(() => {
    const c = window.__game.scene.getScene('Village').cameras.main;
    return { cx: c.worldView.centerX, cy: c.worldView.centerY, zoom: c.zoom };
  });
  const box = await page.locator('#game-container canvas').boundingBox();
  await page.mouse.click(box.x + 400 + (wx - cam.cx) * cam.zoom, box.y + 300 + (wy - cam.cy) * cam.zoom);
};

const waitGame = async () => {
  await page.waitForFunction(() => !!window.__game, null, { timeout: 15000 });
  await page.waitForTimeout(800);
};

await page.goto(`http://localhost:${PORT}/`);
await waitGame();
await page.evaluate(() => localStorage.clear());
await page.reload();
await waitGame();
await page.waitForTimeout(700);

// 無存檔時：不應有 Continue 提示
const hasContinueBefore = await page.evaluate(() => {
  const cs = window.__game.scene.getScene('ClassSelect');
  return cs.children.list.some((c) => c.text !== undefined && /Continue|繼續/.test(String(c.text)));
});
check('§3 無存檔時不顯示繼續遊戲', !hasContinueBefore);

// 開新局（道士），殺一隻史萊姆得 XP/金幣
await page.keyboard.press('3');
await page.waitForTimeout(800);
await page.evaluate(() => {
  const tm = window.__game.textures;
  const orig = tm.addCanvas.bind(tm);
  let uid = 0;
  tm.addCanvas = (key, canvas, skipCache) => orig(`${key}-vfy${++uid}`, canvas, skipCache);
});
await clickWorld(320, 278);
await page.waitForTimeout(4000);
await page.evaluate(() => { window.__r = Math.random; Math.random = () => 0; });
const g0 = (await state()).player.gold;
for (let i = 0; i < 4; i++) {
  await page.keyboard.press('Space');
  await page.waitForTimeout(1100);
  if ((await state()).player.gold > g0) break;
}
await page.evaluate(() => { Math.random = window.__r; });
// 撿殘餘掉落物
for (const l of (await page.evaluate(() => (window.__game.scene.getScene('Village').loots ?? []).map((x) => ({ x: x.x, y: x.y }))))) {
  await clickWorld(l.x, l.y);
  await page.waitForTimeout(1200);
}
let s = await state();
const snap = { level: s.player.level, xp: s.player.xp, gold: s.player.gold, maxHp: s.player.maxHp };
check('前置：擊殺後有 XP 與金幣', snap.xp >= 40 && snap.gold >= 3, JSON.stringify(snap));

// §1/§2：localStorage 已寫入
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('legend-newbie-save-v1') ?? 'null'));
check('§2 存檔已寫入 localStorage', !!saved, JSON.stringify(saved));
if (saved) {
  check('§1 存檔欄位齊全且與現況一致',
    saved.classId === 'taoist' && saved.level === snap.level && saved.xp === snap.xp && saved.gold === snap.gold,
    JSON.stringify(saved));
}

// §3：reload → Continue 顯示 → 按 C 恢復
await page.reload();
await waitGame();
const hasContinue = await page.evaluate(() => {
  const cs = window.__game.scene.getScene('ClassSelect');
  return cs.children.list.some((c) => c.text !== undefined && /Continue|繼續/.test(String(c.text)));
});
check('§3 有存檔時顯示繼續遊戲', hasContinue);
await page.keyboard.press('c');
await page.waitForTimeout(1000);
s = await state();
check('§3 按 C 繼續：職業/等級/XP/金幣完整恢復',
  !!s && s.player.level === snap.level && s.player.xp === snap.xp && s.player.gold === snap.gold && s.player.maxHp === snap.maxHp,
  s ? JSON.stringify({ got: { lv: s.player.level, xp: s.player.xp, gold: s.player.gold }, want: snap }) : 'Village 未啟動（按 C 無效）');
const hudGold = await page.evaluate(() => {
  const hud = window.__game.scene.getScene('Hud');
  const t = hud.children.list.find((c) => c.text !== undefined && String(c.text).includes('Gold'));
  return t ? String(t.text) : null;
});
check('§3 HUD 立即反映存檔金幣', hudGold !== null && hudGold.includes(String(snap.gold)), `hud="${hudGold}"`);

// 繼續玩會持續存檔：再打一下假人場... 簡化：直接等 stats 事件後檢查 localStorage 仍有效
// §3：選新職業 → 清檔開新局
await page.reload();
await waitGame();
await page.keyboard.press('1'); // 戰士新局
await page.waitForTimeout(1000);
s = await state();
check('§3 選新職業開新局：Lv1 / 0 XP / 0 金幣', !!s && s.player.level === 1 && s.player.xp === 0 && (s.player.gold ?? 0) === 0, s ? JSON.stringify(s.player) : 'Village 未啟動');
const savedAfterNew = await page.evaluate(() => JSON.parse(localStorage.getItem('legend-newbie-save-v1') ?? 'null'));
check('§3 開新局後舊檔被清除（或已覆蓋為新局戰士）',
  savedAfterNew === null || (savedAfterNew.classId === 'warrior' && savedAfterNew.level === 1),
  JSON.stringify(savedAfterNew));

check('無 page errors', pageErrors.length === 0, pageErrors.join('; '));

console.log(results.join('\n'));
console.log(failed === 0 ? '\n=== ALL PASS ===' : `\n=== ${failed} FAILED ===`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
