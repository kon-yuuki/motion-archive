import { createDemo, transcodeToMp4 } from "./video-demo/runner.mjs";

const demo = await createDemo({
  url: "http://127.0.0.1:5174/works/css-pie-chart/",
  output: "exports/css-pie-chart-full.webm",
  stageSelector: ".pie-stage",
  tooltipSelector: "[data-chart-tooltip]"
});

const { page } = demo;
await demo.wait(700);

await demo.moveTo(".pie-chart", {
  position: { x: 0.78, y: 0.38 },
  duration: 1450,
  zoom: 1.48,
  ja: "ホバーで項目の詳細を確認",
  en: "Hover an item to inspect its details"
});
await demo.wait(1300);

await demo.zoomOut(900);
await demo.moveTo('[data-field="label"]', {
  position: { x: 0.55, y: 0.5 },
  duration: 1400,
  zoom: 1.42,
  ja: "ラベルと値をその場で編集",
  en: "Edit labels and values live"
});
await page.locator('[data-field="label"]').first().fill("Design");
await demo.wait(300);
await page.locator('[data-field="value"]').first().fill("52");
await demo.wait(550);
await page.locator('[data-field="label"]').nth(1).fill("Code");
await demo.wait(300);
await page.locator('[data-field="value"]').nth(1).fill("28");
await demo.wait(850);

await demo.moveTo('[data-field="color"]', {
  position: { x: 0.5, y: 0.5 },
  duration: 1050,
  zoom: 1.5,
  ja: "カラーもリアルタイムに反映",
  en: "Update colors in real time"
});
await page.locator('[data-field="color"]').first().fill("#2d8f76");
await demo.wait(1200);

await demo.zoomOut(900);
await demo.moveTo('label[for="bar-view"]', {
  duration: 1300,
  zoom: 1.38,
  ja: "円グラフと棒グラフを切り替え",
  en: "Switch between pie and bar views"
});
await page.evaluate(() => {
  const input = document.querySelector("#bar-view");
  input.checked = true;
  input.dispatchEvent(new Event("change", { bubbles: true }));
});
await demo.wait(1200);

await demo.moveTo(".pie-chart li", {
  position: { x: 0.58, y: 0.5 },
  duration: 1050,
  zoom: 1.42,
  ja: "描画はCSS、操作UIはJavaScript",
  en: "CSS rendering with a JavaScript editing UI"
});
await demo.wait(1400);
await demo.hideCaption();
await demo.wait(500);

const webm = await demo.finish();
const mp4 = await transcodeToMp4(webm, "exports/css-pie-chart-full.mp4");
console.log(mp4);
