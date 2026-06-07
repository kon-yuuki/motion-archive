import { mkdir, rename } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/kon/node_modules/playwright");

const outputDir = resolve("exports");
const videoPath = resolve(outputDir, "css-pie-chart-hover-preview.webm");

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1980, height: 1114 },
  recordVideo: {
    dir: outputDir,
    size: { width: 1980, height: 1114 }
  }
});
const page = await context.newPage();

await page.goto("http://127.0.0.1:5174/works/css-pie-chart/", {
  waitUntil: "networkidle"
});

await page.addStyleTag({
  content: `
    body {
      overflow: hidden;
    }

    .pie-stage {
      transform: scale(1);
      transform-origin: var(--camera-x, 50%) var(--camera-y, 50%);
      transition:
        transform 1300ms cubic-bezier(0.16, 1, 0.3, 1),
        transform-origin 120ms linear;
      will-change: transform, transform-origin;
    }

    .pie-stage[data-camera-close] {
      transform: scale(1.55);
    }

    .demo-caption {
      align-items: center;
      background: rgba(23, 34, 29, 0.94);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 17px;
      bottom: 32px;
      box-shadow: 0 16px 40px rgba(23, 34, 29, 0.22);
      color: #f8f3e6;
      display: flex;
      flex-direction: column;
      font-family: var(--font-sans);
      left: 50%;
      opacity: 0;
      padding: 13px 24px 14px;
      pointer-events: none;
      position: fixed;
      transform: translate(-50%, 14px);
      transition: opacity 240ms ease, transform 240ms ease;
      z-index: 200;
    }

    .demo-caption[data-visible] {
      opacity: 1;
      transform: translate(-50%, 0);
    }

    .demo-caption strong {
      font-size: 18px;
      font-weight: 680;
      letter-spacing: 0.01em;
      line-height: 1.25;
    }

    .demo-caption span {
      color: rgba(248, 243, 230, 0.64);
      font-size: 11px;
      font-weight: 520;
      letter-spacing: 0.08em;
      line-height: 1.3;
      margin-top: 3px;
      text-transform: uppercase;
    }

    .demo-cursor {
      filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.28));
      height: 38px;
      left: 0;
      pointer-events: none;
      position: fixed;
      top: 0;
      transform: translate(var(--cursor-x), var(--cursor-y));
      width: 30px;
      z-index: 220;
    }

    .demo-cursor svg {
      display: block;
      height: 100%;
      width: 100%;
    }

    body > .chart-tooltip {
      left: 0 !important;
      position: fixed !important;
      top: 0 !important;
      transform:
        translate(var(--demo-pointer-x, 0), var(--demo-pointer-y, 0))
        translate(30px, 22px) !important;
      z-index: 210;
    }
  `
});

await page.evaluate(() => {
  const caption = document.createElement("div");
  caption.className = "demo-caption";
  caption.innerHTML = `
    <strong>各項目をホバーして詳細を確認</strong>
    <span>Hover each item to inspect the details</span>
  `;
  document.body.append(caption);

  const cursor = document.createElement("div");
  cursor.className = "demo-cursor";
  cursor.innerHTML = `
    <svg viewBox="0 0 27 34" aria-hidden="true">
      <path d="M2 2l20 18-10 1 6 10-5 3-6-11-5 7z" fill="#fff" stroke="#17221d" stroke-width="2" stroke-linejoin="round"/>
    </svg>
  `;
  document.body.append(cursor);

  const tooltip = document.querySelector("[data-chart-tooltip]");
  document.body.append(tooltip);

  window.addEventListener("mousemove", (event) => {
    cursor.style.setProperty("--cursor-x", `${event.clientX}px`);
    cursor.style.setProperty("--cursor-y", `${event.clientY}px`);
    document.body.style.setProperty("--demo-pointer-x", `${event.clientX}px`);
    document.body.style.setProperty("--demo-pointer-y", `${event.clientY}px`);
    const stage = document.querySelector(".pie-stage");
    stage.style.setProperty("--camera-x", `${event.clientX}px`);
    stage.style.setProperty("--camera-y", `${event.clientY}px`);
  });
});

const start = { x: 1700, y: 950 };
await page.mouse.move(start.x, start.y);
await page.waitForTimeout(650);

const chart = page.locator(".pie-chart");
const chartBox = await chart.boundingBox();
const destination = {
  x: chartBox.x + chartBox.width * 0.78,
  y: chartBox.y + chartBox.height * 0.38
};

await page.evaluate(() => {
  document.querySelector(".pie-stage")?.setAttribute("data-camera-close", "");
  document.querySelector(".demo-caption")?.setAttribute("data-visible", "");
});

const frames = 65;
for (let frame = 1; frame <= frames; frame += 1) {
  const progress = frame / frames;
  const eased = 1 - Math.pow(1 - progress, 4);
  await page.mouse.move(
    start.x + (destination.x - start.x) * eased,
    start.y + (destination.y - start.y) * eased
  );
  await page.waitForTimeout(20);
}

await page.waitForTimeout(1700);

await page.evaluate(() => {
  document.querySelector(".demo-caption")?.removeAttribute("data-visible");
});
await page.waitForTimeout(550);

const video = page.video();
await context.close();
await browser.close();
await rename(await video.path(), videoPath);

console.log(videoPath);
