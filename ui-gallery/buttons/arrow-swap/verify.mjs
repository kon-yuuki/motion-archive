/** Focused, local-only verification. No production requests are made. */
import { createServer } from "vite";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const output = resolve(process.env.UI_ARROW_OUTPUT ?? ".ui-motion-qa/arrow-benchmark");
mkdirSync(output, { recursive: true });
const server = await createServer({ root, server: { host: "127.0.0.1", port: 4191, strictPort: true } });
await server.listen();
const browser = await chromium.launch({
  headless: true,
  ...(process.env.UI_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.UI_CHROMIUM_EXECUTABLE_PATH } : {}),
  args: process.env.UI_CHROMIUM_ARGS ? JSON.parse(process.env.UI_CHROMIUM_ARGS) : [],
});
const base = "http://127.0.0.1:4191";
const url = `${base}/ui-gallery/buttons/arrow-swap/`;
const results = [], samples = [], errors = [];
const check = (name, pass, details) => {
  results.push({ name, pass, details });
  if (!pass) console.error(name, details);
};
const near = (a, b, tolerance = 0.01) => Math.abs(a - b) <= tolerance;
const matrix = value => {
  const parts = value.match(/matrix\(([^)]+)\)/)?.[1].split(",").map(Number);
  return { x: parts?.[4] ?? 0, y: parts?.[5] ?? 0, scale: parts?.[0] ?? 1 };
};
const isolated = async context => {
  await context.route("**/*", route => {
    const request = new URL(route.request().url());
    if (request.pathname.startsWith("/_vercel/")) return route.fulfill({ body: "", contentType: "application/javascript" });
    return request.origin === base ? route.continue() : route.abort();
  });
};
try {
  const context = await browser.newContext({ viewport: { width: 1180, height: 757 } });
  await isolated(context);
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(url);
  await page.waitForSelector("[data-demo-ready=true]");
  const link = page.locator(".arrow-swap__link");
  const state = () => link.evaluate(element => {
    const css = getComputedStyle(element), underline = getComputedStyle(element, "::after");
    const read = selector => {
      const node = element.querySelector(selector), style = getComputedStyle(node);
      return { transform: style.transform, opacity: Number(style.opacity), duration: style.transitionDuration, easing: style.transitionTimingFunction, rect: node.getBoundingClientRect().toJSON() };
    };
    return { rect: element.getBoundingClientRect().toJSON(), font: css.font, overflow: css.overflow, color: css.color,
      label: read(".arrow-swap__label"), left: read(".arrow-swap__left"), right: read(".arrow-swap__right"),
      underline: { transform: underline.transform, origin: underline.transformOrigin, duration: underline.transitionDuration, easing: underline.transitionTimingFunction, height: underline.height } };
  });
  await page.screenshot({ path: resolve(output, "replica-viewport-1180x757.png") });
  await page.locator(".motion-lab").screenshot({ path: resolve(output, "replica-context.png") });
  await link.scrollIntoViewIfNeeded();
  const box = await link.boundingBox();
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const outside = { x: box.x - 100, y: center.y + 80 };
  const clip = { x: Math.floor(box.x - 12), y: Math.floor(box.y - 12), width: 100, height: 40 };
  const moveOut = () => page.mouse.move(outside.x, outside.y);
  const moveIn = () => page.mouse.move(center.x, center.y);
  await moveOut();
  const rest = await state();
  samples.push({ phase: "rest", ...rest });
  check("Source 74.765625 × 15.953125px link", near(box.width, 74.765625) && near(box.height, 15.953125), box);
  check("Source label width 54.765625px", near(rest.label.rect.width, 54.765625), rest.label.rect.width);
  check("14px type / white on black", rest.font.includes("14px") && rest.color === "rgb(255, 255, 255)" && await page.locator(".arrow-swap").evaluate(e => getComputedStyle(e).backgroundColor === "rgb(0, 0, 0)"), rest.font);
  check("Unicode arrows with no invented artwork", await link.locator("svg").count() === 0 && (await link.locator("[aria-hidden]").allTextContents()).join("") === "↗↗" && await page.locator(".arrow-swap").getByRole("button").count() === 0);
  check("Ordinary Contact link", await link.getAttribute("href") === "https://www.rejouice.com/contact" && await link.getAttribute("aria-pressed") === null);
  check("Source link clips arrows", rest.overflow === "hidden");
  check("Source 15px arrow box and 5px gap", near(rest.right.rect.width, 15) && near(rest.right.rect.x - rest.label.rect.right, 5), rest.right.rect);
  check("Rest arrow endpoints", rest.left.opacity === 0 && rest.right.opacity === 1 && near(matrix(rest.left.transform).x, -18.75) && near(matrix(rest.left.transform).y, 7.9765625), rest);
  check("Rest underline hidden, 1px, left origin", matrix(rest.underline.transform).scale === 0 && rest.underline.height === "1px" && rest.underline.origin.startsWith("0px"), rest.underline);
  check("Exact 700ms source transition", [rest.label, rest.left, rest.right].every(s => s.duration === "0.7s, 0.7s" && s.easing === "cubic-bezier(0.52, 0, 0, 1), cubic-bezier(0.52, 0, 0, 1)"), rest.label);
  check("Exact 600ms source underline transition", rest.underline.duration === "0.6s" && rest.underline.easing === "cubic-bezier(0.85, 0, 0.15, 1)", rest.underline);
  await page.screenshot({ path: resolve(output, "replica-rest.png"), clip });
  await moveIn();
  const start = Date.now();
  for (const ms of [100, 250, 400, 800]) {
    await page.waitForTimeout(Math.max(0, ms - (Date.now() - start)));
    samples.push({ phase: "enter", elapsedMs: Date.now() - start, ...await state() });
    await page.screenshot({ path: resolve(output, `replica-enter-${ms}.png`), clip });
  }
  const hover = await state();
  check("Hover label moves 20px", near(matrix(hover.label.transform).x, 20), hover.label);
  check("Hover arrow endpoints", hover.left.opacity === 1 && hover.right.opacity === 0 && near(matrix(hover.left.transform).x, 0) && near(matrix(hover.right.transform).x, 18.75) && near(matrix(hover.right.transform).y, -7.9765625), hover);
  check("Hover underline fills fixed width", matrix(hover.underline.transform).scale === 1 && near(hover.rect.width, rest.rect.width), hover.underline);
  await page.screenshot({ path: resolve(output, "replica-hover.png"), clip });
  await moveOut();
  await page.waitForTimeout(200);
  const leaving = await state();
  check("Exit underline keeps LEFT origin", leaving.underline.origin.startsWith("0px") && matrix(leaving.underline.transform).scale < 1 && matrix(leaving.underline.transform).scale > 0, leaving.underline);
  await page.screenshot({ path: resolve(output, "replica-exit-phase.png"), clip });
  await page.waitForTimeout(600);
  check("Exit restores initial endpoints", near(matrix((await state()).label.transform).x, 0) && (await state()).right.opacity === 1);

  // Sample from the actual leave event. Two remote reads straddling mouse.move()
  // can include several advancing frames and falsely report a reversal jump.
  await link.evaluate(element => {
    element.addEventListener("pointerleave", () => {
      const label = element.querySelector(".arrow-swap__label");
      const started = performance.now();
      const read = () => ({ elapsedMs: performance.now() - started,
        x: new DOMMatrixReadOnly(getComputedStyle(label).transform).m41 });
      const frames = window.__arrowInterruption = [read()];
      const sample = () => {
        frames.push(read());
        if (performance.now() - started < 750) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    }, { once: true });
  });
  await moveIn(); await page.waitForTimeout(160);
  await moveOut(); await page.waitForTimeout(800);
  const interruption = await page.evaluate(() => window.__arrowInterruption);
  const monotonic = interruption.every((s, i) => !i || s.x <= interruption[i - 1].x + 0.02);
  check("Interrupted entry reverses continuously from leave event", interruption[0].x > 0 && interruption[0].x < 20 && monotonic && near(interruption.at(-1).x, 0), interruption);
  writeFileSync(resolve(output, "interruption-frames.json"), JSON.stringify(interruption, null, 2));
  for (let i = 0; i < 10; i++) { await moveIn(); await page.waitForTimeout(35); await moveOut(); await page.waitForTimeout(25); }
  await page.waitForTimeout(750);
  check("Rapid hover settles at rest", near(matrix((await state()).label.transform).x, 0) && (await state()).left.opacity === 0);
  for (let i = 0; i < 4; i++) { await page.locator("[data-demo-replay]").click(); await page.waitForTimeout(40); await page.locator("[data-demo-reset]").click(); }
  await page.waitForTimeout(1900);
  check("Reset cancels Replay timer and frame", near(matrix((await state()).label.transform).x, 0) && !await page.locator(".arrow-swap").evaluate(e => e.classList.contains("is-active")));
  await page.locator("[data-demo-replay]").click(); await page.waitForTimeout(850);
  check("Replay reaches hover endpoint", near(matrix((await state()).label.transform).x, 20));
  await page.waitForTimeout(1100);
  check("Replay completes exit", near(matrix((await state()).label.transform).x, 0));

  await link.focus(); await page.keyboard.press("Tab"); await page.keyboard.press("Shift+Tab");
  check("Keyboard fallback: visible outline / static underline", await link.evaluate(e => e.matches(":focus-visible") && getComputedStyle(e).outlineStyle === "solid" && getComputedStyle(e, "::after").transform === "matrix(1, 0, 0, 1, 0, 0)"));
  check("Keyboard focus leaves source label at rest", near(matrix((await state()).label.transform).x, 0));
  let requestedContact = false;
  context.on("request", request => { if (request.url() === "https://www.rejouice.com/contact") requestedContact = true; });
  const popupPromise = context.waitForEvent("page");
  await link.press("Enter");
  const popup = await popupPromise; await popup.waitForTimeout(100); await popup.close();
  check("Enter activates Contact in separate tab", requestedContact);
  await page.locator("[data-motion-toggle]").check();
  await page.locator("[data-demo-replay]").click(); await page.waitForTimeout(80);
  const reduced = await state();
  check("Reduced motion switches endpoints without transitions", matrix(reduced.label.transform).x === 20 && reduced.label.duration === "0s" && reduced.underline.duration === "0s", reduced);
  await page.locator("[data-demo-reset]").click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("[data-demo-replay]").click(); await page.waitForTimeout(80);
  check("OS reduced motion switches endpoints without transitions", (await state()).label.duration === "0s" && near(matrix((await state()).label.transform).x, 20) && await page.locator("[data-motion-toggle]").isChecked());
  await page.emulateMedia({ reducedMotion: "no-preference" });
  check("OS preference changes remount cleanly at rest", near(matrix((await state()).label.transform).x, 0) && !await page.locator("[data-motion-toggle]").isChecked());
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    check(`${width}px no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.locator(".motion-lab").screenshot({ path: resolve(output, `replica-mobile-${width}.png`) });
  }
  const axe = await new AxeBuilder({ page }).include(".motion-lab").analyze();
  check("No serious/critical accessibility violations", axe.violations.filter(v => ["serious", "critical"].includes(v.impact)).length === 0, axe.violations);

  // Direct lifecycle harness: abort mid-Replay, then prove no detached mutation remains.
  const lifecycle = await page.evaluate(async () => {
    const { createDemo } = await import("/ui-gallery/buttons/arrow-swap/demo.js");
    const root = document.createElement("div"), controller = new AbortController();
    document.body.append(root);
    const demo = createDemo(root, { signal: controller.signal });
    demo.replay();
    await new Promise(resolve => setTimeout(resolve, 80));
    controller.abort();
    const stage = root.firstElementChild, before = stage.outerHTML;
    let mutations = 0;
    const observer = new MutationObserver(records => mutations += records.length);
    observer.observe(stage, { attributes: true, subtree: true });
    await new Promise(resolve => setTimeout(resolve, 1250));
    demo.replay(); demo.reset(); demo.destroy();
    await new Promise(resolve => requestAnimationFrame(resolve));
    const result = { mutations, unchanged: before === stage.outerHTML, animations: stage.getAnimations({ subtree: true }).length };
    observer.disconnect(); root.remove();
    return result;
  });
  check("Abort cancels timers, frames, listeners, animations", lifecycle.mutations === 0 && lifecycle.unchanged && lifecycle.animations === 0, lifecycle);

  await page.locator("[data-motion-toggle]").uncheck();
  await page.locator("[data-demo-replay]").click();
  await page.locator("[data-demo-heading] a").first().click();
  await page.goBack(); await page.waitForSelector("[data-demo-ready=true]");
  await page.locator("[data-demo-replay]").click(); await page.waitForTimeout(850);
  check("Back navigation remounts working component", await page.locator(".arrow-swap").evaluate(e => e.classList.contains("is-active")));
  await page.locator("[data-demo-reset]").click();

  const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await isolated(touch);
  const mobile = await touch.newPage(); await mobile.goto(url); await mobile.waitForSelector("[data-demo-ready=true]");
  const touchLink = mobile.locator(".arrow-swap__link");
  check("Touch fallback has 44px target", near((await touchLink.boundingBox()).height, 44));
  await mobile.locator(".motion-lab").screenshot({ path: resolve(output, "replica-touch-390.png") });
  let touchContact = false;
  touch.on("request", request => { if (request.url() === "https://www.rejouice.com/contact") touchContact = true; });
  const touchPopupPromise = touch.waitForEvent("page");
  await touchLink.tap();
  const touchPopup = await touchPopupPromise; await touchPopup.waitForTimeout(100); await touchPopup.close();
  check("First tap activates ordinary link", touchContact);
  check("Touch does not latch synthetic hover", !await mobile.locator(".arrow-swap").evaluate(e => e.classList.contains("is-active")));
  await touch.close();
  check("No page errors", errors.length === 0, errors);
  writeFileSync(resolve(output, "samples.json"), JSON.stringify(samples, null, 2));
  writeFileSync(resolve(output, "report.json"), JSON.stringify({ results, errors, viewport: { width: 1180, height: 757 }, scope: "Component trace. Typeface substitution is disclosed. Source PNGs are 1165×747; phase captures are not frame-synchronized." }, null, 2));
  console.log(JSON.stringify({ passed: results.filter(r => r.pass).length, total: results.length, output }, null, 2));
  if (results.some(r => !r.pass)) process.exitCode = 1;
} finally {
  await browser.close();
  await server.close();
}
