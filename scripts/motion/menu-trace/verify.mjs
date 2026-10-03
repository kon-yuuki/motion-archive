import { createServer } from "vite";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const output = resolve(process.env.MENU_TRACE_OUTPUT ?? ".ui-motion-qa/menu-trace");
const evidence = resolve(process.env.MENU_SOURCE_EVIDENCE ?? "../motion-benchmark-correction/menu-audit");
mkdirSync(output, { recursive: true });
const results = [], errors = [], samples = [];
const check = (name, pass, details) => {
  results.push({ name, pass, ...(details === undefined ? {} : { details }) });
  if (!pass) console.error("FAIL", name, details ?? "");
};
const harness = `<!doctype html><html lang="ja"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Menu trace verification</title><link rel="stylesheet" href="/ui-gallery/buttons/menu-icon-morph/style.scss"><style>html,body{margin:0}.skip-link{position:absolute;transform:translateY(-200%)}*{box-sizing:border-box}button{font:inherit;cursor:pointer}#fixture .menu-icon-morph{width:100vw;height:100vh;min-height:0}</style></head><body><main id="fixture"></main><script type="module">import {createDemo} from '/ui-gallery/buttons/menu-icon-morph/demo.js';window.mountMenu=(reducedMotion=false)=>{window.menuController?.destroy();window.menuSignal=new AbortController();window.menuController=createDemo(document.querySelector('#fixture'),{signal:window.menuSignal.signal,reducedMotion})};window.mountMenu();</script></body></html>`;
const server = await createServer({
  server: { host: "127.0.0.1", port: 4187, strictPort: true },
  plugins: [{ name: "menu-trace-fixture", configureServer(server) {
    server.middlewares.use("/__menu-trace__/", async (_request, response) => {
      response.setHeader("Content-Type", "text/html");
      response.end(await server.transformIndexHtml("/__menu-trace__/", harness));
    });
  } }],
});
await server.listen();
const origin = "http://127.0.0.1:4187";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.UI_CHROMIUM_EXECUTABLE_PATH ?? "/tmp/chromium",
  args: ["--disable-dev-shm-usage"],
});
try {
  const context = await browser.newContext({ viewport: { width: 1180, height: 757 } });
  await context.route("**/*", route => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith("/_vercel/")) return route.fulfill({ body: "", contentType: "application/javascript" });
    return url.origin === origin ? route.continue() : route.abort();
  });
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  const read = () => page.locator(".menu-icon-morph").evaluate(stage => {
    const q = selector => stage.querySelector(selector);
    const css = selector => getComputedStyle(q(selector));
    const rect = selector => q(selector).getBoundingClientRect().toJSON();
    return {
      state: stage.dataset.state,
      panel: rect(".menu-icon-morph__panel"),
      panelTransform: css(".menu-icon-morph__panel").transform,
      panelDuration: css(".menu-icon-morph__panel").transitionDuration,
      panelEasing: css(".menu-icon-morph__panel").transitionTimingFunction,
      panelColor: css(".menu-icon-morph__panel").backgroundColor,
      curveWidth: parseFloat(css(".menu-icon-morph__curve-width").width),
      curveDuration: css(".menu-icon-morph__curve-width").transitionDuration,
      curveOverflow: css(".menu-icon-morph__curve-width").overflow,
      ellipseLeft: parseFloat(css(".menu-icon-morph__ellipse").left),
      overlayOpacity: parseFloat(css(".menu-icon-morph__backdrop").opacity),
      trigger: rect(".menu-icon-morph__toggle"),
      triggerTransform: css(".menu-icon-morph__toggle").transform,
      magnetTransform: css(".menu-icon-morph__magnet").transform,
      fillTransform: css(".menu-icon-morph__fill").transform,
      fillColor: css(".menu-icon-morph__fill").backgroundColor,
      glyph: rect(".menu-icon-morph__glyph"),
      bars: ["first-child", "last-child"].map(pseudo => ({
        transform: css(`.menu-icon-morph__glyph i:${pseudo}`).transform,
        height: css(`.menu-icon-morph__glyph i:${pseudo}`).height,
        duration: css(`.menu-icon-morph__glyph i:${pseudo}`).transitionDuration,
      })),
      innerPadding: css(".menu-icon-morph__inner").padding,
      innerTransform: css(".menu-icon-morph__inner").transform,
      links: [...stage.querySelectorAll(".menu-icon-morph__link")].map(link => ({
        text: link.textContent, rect: link.firstElementChild.getBoundingClientRect().toJSON(),
        font: getComputedStyle(link.firstElementChild).font,
        transform: getComputedStyle(link.parentElement).transform,
        delay: getComputedStyle(link.parentElement).transitionDelay,
      })),
      inert: q(".menu-icon-morph__panel").inert,
      hidden: q(".menu-icon-morph__panel").getAttribute("aria-hidden"),
      expanded: q(".menu-icon-morph__toggle").getAttribute("aria-expanded"),
      animations: stage.getAnimations({ subtree: true }).filter(animation => animation.playState === "running").length,
      animationTargets: stage.getAnimations({ subtree: true }).filter(animation => animation.playState === "running").map(a => ({target: a.effect.target.className, pseudo: a.effect.pseudoElement, property: a.transitionProperty})),
    };
  });
  const click = () => page.locator(".menu-icon-morph__toggle").evaluate(button => button.click());
  const pauseAt = ms => page.locator(".menu-icon-morph").evaluate((stage, time) => {
    for (const animation of stage.getAnimations({ subtree: true })) {
      animation.pause();
      animation.currentTime = time;
    }
  }, ms);
  await page.goto(`${origin}/__menu-trace__/`);
  await page.waitForFunction(() => Boolean(window.menuController));
  await page.screenshot({ path: resolve(output, "replica-closed.png") });
  const closed = await read();
  check("Closed panel is inert and offstage", closed.inert && closed.hidden === "true" && closed.panel.x > 1180, closed);
  check("Panel 800ms measured easing", closed.panelDuration === "0.8s" && closed.panelEasing === "cubic-bezier(0.7, 0, 0.2, 1)");
  check("Curve 6vw and 850ms", Math.abs(closed.curveWidth - 70.8) < .03 && closed.curveDuration === "0.85s", closed.curveWidth);
  check("Curve inherits source clipping and centered ellipse", closed.curveOverflow === "hidden" && Math.abs(closed.ellipseLeft - closed.curveWidth / 2) < .02);
  check("Trigger measured size and inset", Math.abs(closed.trigger.width - 64.9) < .05 && Math.abs(closed.trigger.top - 26.667) < .05, closed.trigger);
  check("Bars 1px / 300ms", closed.bars.every(bar => bar.height === "1px" && bar.duration === "0.3s, 0.3s"), closed.bars);
  await click();
  await page.waitForTimeout(30);
  for (const ms of [0, 100, 200, 300, 400, 500, 600, 750, 900]) {
    await pauseAt(ms);
    samples.push({ phase: "open", ms, ...await read() });
    await page.screenshot({ path: resolve(output, `replica-open-${ms}.png`) });
  }
  // Remove paused transitions and re-open normally before interaction verification.
  await page.evaluate(() => { window.menuController.reset(); window.menuController.replay(); });
  await page.waitForTimeout(1050);
  const opened = await read();
  await page.screenshot({ path: resolve(output, "replica-open-settled.png") });
  check("Opened geometry", Math.abs(opened.panel.x - 702.6497) < .05 && Math.abs(opened.panel.width - 477.3569) < .05 && Math.abs(opened.panel.height - 757.0083) < .05, opened.panel);
  check("Opened content geometry", Math.abs(opened.links[0].rect.x - 791.1584) < .1 && Math.abs(opened.links[0].rect.y - 191.3819) < .1 && Math.abs(opened.links[0].rect.height - 72.275) < .05, opened.links[0]);
  check("Opened trigger stays blue", matrix(opened.fillTransform).y === 0 && opened.fillColor === "rgb(69, 92, 233)", opened.fillTransform);
  check("Overlay .35 / curve 0 / exact dark", opened.overlayOpacity === .35 && opened.curveWidth === 0 && opened.panelColor === "rgb(28, 29, 32)");
  check("Measured stagger 0/30/60/90ms", opened.links.map(link => link.delay).join(",") === "0s,0.03s,0.06s,0.09s", opened.links.map(link => link.delay));
  check("Navigation is explicitly inert", await page.locator('[role="link"][aria-disabled="true"]').count() === 8 && await page.locator(".menu-icon-morph a[href]").count() === 0);
  await page.locator(".menu-icon-morph__toggle").focus();
  await page.keyboard.press("Tab");
  check("Tab enters navigation", await page.locator(".menu-icon-morph__link").first().evaluate(link => link === document.activeElement));
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Shift+Tab");
  check("Backward Tab wraps within component", await page.locator(".menu-icon-morph__social-links a").last().evaluate(link => link === document.activeElement));
  await page.keyboard.press("Tab");
  check("Forward Tab wraps to trigger", await page.locator(".menu-icon-morph__toggle").evaluate(button => button === document.activeElement));
  await page.keyboard.press("Tab");
  await page.keyboard.press("Escape");
  check("Escape restores focus and hides interactions", (await read()).inert && await page.locator(".menu-icon-morph__toggle").evaluate(button => button === document.activeElement));
  await page.waitForTimeout(1000);
  await click();
  await page.waitForTimeout(1000);
  await page.locator(".menu-icon-morph__backdrop").click({ position: { x: 100, y: 400 } });
  check("Overlay closes", (await read()).expanded === "false");
  // A close at each part of the entry, immediately followed by reopening.
  for (const delay of [30, 180, 460, 780]) {
    await page.evaluate(() => window.menuController.reset());
    await click(); await page.waitForTimeout(delay); await click(); await page.waitForTimeout(60); await click();
    await page.waitForTimeout(1000);
    check(`Interrupted open/close/open at ${delay}ms settles`, (await read()).state === "open" && (await read()).curveWidth === 0 && Math.abs((await read()).panel.x - 702.6497) < .05);
  }
  for (let i = 0; i < 8; i++) { await click(); await page.waitForTimeout(35); }
  await page.evaluate(() => window.menuController.reset());
  await page.waitForTimeout(1000);
  check("Repeated input then reset stays closed", (await read()).state === "closed" && (await read()).panel.x > 1180);
  await page.locator(".menu-icon-morph__toggle").focus();
  await page.keyboard.press("Enter");
  check("Enter opens the native trigger", (await read()).expanded === "true");
  await page.keyboard.press("Space");
  check("Space closes the native trigger", (await read()).expanded === "false");
  await page.evaluate(() => window.menuController.replay());
  await page.waitForTimeout(180);
  await page.evaluate(() => window.menuController.reset());
  check("Mid-transition reset is immediately closed", (await read()).state === "closed" && (await read()).animations === 0 && (await read()).panel.x > 1180);
  await page.evaluate(() => { window.menuController.replay(); window.menuController.replay(); });
  await page.waitForTimeout(1050);
  check("Repeated replay settles open", (await read()).state === "open" && (await read()).curveWidth === 0);
  await page.locator(".menu-icon-morph__link").first().focus();
  await page.evaluate(() => { const outside=document.createElement("button"); outside.textContent="Outside fixture"; outside.id="outside-focus-test"; outside.style.position="fixed"; document.body.append(outside); outside.focus(); });
  check("Leaving the component closes without stealing outside focus", (await read()).state === "closed" && await page.evaluate(() => document.activeElement.id === "outside-focus-test"));
  await page.evaluate(() => { document.querySelector("#outside-focus-test").remove(); window.menuController.reset(); });
  // Magnetic movement is separate from layout tracing and uses observed strengths.
  await page.mouse.move(900, 300);
  const target = (await read()).trigger;
  await page.mouse.move(target.x + target.width / 2 + 15, target.y + target.height / 2 - 12);
  await page.waitForTimeout(1650);
  const magnetic = await read();
  check("Trigger strength 50 / nested bars 25", Math.abs(matrix(magnetic.triggerTransform).x - 15 / 65 * 50) < .2 && Math.abs(matrix(magnetic.magnetTransform).x - 15 / 65 * 25) < .2, magnetic.triggerTransform);
  await page.mouse.move(900, 300);
  await page.waitForTimeout(1700);
  check("Magnet returns on leave", Math.abs(matrix((await read()).triggerTransform).x) < .05);
  for (const width of [540, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(() => { window.menuController.reset(); window.menuController.replay(); });
    await page.waitForTimeout(1100);
    const mobile = await read();
    check(`${width}px full-width drawer`, Math.abs(mobile.panel.width - width) < .05 && Math.abs(mobile.panel.x) < .03, mobile.panel);
    check(`${width}px mobile delays`, mobile.links.map(link => link.delay).join(",") === "0.1s,0.13s,0.16s,0.19s", mobile.links);
    check(`${width}px no horizontal page overflow`, await page.evaluate(() => document.documentElement.scrollWidth === innerWidth));
    await page.screenshot({ path: resolve(output, `replica-mobile-${width}.png`) });
  }
  await page.setViewportSize({ width: 1180, height: 757 });
  await page.evaluate(() => { window.mountMenu(true); window.menuController.replay(); });
  const reduced = await read();
  check("Reduced motion is immediate", reduced.animations === 0 && reduced.curveWidth === 0 && Math.abs(reduced.panel.x - 702.6497) < .05, reduced);
  await page.screenshot({ path: resolve(output, "replica-reduced-motion.png") });
  await page.evaluate(() => { window.mountMenu(); window.menuController.replay(); });
  await page.waitForTimeout(100);
  await page.evaluate(() => window.menuSignal.abort());
  await page.waitForTimeout(1000);
  await click();
  check("Abort destroys listeners and animations", (await read()).state === "closed" && (await read()).animations === 0);
  // The real gallery shell, including a reduced-motion remount and route cleanup.
  await page.goto(`${origin}/ui-gallery/buttons/menu-icon-morph/`);
  await page.waitForSelector("[data-demo-ready=true]");
  await page.locator("[data-demo-replay]").click(); await page.waitForTimeout(1000);
  await page.locator(".motion-lab").screenshot({ path: resolve(output, "replica-gallery-context.png") });
  check("Gallery retains WIP and source identity", (await page.locator(".motion-status").textContent()).includes("WIP") && (await page.locator(".motion-reference h2").textContent()) === "Dennis Snellenberg");
  const axe = await new AxeBuilder({ page }).include(".motion-lab").analyze();
  check("No serious/critical gallery accessibility findings", axe.violations.filter(v => ["serious", "critical"].includes(v.impact)).length === 0, axe.violations);
  await page.locator("[data-motion-toggle]").check();
  await page.locator("[data-demo-replay]").click();
  check("Gallery reduced-motion control remounts", (await read()).animations === 0);
  await page.evaluate(() => window.dispatchEvent(new Event("site:before-content-replace")));
  check("Route-leave hook resets component", (await read()).state === "closed");
  await click();
  check("Route-leave hook removes toggle listener", (await read()).state === "closed");
  await page.goto(`${origin}/ui-gallery/buttons/`);
  await page.goBack(); await page.waitForSelector("[data-demo-ready=true]");
  await click();
  check("Back navigation mounts an operable component", (await read()).state === "open");
  await page.locator("[data-demo-reset]").click();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.locator("[data-demo-replay]").click(); await page.waitForTimeout(1100);
    check(`Gallery ${width}px no overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.locator(".motion-lab").screenshot({ path: resolve(output, `replica-gallery-mobile-${width}.png`) });
  }
  const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const touchPage = await touch.newPage();
  await touchPage.goto(`${origin}/__menu-trace__/`);
  await touchPage.waitForFunction(() => Boolean(window.menuController));
  await touchPage.locator(".menu-icon-morph__toggle").tap();
  await touchPage.waitForTimeout(1100);
  check("Touch tap opens full-width menu without magnet", await touchPage.locator(".menu-icon-morph").evaluate(stage => stage.dataset.state === "open" && new DOMMatrix(getComputedStyle(stage.querySelector(".menu-icon-morph__toggle")).transform).m41 === 0));
  await touchPage.locator(".menu-icon-morph__toggle").tap();
  check("Touch tap closes menu", await touchPage.locator(".menu-icon-morph__panel").evaluate(panel => panel.inert));
  await touch.close();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("[data-demo-replay]").click();
  check("OS reduced-motion remount is immediate", (await read()).animations === 0 && (await read()).curveWidth === 0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  check("No uncaught page errors", errors.length === 0, errors);
  const source = existsSync(resolve(evidence, "measurements.json")) ? JSON.parse(readFileSync(resolve(evidence, "measurements.json"), "utf8")) : null;
  const comparison = source ? {
    panelDelta: { x: opened.panel.x - source.panel.rect.x, y: opened.panel.y - source.panel.rect.y, width: opened.panel.width - source.panel.rect.width, height: opened.panel.height - source.panel.rect.height },
    typeDelta: opened.links.map((link, index) => ({ label: link.text, x: link.rect.x - source.links[index].label.rect.x, y: link.rect.y - source.links[index].label.rect.y, width: link.rect.width - source.links[index].label.rect.width })),
    caveat: "Measured settled geometry only. Source and replica typefaces differ; neutral background is intentional. Intermediate frames use exact CSS transition times; source screenshot timestamps include capture latency and are not frame-synchronized.",
  } : { caveat: "No source measurement input found. Source-vs-replica deltas were not run." };
  writeFileSync(resolve(output, "samples.json"), JSON.stringify(samples, null, 2));
  writeFileSync(resolve(output, "report.json"), JSON.stringify({ results, errors, comparison, sourceViewport: { width: 1180, height: 757 }, source: "https://dennissnellenberg.com/", sourceObservedAt: "2026-10-02" }, null, 2));
  console.log(JSON.stringify({ passed: results.filter(result => result.pass).length, total: results.length, output, comparison }, null, 2));
  if (results.some(result => !result.pass)) process.exitCode = 1;
} finally { await browser.close(); await server.close(); }
function matrix(value) { const data = value.match(/matrix\(([^)]+)\)/)?.[1].split(",").map(Number); return { x: data?.[4] ?? 0, y: data?.[5] ?? 0 }; }
