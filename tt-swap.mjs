import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:5191/works/", { waitUntil: "networkidle" });
await page.waitForTimeout(300);

const rows = page.locator(".work-row");
const b0 = await rows.nth(0).boundingBox();
const b1 = await rows.nth(1).boundingBox();

const snap = () =>
  page.evaluate(() => {
    const main = document.querySelector(".work-tooltip__inner:not(.work-tooltip__inner--out)");
    const out = document.querySelector(".work-tooltip__inner--out");
    return {
      hasOutgoing: !!out,
      outText: out ? out.textContent.slice(0, 10) : null,
      mainText: main ? main.textContent.slice(0, 10) : null,
      mainOpacity: main ? Number(getComputedStyle(main).opacity).toFixed(2) : null
    };
  });

await page.mouse.move(b0.x + 200, b0.y + b0.height / 2);
await page.waitForTimeout(320);
const before = await snap();

// switch row -> during swap there should be an outgoing clone + new main
await page.mouse.move(b1.x + 200, b1.y + b1.height / 2);
await page.waitForTimeout(80);
const during = await snap();

await page.waitForTimeout(350);
const after = await snap();

console.log("before:", JSON.stringify(before));
console.log("during @80ms (expect hasOutgoing:true, outText!=mainText):", JSON.stringify(during));
console.log("after (expect hasOutgoing:false, clone removed):", JSON.stringify(after));

await browser.close();
