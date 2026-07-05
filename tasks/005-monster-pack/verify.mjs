// TASK-005 驗收腳本：先啟動 npm run dev，再 node tasks/005-monster-pack/verify.mjs [port]
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
    return {
      player: { x: v.player.x, y: v.player.y, gold: v.player.gold, ...v.player.stats },
      monsters: (v.monsters ?? []).map((m) => ({ id: m.monsterId ?? null, x: m.x, y: m.y, hp: m.hp, alive: m.alive })),
    };
  });

const waitFor = async (fn, timeoutMs, label) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (await fn()) return true;
    await page.waitForTimeout(250);
  }
  check(`waitFor timeout: ${label}`, false, `${timeoutMs}ms`);
  return false;
};

const clickWorld = async (wx, wy) => {
  const cam = await page.evaluate(() => {
    const c = window.__game.scene.getScene('Village').cameras.main;
    return { cx: c.worldView.centerX, cy: c.worldView.centerY, zoom: c.zoom };
  });
  const box = await page.locator('#game-container canvas').boundingBox();
  await page.mouse.click(box.x + 400 + (wx - cam.cx) * cam.zoom, box.y + 300 + (wy - cam.cy) * cam.zoom);
};

const walkTo = async (wx, wy, tol, label) => {
  await clickWorld(wx, wy);
  return waitFor(async () => {
    const st = await state();
    return st && Math.hypot(st.player.x - wx, st.player.y - wy) < tol;
  }, 12000, label);
};

const nearest = (st, id) => {
  const list = st.monsters.filter((m) => m.id === id && m.alive);
  if (!list.length) return null;
  return list.reduce((a, b) =>
    Math.hypot(a.x - st.player.x, a.y - st.player.y) < Math.hypot(b.x - st.player.x, b.y - st.player.y) ? a : b);
};

await page.goto(`http://localhost:${PORT}/`);
await page.waitForFunction(() => !!window.__game, null, { timeout: 15000 });
await page.waitForTimeout(800);
await page.keyboard.press('1'); // 戰士（def 12、無寵物干擾）
await page.waitForTimeout(800);
await page.evaluate(() => {
  const tm = window.__game.textures;
  const orig = tm.addCanvas.bind(tm);
  let uid = 0;
  tm.addCanvas = (key, canvas, skipCache) => orig(`${key}-vfy${++uid}`, canvas, skipCache);
});

// §1/§3/§4：數量、種類、HP、貼圖
let s = await state();
const countBy = (id) => s.monsters.filter((m) => m.id === id).length;
check('§4 monsters 陣列共 13 隻', s.monsters.length === 13, `len=${s.monsters.length}`);
check('§3 slime×6 / chicken×3 / deer×2 / skeleton×2',
  countBy('slime') === 6 && countBy('chicken') === 3 && countBy('deer') === 2 && countBy('skeleton') === 2,
  JSON.stringify({ slime: countBy('slime'), chicken: countBy('chicken'), deer: countBy('deer'), skeleton: countBy('skeleton') }));
check('§1 各怪 HP 符合定義（20/5/25/90）',
  s.monsters.every((m) => ({ slime: 20, chicken: 5, deer: 25, skeleton: 90 })[m.id] === m.hp),
  JSON.stringify(s.monsters.map((m) => [m.id, m.hp])));
check('§5 三種新貼圖已生成', await page.evaluate(() =>
  ['chicken', 'deer', 'skeleton'].every((k) => window.__game.textures.exists(k))));

// 新怪不存在（未實作）→ 行為測試無從進行，直接收尾
if (!countBy('chicken') || !countBy('deer') || !countBy('skeleton')) {
  check('新怪缺失，行為測試全數跳過', false, '需要 chicken/deer/skeleton 就位');
  console.log(results.join('\n'));
  console.log(`\n=== ${failed} FAILED ===`);
  await browser.close();
  process.exit(1);
}

// §2 passive：站在雞旁 4 秒不掉血 → 一刀擊殺 +5 XP
const chick = nearest(s, 'chicken');
await walkTo(chick.x, chick.y, 40, '走到雞旁');
const hpByChicken = (await state()).player.hp;
await page.waitForTimeout(4000);
s = await state();
check('§2 passive：雞不會攻擊（4 秒未掉血）', s.player.hp === hpByChicken, `hp ${hpByChicken} → ${s.player.hp}`);
const xp0 = s.player.xp;
// 雞可能遊蕩/逃跑走遠——追著補刀最多 3 次
for (let i = 0; i < 3; i++) {
  const c = nearest(await state(), 'chicken');
  if (!c) break;
  const stNow = await state();
  if (Math.hypot(c.x - stNow.player.x, c.y - stNow.player.y) > 50) {
    await walkTo(c.x, c.y, 40, `追雞第${i + 1}次`);
  }
  await page.keyboard.press('Space');
  await page.waitForTimeout(1100);
  if ((await state()).player.xp !== xp0) break;
}
s = await state();
check('§2 擊殺雞 +5 XP', s.player.xp === xp0 + 5, `xp ${xp0} → ${s.player.xp}`);

// §2 retaliate：鹿被打前不攻擊；打一下後反擊
let d = nearest(await state(), 'deer');
// 先繞開房屋：經由下方路徑接近
await walkTo(500, 280, 30, '往鹿的途中點');
d = nearest(await state(), 'deer');
await walkTo(d.x, d.y, 45, '走到鹿旁');
const hpByDeer = (await state()).player.hp;
await page.waitForTimeout(4000);
s = await state();
check('§2 retaliate：鹿被打前不攻擊（4 秒未掉血）', s.player.hp === hpByDeer, `hp ${hpByDeer} → ${s.player.hp}`);
// 打一下（鹿 hp25 > 戰士單刀 10，不會死）
d = nearest(await state(), 'deer');
if (Math.hypot(d.x - s.player.x, d.y - s.player.y) > 50) await walkTo(d.x, d.y, 40, '貼近鹿');
await page.keyboard.press('Space');
const hpAfterPoke = (await state()).player.hp;
const ok = await waitFor(async () => {
  const st = await state();
  const dd = nearest(st, 'deer');
  return st.player.hp < hpAfterPoke || (dd && Math.hypot(dd.x - st.player.x, dd.y - st.player.y) <= 30);
}, 8000, '鹿反擊');
check('§2 retaliate：被打後鹿反擊/逼近', ok);
// 殺鹿 +15：補 2~4 刀
const xpBeforeDeerKill = (await state()).player.xp;
for (let i = 0; i < 5; i++) {
  await page.keyboard.press('Space');
  await page.waitForTimeout(1100);
  if ((await state()).player.xp > xpBeforeDeerKill) break;
}
s = await state();
check('§2 擊殺鹿 +15 XP', s.player.xp === xpBeforeDeerKill + 15, `xp ${xpBeforeDeerKill} → ${s.player.xp}`);

// §2 aggressive：骷髏主動追擊 + 攻擊；擊殺 +75 XP（升 Lv2）、掉大額金幣
await walkTo(400, 290, 30, '往骷髏的途中點');
let sk = nearest(await state(), 'skeleton');
await clickWorld(sk.x, sk.y);
await waitFor(async () => {
  const st = await state();
  const kk = nearest(st, 'skeleton');
  return kk && Math.hypot(kk.x - st.player.x, kk.y - st.player.y) <= 30;
}, 15000, '骷髏主動貼近');
s = await state();
sk = nearest(s, 'skeleton');
check('§2 aggressive：骷髏主動貼近（≤30px）', sk && Math.hypot(sk.x - s.player.x, sk.y - s.player.y) <= 30);
const hpBeforeSkel = s.player.hp;
await waitFor(async () => (await state()).player.hp < hpBeforeSkel, 6000, '骷髏攻擊玩家');
s = await state();
check('§2 骷髏會攻擊玩家（戰士每次 2 = round(8-6)）', s.player.hp < hpBeforeSkel, `hp ${hpBeforeSkel} → ${s.player.hp}`);

await page.evaluate(() => { window.__r = Math.random; Math.random = () => 0; });
const goldBeforeSkel = s.player.gold;
const lvBefore = s.player.level;
for (let i = 0; i < 14; i++) {
  await page.keyboard.press('Space');
  await page.waitForTimeout(1100);
  const st = await state();
  if (st.player.level > lvBefore || st.player.xp !== s.player.xp && !nearest(st, 'skeleton')) break;
  if (!st.monsters.some((m) => m.id === 'skeleton' && m.alive && Math.hypot(m.x - st.player.x, m.y - st.player.y) < 60)) break;
}
await page.evaluate(() => { Math.random = window.__r; });
s = await state();
check('§2 擊殺骷髏 +75 XP（20+75-50 → Lv2 / xp45）', s.player.level === 2 && s.player.xp === 45, `lv=${s.player.level} xp=${s.player.xp}`);
// 撿骷髏掉落（goldMin 8）
for (const l of (await page.evaluate(() => (window.__game.scene.getScene('Village').loots ?? []).map((x) => ({ x: x.x, y: x.y }))))) {
  await clickWorld(l.x, l.y);
  await page.waitForTimeout(1200);
}
s = await state();
check('§1 骷髏掉落大額金幣（≥ +8）', s.player.gold >= goldBeforeSkel + 8, `gold ${goldBeforeSkel} → ${s.player.gold}`);

check('回歸：slime 仍在且滿血待命', (await state()).monsters.filter((m) => m.id === 'slime' && m.alive).length >= 5);
check('無 page errors', pageErrors.length === 0, pageErrors.join('; '));

console.log(results.join('\n'));
console.log(failed === 0 ? '\n=== ALL PASS ===' : `\n=== ${failed} FAILED ===`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
