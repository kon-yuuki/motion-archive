import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve(import.meta.dirname, "..");
const outputDirectory = resolve(root, "public", "thumbnails");
const baseUrl = process.env.THUMBNAIL_BASE_URL || "http://127.0.0.1:5173";
const works = [
  { slug: "cursor-pixel-field", pointer: true },
  { slug: "green-noise-gradient", wait: 900 },
  { slug: "cylindrical-image-flow", scroll: 520, wait: 500 },
  { slug: "scroll-tilt-gallery", scroll: 900 },
  { slug: "cursor-image-burst", pointer: true },
  { slug: "hero-mask-shift", scroll: 560 },
  { slug: "image-wipe-grid", scroll: 720 },
  { slug: "scroll-type-reveal", scroll: 900 },
  { slug: "css-pie-chart" },
  { slug: "fluid-image", pointer: true },
  { slug: "pixel-glitch" },
  { slug: "latte-marble", wait: 900, collapseControls: true }
];

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });

for (const work of works) {
  const page = await browser.newPage({
    viewport: { width: 960, height: 600 },
    deviceScaleFactor: 1
  });
  await page.goto(`${baseUrl}/works/${work.slug}/`, { waitUntil: "networkidle" });
  await page.addStyleTag({
    content: `
      .experiment-nav,
      .detail-dialog-toggle,
      .fluid-hint {
        display: none !important;
      }
    `
  });

  if (work.scroll) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), work.scroll);
    await page.waitForTimeout(700);
  }
  if (work.pointer) {
    await page.mouse.move(280, 380);
    await page.mouse.down();
    for (let step = 0; step < 18; step += 1) {
      await page.mouse.move(280 + step * 24, 380 - Math.sin(step / 2) * 100);
      await page.waitForTimeout(18);
    }
    await page.mouse.up();
    await page.waitForTimeout(900);
  }
  if (work.wait) {
    await page.waitForTimeout(work.wait);
  }
  if (work.collapseControls) {
    const controlsToggle = page.locator("[data-controls-toggle]");
    if (await controlsToggle.isVisible()) {
      await controlsToggle.click();
      await page.waitForTimeout(180);
    }
  }

  await page.screenshot({
    path: resolve(outputDirectory, `${work.slug}.jpg`),
    type: "jpeg",
    quality: 82
  });
  await page.close();
}

await browser.close();
console.log(`Generated ${works.length} work thumbnails in public/thumbnails`);
