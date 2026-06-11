import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:5191/works/", { waitUntil: "networkidle" });
await page.waitForTimeout(300);

const rows = page.locator(".work-row");
const n = await rows.count();
const b0 = await rows.nth(0).boundingBox();
const b1 = await rows.nth(1).boundingBox();

const tipVisible = () =>
  page.evaluate(() => {
    const t = document.querySelector(".work-tooltip");
    if (!t) return { exists: false };
    return {
      exists: true,
      visible: t.hasAttribute("data-visible") && getComputedStyle(t).opacity === "1",
      text: t.textContent
    };
  });

// move onto row 0
await page.mouse.move(b0.x + 200, b0.y + b0.height / 2);
// immediately after entering: should NOT be visible yet (delay)
await page.waitForTimeout(80);
const immediate = await tipVisible();
// after delay
await page.waitForTimeout(250);
const afterDelay = await tipVisible();

// move to row 1 quickly: should be instant (already visible group)
await page.mouse.move(b1.x + 200, b1.y + b1.height / 2);
await page.waitForTimeout(40);
const rowToRow = await tipVisible();

// leave the list (move to top header area)
await page.mouse.move(640, 10);
await page.waitForTimeout(60);
const afterLeave = await tipVisible();

console.log("rows:", n);
console.log("immediate (expect visible:false):", JSON.stringify(immediate));
console.log("afterDelay (expect visible:true):", JSON.stringify(afterDelay));
console.log("rowToRow @40ms (expect visible:true, text changed):", JSON.stringify(rowToRow));
console.log("afterLeave (expect visible:false):", JSON.stringify(afterLeave));

await browser.close();
