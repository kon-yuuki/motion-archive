import { mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = resolve(root, "public", "thumbnails");
const baseUrl = process.env.THUMBNAIL_BASE_URL || "http://127.0.0.1:5173";
const requestedSlug = process.env.THUMBNAIL_SLUG;
const works = [
  { slug: "hover-video-cards", wait: 500 },
  { slug: "rainy-neon-cylinder", wait: 1200 },
  { slug: "spiral-infinite-gallery", wait: 900 },
  { slug: "rotating-scroll-gallery", scroll: 2050, wait: 900 },
  { slug: "rgb-cursor-stalker", scroll: 576, wait: 800 },
  { slug: "cursor-pixel-field", pointer: true, pointerDown: false, pointerSettle: 220 },
  { slug: "cylindrical-image-flow", scroll: 520, wait: 500 },
  { slug: "cursor-image-burst", pointer: true },
  {
    slug: "hero-mask-shift",
    image: resolve(root, "src", "assets", "images", "optimized", "nature-1280.webp")
  },
  { slug: "image-wipe-grid", scroll: 720 },
  { slug: "scroll-type-reveal", scroll: 900 },
  { slug: "css-pie-chart" },
  { slug: "fluid-image", pointer: true },
  { slug: "pixel-glitch" },
  { slug: "latte-marble", wait: 900, collapseControls: true }
];
const selectedWorks = requestedSlug ? works.filter((work) => work.slug === requestedSlug) : works;

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });

for (const work of selectedWorks) {
  const page = await browser.newPage({
    viewport: { width: 960, height: 600 },
    deviceScaleFactor: 1
  });

  if (work.image) {
    const imageBuffer = await readFile(work.image);
    const imageUrl = `data:image/webp;base64,${imageBuffer.toString("base64")}`;

    await page.setContent(`
      <!doctype html>
      <html>
        <head>
          <style>
            * {
              box-sizing: border-box;
            }

            html,
            body {
              background: #050605;
              height: 100%;
              margin: 0;
              overflow: hidden;
              width: 100%;
            }

            img {
              display: block;
              height: 100vh;
              object-fit: cover;
              object-position: center;
              width: 100vw;
            }
          </style>
        </head>
        <body>
          <img src="${imageUrl}" alt="">
        </body>
      </html>
    `, { waitUntil: "load" });
    await page.locator("img").evaluate((image) => {
      if (image.complete && image.naturalWidth > 0) {
        return;
      }

      return new Promise((resolveImage, rejectImage) => {
        image.addEventListener("load", resolveImage, { once: true });
        image.addEventListener("error", rejectImage, { once: true });
      });
    });
    await page.screenshot({
      path: resolve(outputDirectory, `${work.slug}.jpg`),
      type: "jpeg",
      quality: 82
    });
    await page.close();
    continue;
  }

  await page.goto(`${baseUrl}/works/${work.slug}/`, { waitUntil: "load" });
  await page.addStyleTag({
    content: `
      html {
        scrollbar-gutter: auto !important;
      }

      .experiment-nav,
      .detail-dialog-toggle,
      .fluid-hint {
        display: none !important;
      }

      * {
        user-select: none !important;
      }
    `
  });

  if (work.scroll) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), work.scroll);
    await page.waitForTimeout(700);
  }
  if (work.pointer) {
    await page.mouse.move(280, 380);
    if (work.pointerDown !== false) {
      await page.mouse.down();
    }
    for (let step = 0; step < 18; step += 1) {
      await page.mouse.move(280 + step * 24, 380 - Math.sin(step / 2) * 100);
      await page.waitForTimeout(18);
    }
    if (work.pointerDown !== false) {
      await page.mouse.up();
    }
    await page.waitForTimeout(work.pointerSettle ?? 900);
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
console.log(`Generated ${selectedWorks.length} work thumbnails in public/thumbnails`);
