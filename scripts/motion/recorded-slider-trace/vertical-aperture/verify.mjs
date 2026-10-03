import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const origin = process.env.UI_TEST_BASE_URL || 'http://127.0.0.1:5173';
const out = resolve('../motion-benchmark-correction/slider-corrections/vertical-aperture');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/tmp/chromium', headless: true, args: ['--disable-dev-shm-usage'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
const page = await context.newPage();
const errors = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
const check = (name, passed, detail) => { checks.push({ name, passed, detail }); if (!passed) console.error('FAIL', name, detail); };
const state = () => page.locator('[data-demo-stage]').evaluate(el => ({ ...el.dataset }));
try {
 await page.goto(`${origin}/ui-gallery/sliders/vertical-aperture/`);
 await page.waitForSelector('[data-demo-ready="true"]');
 await page.waitForFunction(() => Array.from(document.images).every(i => i.complete));
 await page.waitForTimeout(500);
 check('seven local material assets loaded', await page.evaluate(async () => (await Promise.all(['garden','breakfast','bike','monitor','night','steps','cafe'].map(n => fetch(`/ui-gallery/sliders/vertical-aperture/assets/${n}.webp`).then(r => r.ok)))).every(Boolean)));
 check('no asset errors', !(await state()).assetError);
 await page.locator('.motion-lab').screenshot({ path: `${out}/desktop.png` });
 await page.locator('[data-index="6"]').click(); await page.waitForTimeout(450);
 check('ruler selection settles on scene7', (await state()).position === '6', await state());
 await page.locator('[data-next]').click(); await page.waitForTimeout(450);
 check('last-to-first cyclic next', (await state()).position === '0', await state());
 await page.locator('.vertical-aperture__viewport').focus(); await page.keyboard.press('End'); await page.waitForTimeout(450);
 check('keyboard End selects last', (await state()).position === '6');
 await page.keyboard.press('Home'); await page.waitForTimeout(450);
 check('keyboard Home selects first', (await state()).position === '0');
 await page.locator('[data-demo-replay]').click(); await page.waitForTimeout(250);
 const before = Number((await state()).filmPosition);
 await page.locator('[data-index="4"]').click(); await page.waitForTimeout(450);
 check('ruler interrupts trace without stale replay', (await state()).position === '4' && (await state()).mode === 'idle', { before, after: await state() });
 await page.locator('[data-demo-replay]').click(); await page.waitForTimeout(180); await page.locator('[data-demo-reset]').click(); await page.waitForTimeout(550);
 check('reset cancels active trace', Math.abs(Number((await state()).filmPosition) - 1.358) < .001 && (await state()).playing === 'false', await state());
 for (let i=0;i<4;i++) { await page.locator('[data-demo-replay]').click(); await page.locator('[data-demo-reset]').click(); }
 await page.waitForTimeout(450);
 check('repeated replay/reset stable', (await state()).traceTime === '0.0' && (await state()).playing === 'false');
 const bounds = await page.locator('.vertical-aperture__viewport').boundingBox();
 await page.mouse.move(bounds.x + bounds.width*.8, bounds.y+bounds.height*.5); await page.mouse.down();
 await page.mouse.move(bounds.x + bounds.width*.3, bounds.y+bounds.height*.5, { steps: 8 });
 const dragging = await state(); await page.mouse.up(); await page.waitForTimeout(450);
 check('horizontal drag is continuous then settles', dragging.mode === 'drag' && Number((await state()).filmPosition) % 1 === 0, { dragging, settled: await state() });
 // Synthetic cross-axis/cancellation events test the handlers without hijacking scroll.
 await page.locator('[data-demo-reset]').click();
 await page.locator('.vertical-aperture__viewport').evaluate(el => {
  el.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 41, button: 0, clientX: 120, clientY: 120 }));
  el.dispatchEvent(new PointerEvent('pointermove', { pointerId: 41, clientX: 122, clientY: 190 }));
  el.dispatchEvent(new PointerEvent('pointerup', { pointerId: 41, clientX: 122, clientY: 190 }));
 });
 check('vertical gesture leaves film position unchanged', Number((await state()).filmPosition) === 1.358);
 const dragBox = await page.locator('.vertical-aperture__viewport').boundingBox();
 await page.mouse.move(dragBox.x + dragBox.width*.7, dragBox.y + dragBox.height*.5); await page.mouse.down();
 await page.mouse.move(dragBox.x + dragBox.width*.45, dragBox.y + dragBox.height*.5, { steps: 5 });
 await page.locator('.vertical-aperture__viewport').evaluate(el => el.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1 })));
 await page.mouse.up(); await page.waitForTimeout(450);
 check('pointer cancellation settles and releases drag', (await state()).mode === 'idle' && (await page.locator('.vertical-aperture__viewport').getAttribute('data-dragging')) === null);
 await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(80);
 check('system reduced-motion preference remounts', (await state()).reducedMotion === 'true' && (await state()).playing === 'false');
 await page.emulateMedia({ reducedMotion: 'no-preference' });
 await page.waitForFunction(() => document.querySelector('[data-demo-stage]').dataset.reducedMotion === 'false');
 await page.locator('[data-motion-toggle]').check();
 await page.locator('[data-demo-replay]').click(); await page.waitForTimeout(80);
 check('reduced motion skips animated trace and warp', (await state()).playing === 'false' && (await state()).bow === '0.000' && Number((await state()).filmPosition) % 1 === 0, await state());
 await page.locator('[data-index="5"]').click();
 check('reduced selection is immediate', (await state()).position === '5');
 for (const width of [390,320]) {
  await page.setViewportSize({ width, height: 844 });
  await page.waitForTimeout(80);
  check(`no overflow at${width}`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.locator('.motion-lab').screenshot({ path: `${out}/mobile-${width}.png` });
 }
 // Browser-history lifecycle on real gallery page.
 await page.setViewportSize({ width: 1440, height: 1000 });
 await page.goto(`${origin}/ui-gallery/sliders/`); await page.goBack();
 await page.waitForSelector('[data-demo-ready="true"]');
 await page.locator('[data-index="3"]').click(); await page.waitForTimeout(450);
 check('Back restores usable controls', (await state()).position === '3');
 // Deterministic standalone instance uses the same production renderer.
 await page.evaluate(async () => {
  window.dispatchEvent(new Event('site:before-content-replace'));
  const { createDemo } = await import('/ui-gallery/sliders/vertical-aperture/demo.js');
  document.body.innerHTML = '<div id="trace-root" style="width:1210px"></div>';
  document.body.style.cssText = 'margin:0;padding:0;background:white;';
  window.traceAbort = new AbortController();
  window.traceDemo = createDemo(document.querySelector('#trace-root'), { signal: window.traceAbort.signal, reducedMotion: false });
 });
 await page.waitForTimeout(350);
 for(const t of [0,200,400,600,800,1000,1200,1400,1600,1800,2000,2200,2400,2600,2800,3000,3200,3400,3600,3800]) {
  await page.evaluate(t => window.traceDemo.seek(t), t);
  await page.locator('.vertical-aperture__scene').screenshot({ path: `${out}/render-${String(t).padStart(4,'0')}.png` });
 }
 await page.evaluate(() => window.traceDemo.seek(1800));
 const pBeforeResize = await page.locator('#trace-root').getAttribute('data-film-position');
 await page.locator('#trace-root').evaluate(el => el.style.width = '800px'); await page.waitForTimeout(80);
 check('resize preserves sampled position', await page.locator('#trace-root').getAttribute('data-film-position') === pBeforeResize);
 await page.locator('#trace-root').evaluate(el => el.style.width = '1210px');
 await page.evaluate(() => { window.traceDemo.replay(); }); await page.waitForTimeout(80);
 await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); delete document.hidden; });
 const hiddenPosition = await page.locator('#trace-root').getAttribute('data-film-position'); await page.waitForTimeout(180);
 check('hidden-document handler pauses trace', await page.locator('#trace-root').getAttribute('data-film-position') === hiddenPosition && await page.locator('#trace-root').getAttribute('data-playing') === 'false');
 await page.evaluate(() => window.traceDemo.replay()); await page.waitForTimeout(4100);
 check('four-second trace ends and stops', await page.locator('#trace-root').evaluate(el => el.dataset.traceTime === '4000.0' && el.dataset.playing === 'false'));
 await page.evaluate(() => window.traceDemo.replay()); await page.waitForTimeout(80); await page.evaluate(() => window.traceDemo.destroy());
 const final = await page.locator('#trace-root').evaluate(el => ({ ...el.dataset }));
 await page.locator('[data-next]').click(); await page.waitForTimeout(450);
 check('destroy cancels loop and control listeners', await page.locator('#trace-root').evaluate((el, final) => el.dataset.filmPosition === final.filmPosition && el.dataset.mode === 'destroyed' && el.dataset.playing === 'false', final));
 check('no JavaScript errors', errors.length === 0, errors);
} finally {
 await writeFile(`${out}/verification.json`, JSON.stringify({ checks, errors, passed: checks.every(c=>c.passed), browser: '/tmp/chromium --disable-dev-shm-usage', limitation: 'Source exact imagery and original input/easing remain unverified; these checks establish reconstruction behavior, not full fidelity.' }, null, 2));
 await browser.close();
}
if(checks.some(c=>!c.passed)) process.exitCode = 1;
console.log(JSON.stringify({ passed: checks.filter(c=>c.passed).length, total: checks.length, errors }));
