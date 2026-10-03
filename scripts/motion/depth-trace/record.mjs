import { createServer } from 'vite';
import { mkdirSync, existsSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const out = process.env.DEPTH_PROBE_OUT || '../motion-benchmark-correction/depth-correction';
mkdirSync(`${out}/video`, { recursive: true });
// Reuse the installed ffmpeg in a task-local cache; no installation/system changes.
const cache = resolve(out, '.playwright');
const revision = JSON.parse(readFileSync('node_modules/playwright-core/browsers.json', 'utf8')).browsers.find(b => b.name === 'ffmpeg').revision;
const ffmpeg = resolve(cache, `ffmpeg-${revision}`, 'ffmpeg-linux');
if (existsSync('/usr/bin/ffmpeg')) {
  mkdirSync(resolve(cache, `ffmpeg-${revision}`), { recursive: true });
  if (!existsSync(ffmpeg)) symlinkSync('/usr/bin/ffmpeg', ffmpeg);
  process.env.PLAYWRIGHT_BROWSERS_PATH = cache;
}
const { chromium } = await import('playwright');
const server = await createServer({
  configFile: false, optimizeDeps: { noDiscovery: true }, cacheDir: `${out}/.vite`,
  server: { port: 5193, host: '127.0.0.1', strictPort: true, hmr: false, watch: { ignored: ['**'] } },
});
await server.listen();
const browser = await chromium.launch({ executablePath: '/tmp/chromium', headless: true, args: ['--disable-dev-shm-usage'] });
const result = { complete: false, viewport: { width: 960, height: 720 }, errors: [], consoleErrors: [], checkpoints: [], note: 'Completion, rendering cost and fidelity are separate. lastSubmitMs measures synchronous CPU submission, not GPU duration.' };
const save = () => writeFileSync(`${out}/record-result.json`, JSON.stringify(result, null, 2));
try {
  const context = await browser.newContext({ viewport: result.viewport, deviceScaleFactor: 1, recordVideo: { dir: `${out}/video`, size: result.viewport } });
  const page = await context.newPage();
  page.on('pageerror', error => { result.errors.push(String(error)); save(); });
  page.on('console', msg => { if (msg.type() === 'error') result.consoleErrors.push(msg.text()); });
  page.on('crash', () => { result.crashed = true; save(); });
  const loadingStarted = performance.now();
  await page.goto('http://127.0.0.1:5193/scripts/motion/depth-trace/fixture.html');
  await page.waitForSelector('[data-assets-ready=true]', { timeout: 60000 });
  result.loadingMs = performance.now() - loadingStarted;
  result.batching = await page.locator('canvas').evaluate(canvas => ({actorSourceMeshes:canvas.dataset.actorSourceMeshes,actorBatches:canvas.dataset.actorBatches,actorTrianglesBefore:canvas.dataset.actorTrianglesBefore,actorTrianglesAfter:canvas.dataset.actorTrianglesAfter,wallSourceMeshes:canvas.dataset.wallSourceMeshes,wallBatches:canvas.dataset.wallBatches}));
  await page.evaluate(() => {
    const canvas = root.querySelector('canvas');
    const initial = { renderCount: Number(canvas.dataset.renderCount || 0), drawCalls: Number(canvas.dataset.totalDrawCalls || 0), duplicateSkips: Number(canvas.dataset.duplicateSkips || 0) };
    window.__depthProbe = { started: performance.now(), initial, frames: [], events: [], longTasks: [] };
    const probe = window.__depthProbe;
    let lastCount = initial.renderCount;
    new MutationObserver(() => {
      const count = Number(canvas.dataset.renderCount || 0);
      if (count === lastCount) return;
      lastCount = count;
      probe.frames.push({ ms: performance.now() - probe.started, progress: Number(canvas.dataset.renderedProgress), count, drawCalls: Number(canvas.dataset.drawCalls), totalDrawCalls: Number(canvas.dataset.totalDrawCalls), submitMs: Number(canvas.dataset.lastSubmitMs) });
    }).observe(canvas, { attributes: true, attributeFilter: ['data-render-count'] });
    for (const type of ['wheel', 'pointerdown', 'touchstart', 'keydown', 'webglcontextlost', 'webglcontextrestored']) {
      root.addEventListener(type, event => probe.events.push({ type, ms: performance.now() - probe.started, target: event.target.tagName }), true);
    }
    try { new PerformanceObserver(list => probe.longTasks.push(...list.getEntries().map(e => ({ start: e.startTime - probe.started, duration: e.duration })))).observe({ type: 'longtask', buffered: false }); } catch {}
    demo.replay();
  });
  const replayStarted = performance.now();
  save();
  // Poll actual state, persist partial measurements, and stop at endpoint or the bounded observation limit.
  while (performance.now() - replayStarted < 60000) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const snapshot = await page.evaluate(() => {
      const canvas = root.querySelector('canvas'), probe = window.__depthProbe;
      return { progress: Number(root.dataset.progress), renderedProgress: Number(canvas.dataset.renderedProgress), playing: root.dataset.playing, webgl: root.dataset.webgl ?? 'ready', scene: canvas.dataset.scene, renderCount: Number(canvas.dataset.renderCount), totalDrawCalls: Number(canvas.dataset.totalDrawCalls), drawCalls: Number(canvas.dataset.drawCalls), duplicateSkips: Number(canvas.dataset.duplicateSkips || 0), pageElapsedMs: performance.now() - probe.started };
    });
    result.checkpoints.push({ wallMs: performance.now() - replayStarted, ...snapshot });
    result.final = snapshot;
    result.wallMs = performance.now() - replayStarted;
    result.complete = snapshot.renderedProgress >= .999 && snapshot.progress >= .999 && snapshot.playing === 'false';
    save();
    if (result.complete || (snapshot.playing === 'false' && snapshot.progress < .999)) break;
  }
  result.probe = await page.evaluate(() => window.__depthProbe);
  const frames = result.probe.frames;
  const intervals = frames.slice(1).map((frame, i) => frame.ms - frames[i].ms).sort((a, b) => a - b);
  result.metrics = {
    completedRenders: result.final.renderCount - result.probe.initial.renderCount,
    drawCalls: result.final.totalDrawCalls - result.probe.initial.drawCalls,
    duplicateSkips: result.final.duplicateSkips - result.probe.initial.duplicateSkips,
    medianFrameIntervalMs: intervals[Math.floor(intervals.length * .5)] ?? null,
    p95FrameIntervalMs: intervals[Math.floor(intervals.length * .95)] ?? null,
    maxSubmitMs: frames.length ? Math.max(...frames.map(f => f.submitMs)) : null,
    longTasks: result.probe.longTasks.length,
  };
  const phases = [['astronaut',0,.235],['mirror',.235,.44],['green',.44,.515],['magenta',.515,.635],['blue',.635,.762],['portal',.762,.882],['contact',.882,1.001]];
  result.phaseCoverage=phases.map(([name,start,end])=>{const hits=frames.filter(f=>f.progress>=start&&f.progress<end);return {name,frames:hits.length,minDrawCalls:hits.length?Math.min(...hits.map(f=>f.drawCalls)):null,maxDrawCalls:hits.length?Math.max(...hits.map(f=>f.drawCalls)):null};});
  result.allPhasesRendered=result.phaseCoverage.every(phase=>phase.frames>0);
  result.maxProgressGap=frames.slice(1).reduce((max,f,i)=>Math.max(max,f.progress-frames[i].progress),0);
  result.maxFrameGapMs=frames.slice(1).reduce((max,f,i)=>Math.max(max,f.ms-frames[i].ms),0);
  result.video = await page.video().path();
  save();
  await context.close();
  console.log(JSON.stringify({ complete: result.complete, wallMs: result.wallMs, final: result.final, metrics: result.metrics, batching:result.batching, phaseCoverage:result.phaseCoverage, allPhasesRendered:result.allPhasesRendered, maxFrameGapMs:result.maxFrameGapMs }, null, 2));
} catch (error) {
  result.failure = String(error); save(); throw error;
} finally {
  await browser.close(); await server.close();
}
if (!result.complete) process.exitCode = 1;
