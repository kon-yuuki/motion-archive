import { createServer } from "vite";
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const folder = resolve(
  "../motion-benchmark-correction/text-corrections/font-licensing",
);
mkdirSync(folder, { recursive: true });
const server = await createServer({
  server: { host: "127.0.0.1", port: 4198, strictPort: true },
});
await server.listen();
const browser = await chromium.launch({
  headless: true,
  executablePath: "/tmp/chromium",
  args: ["--disable-dev-shm-usage"],
});
const report = { checks: [], errors: [] };
try {
  let page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  page.on("pageerror", (e) => report.errors.push(e.message));
  await page.route("**/*", (r) =>
    new URL(r.request().url()).origin === "http://127.0.0.1:4198"
      ? r.continue()
      : r.abort(),
  );
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(
      "http://127.0.0.1:4198/ui-gallery/text-reveals/proximity-weight/",
    );
    await page.evaluate(() => document.fonts.ready);
    await page.locator(".proximity-weight__surface").waitFor();
    await page.addScriptTag({
      path: resolve("node_modules/axe-core/axe.min.js"),
    });
    const contrast = await page.evaluate(async () => {
      const result = await axe.run(document, {
        runOnly: { type: "rule", values: ["color-contrast"] },
      });
      return {
        violations: result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
        incomplete: result.incomplete.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      };
    });
    const layout = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      fontLoaded: document.fonts.check('20px "Recorded Cormorant"'),
      scene: document
        .querySelector(".proximity-weight")
        .getBoundingClientRect()
        .toJSON(),
    }));
    await page.screenshot({
      path: resolve(folder, `proximity-full-route-${width}.png`),
      fullPage: true,
    });
    await page
      .locator(".proximity-weight")
      .screenshot({ path: resolve(folder, `proximity-stage-${width}.png`) });
    const surface = page.locator(".proximity-weight__surface");
    await surface.focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(250);
    const active = await page.locator('[data-phase="active"]').count();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(250);
    const rest = await page.locator('[data-phase="rest"]').count();
    report.checks.push({
      width,
      contrast,
      layout,
      keyboard: active === 1 && rest === 1,
      pass:
        contrast.violations.length === 0 &&
        layout.scrollWidth <= width &&
        layout.fontLoaded &&
        active === 1 &&
        rest === 1,
    });
  }
  for (const [slug, families] of [
    ["character-xray", ["Xray Cormorant"]],
    ["blur-dissolve", ["Recorded Korean"]],
  ]) {
    await page.close();
    page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on("pageerror", (e) => report.errors.push(e.message));
    await page.route("**/*", (r) =>
      new URL(r.request().url()).origin === "http://127.0.0.1:4198"
        ? r.continue()
        : r.abort(),
    );
    await page.goto(`http://127.0.0.1:4198/ui-gallery/text-reveals/${slug}/`);
    await page.evaluate(() => document.fonts.ready);
    const fonts = await page.evaluate(() =>
      [...document.fonts]
        .filter((f) => f.status === "loaded")
        .map((f) => ({ family: f.family, status: f.status })),
    );
    report.checks.push({
      slug,
      fonts,
      pass: families.every((family) =>
        fonts.some((font) => font.family === family),
      ),
    });
  }
} catch (error) {
  report.errors.push(error.message);
} finally {
  await browser.close();
  await server.close();
  writeFileSync(
    resolve(folder, "readability-report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
}
console.log(
  JSON.stringify(
    {
      checks: report.checks.map(({ width, slug, pass }) => ({
        width,
        slug,
        pass,
      })),
      errors: report.errors,
    },
    null,
    2,
  ),
);
process.exitCode =
  report.errors.length || report.checks.some((x) => !x.pass) ? 1 : 0;
