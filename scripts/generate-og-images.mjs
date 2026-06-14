import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve(import.meta.dirname, "..");
const outputDirectory = resolve(root, "public", "og");
const pages = {
  index: ["Motion & UI", "Motion Archive / UI Gallery"],
  "motion-archive": ["Motion Archive", "Web Animation Studies"],
  categories: ["Categories", "Motion Archive"],
  easings: ["Easing Index", "Motion & UI"],
  "ui-gallery": ["UI Gallery", "Interface Studies"],
  "ui-gallery-buttons": ["Buttons", "UI Gallery"],
  "ui-gallery-tooltip-behavior": ["Tooltip Behavior", "UI Gallery"],
  "ui-gallery-typography": ["Typography", "UI Gallery"],
  "cursor-pixel-field": ["Cursor Pixel Field", "Pointer Image Study"],
  "green-noise-gradient": ["Green Noise Gradient", "Canvas Background Study"],
  "cylindrical-image-flow": ["Cylindrical Image Flow", "3D Scroll Study"],
  "scroll-tilt-gallery": ["Scroll Tilt Gallery", "Perspective Scroll Study"],
  "cursor-image-burst": ["Cursor Image Burst", "Pointer Gallery Study"],
  "hero-mask-shift": ["Hero Mask Shift", "Hero Transition Study"],
  "image-wipe-grid": ["Image Wipe Grid", "Scroll Reveal Study"],
  "scroll-type-reveal": ["Scroll Type Reveal", "Typography Study"],
  "css-pie-chart": ["CSS Pie Chart", "CSS Study"],
  "fluid-image": ["Ink Bleed", "WebGL Fluid Study"],
  "pixel-glitch": ["Pixel Glitch", "Image Motion Study"],
  "latte-marble": ["Latte Marble", "Canvas Study"]
};

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1
});

for (const [slug, [title, category]] of Object.entries(pages)) {
  await page.setContent(`
    <!doctype html>
    <html>
      <style>
        * { box-sizing: border-box; }
        body {
          background: #f6f5f0;
          color: #121313;
          font-family: Arial, "Hiragino Sans", sans-serif;
          height: 630px;
          margin: 0;
          overflow: hidden;
          padding: 64px;
        }
        main {
          border: 1px solid #d4d3cc;
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content: space-between;
          padding: 48px;
        }
        .brand, .category {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: .18em;
          text-transform: uppercase;
        }
        .category { color: #696964; font-weight: 400; }
        h1 {
          font-size: 112px;
          font-weight: 400;
          letter-spacing: -.07em;
          line-height: .9;
          margin: 0;
          max-width: 1000px;
        }
      </style>
      <body>
        <main>
          <div class="brand">Motion &amp; UI</div>
          <h1>${title}</h1>
          <div class="category">${category}</div>
        </main>
      </body>
    </html>
  `);
  await page.screenshot({
    path: resolve(outputDirectory, `${slug}.png`),
    type: "png"
  });
}

await browser.close();
console.log(`Generated ${Object.keys(pages).length} OG images in public/og`);
