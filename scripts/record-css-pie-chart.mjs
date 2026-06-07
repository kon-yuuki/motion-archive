import { mkdir, rename } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/kon/node_modules/playwright");

const outputDir = resolve("exports");
const videoPath = resolve(outputDir, "css-pie-chart-x.webm");

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1200, height: 675 },
  recordVideo: {
    dir: outputDir,
    size: { width: 1200, height: 675 }
  }
});
const page = await context.newPage();

await page.goto("http://127.0.0.1:5174/works/css-pie-chart/", {
  waitUntil: "networkidle"
});

await page.addStyleTag({
  content: `
    .social-caption {
      align-items: center;
      background: rgba(23, 34, 29, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 999px;
      bottom: 28px;
      box-shadow: 0 16px 40px rgba(23, 34, 29, 0.22);
      color: #f8f3e6;
      display: flex;
      font-family: "Libre Franklin", sans-serif;
      font-size: 14px;
      font-weight: 650;
      gap: 9px;
      left: 50%;
      letter-spacing: -0.01em;
      opacity: 0;
      padding: 12px 18px;
      pointer-events: none;
      position: fixed;
      transform: translate(-50%, 12px);
      transition: opacity 260ms ease, transform 260ms ease;
      z-index: 100;
    }

    .social-caption::before {
      background: #f4ca52;
      border-radius: 50%;
      content: "";
      height: 7px;
      width: 7px;
    }

    .social-caption[data-visible] {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  `
});

await page.evaluate(() => {
  const caption = document.createElement("div");
  caption.className = "social-caption";
  caption.dataset.socialCaption = "";
  document.body.append(caption);
});

async function caption(text, duration = 900) {
  await page.evaluate((value) => {
    const element = document.querySelector("[data-social-caption]");
    element.textContent = value;
    element.setAttribute("data-visible", "");
  }, text);
  await page.waitForTimeout(duration);
  await page.evaluate(() => {
    document.querySelector("[data-social-caption]")?.removeAttribute("data-visible");
  });
  await page.waitForTimeout(220);
}

await page.waitForTimeout(500);
await caption("CSS-only rendering. Live editable data.", 1050);

const chart = page.locator(".pie-chart");
const chartBox = await chart.boundingBox();

await page.mouse.move(
  chartBox.x + chartBox.width * 0.77,
  chartBox.y + chartBox.height * 0.36
);
await caption("Hover to inspect every slice", 1050);

await page.mouse.move(
  chartBox.x + chartBox.width * 0.25,
  chartBox.y + chartBox.height * 0.58
);
await page.waitForTimeout(800);

await page.mouse.move(1130, 650);
await caption("Edit labels, values, and colors live", 800);

const labels = page.locator('[data-field="label"]');
const values = page.locator('[data-field="value"]');
await labels.nth(0).fill("Design");
await values.nth(0).fill("52");
await page.waitForTimeout(350);
await labels.nth(1).fill("Code");
await values.nth(1).fill("28");
await page.waitForTimeout(350);
await labels.nth(2).fill("Motion");
await values.nth(2).fill("14");
await page.waitForTimeout(650);

await page.evaluate(() => {
  const input = document.querySelector("#bar-view");
  input.checked = true;
  input.dispatchEvent(new Event("change", { bubbles: true }));
});
await caption("Switch between pie and bars", 1000);

const firstBar = page.locator(".pie-chart li").first();
const barBox = await firstBar.boundingBox();
await page.mouse.move(
  barBox.x + barBox.width * 0.58,
  barBox.y + barBox.height * 0.5
);
await page.waitForTimeout(800);

await page.evaluate(() => {
  const input = document.querySelector("#pie-view");
  input.checked = true;
  input.dispatchEvent(new Event("change", { bubbles: true }));
});
await page.mouse.move(1130, 650);
await caption("CSS Pie Chart / Motion Archive", 1100);
await page.waitForTimeout(350);

const video = page.video();
await context.close();
await browser.close();
await rename(await video.path(), videoPath);

console.log(videoPath);
