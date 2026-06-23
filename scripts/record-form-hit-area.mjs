import { createDemo, transcodeToMp4 } from "./video-demo/runner.mjs";

const demo = await createDemo({
  url: "http://127.0.0.1:5173/ui-gallery/form/",
  output: "exports/form-hit-area.webm",
  viewport: { width: 1980, height: 1114 },
  stageSelector: "main"
});

const { page } = demo;

await page.addStyleTag({
  content: `
    .gallery-header,
    .gallery-hero,
    .notes-section,
    .gallery-footer {
      display: none !important;
    }

    main {
      padding: 58px 100px 70px !important;
    }

    .topic-heading {
      border-top: 0 !important;
      max-width: 1040px !important;
      padding: 0 0 34px !important;
    }

    .topic-heading__title {
      margin-top: 8px !important;
    }

    .topic-heading h2 {
      font-size: 62px !important;
    }

    .topic-heading > p:last-child {
      font-size: 18px !important;
    }

    .comparison-grid {
      gap: 20px !important;
    }

    .choice-card__header {
      min-height: 88px !important;
      padding: 18px 22px !important;
    }

    .choice-card__header h3 {
      font-size: 28px !important;
    }

    .choice-stage {
      min-height: 278px !important;
      padding: 26px !important;
    }

    .choice-option {
      min-height: 56px !important;
      font-size: 18px !important;
    }

    .choice-card__copy {
      font-size: 15px !important;
      min-height: 102px !important;
      padding: 20px 22px !important;
    }

    .hit-feedback {
      min-height: 70px !important;
      padding: 16px 22px !important;
    }

    .hit-feedback span {
      font-size: 14px !important;
    }

    .code-button,
    .info-button {
      display: none !important;
    }

    .demo-caption {
      border-radius: 20px !important;
      bottom: 30px !important;
      max-width: 900px;
      padding: 16px 30px 17px !important;
    }

    .demo-caption strong {
      font-size: 30px !important;
      line-height: 1.3 !important;
    }

    .demo-caption span {
      font-size: 16px !important;
      line-height: 1.4 !important;
      margin-top: 5px !important;
    }
  `
});

const cards = page.locator(".choice-card");
const badCard = cards.nth(0);
const splitCard = cards.nth(1);
const goodCard = cards.nth(2);

const badLabel = badCard.locator(".choice-option").nth(1).locator(".choice-text");
const badInput = badCard.locator(".choice-option").nth(1).locator("input");
const splitLabel = splitCard.locator(".choice-option").nth(1).locator(".choice-text");
const splitGapOption = splitCard.locator(".choice-option").nth(1);
const goodGapOption = goodCard.locator(".choice-option").nth(2);

async function clickCurrentPointer() {
  await page.mouse.down();
  await demo.wait(130);
  await page.mouse.up();
}

await demo.wait(600);
await demo.caption(
  "ラジオボタンの押せる範囲を比較",
  "Comparing hit areas for radio choices"
);
await demo.wait(1400);
await demo.hideCaption();

await demo.moveTo(badLabel, {
  duration: 1000,
  zoom: 1.12,
  ja: "文字を押しても、選択は変わらない",
  en: "Text is visible, but it is not clickable"
});
await clickCurrentPointer();
await demo.wait(900);

await demo.moveTo(badInput, {
  duration: 820,
  zoom: 1.12,
  ja: "小さな丸だけを狙う必要がある",
  en: "The tiny radio control is the only target"
});
await clickCurrentPointer();
await demo.wait(900);

await demo.moveTo(splitGapOption, {
  position: { x: 0.076, y: 0.5 },
  duration: 1050,
  zoom: 1.12,
  ja: "丸と文字の間は、まだ押せない",
  en: "The gap between control and text can still miss"
});
await clickCurrentPointer();
await demo.wait(900);

await demo.moveTo(splitLabel, {
  duration: 850,
  zoom: 1.12,
  ja: "ラベルをつなぐと、文字は押せる",
  en: "Connecting the label makes the text clickable"
});
await clickCurrentPointer();
await demo.wait(850);

await demo.moveTo(goodGapOption, {
  position: { x: 0.076, y: 0.5 },
  duration: 1100,
  zoom: 1.12,
  ja: "行全体をラベルにすると、余白まで押せる",
  en: "Make the whole row a label, and the gap works too"
});
await clickCurrentPointer();
await demo.wait(1000);

await demo.hideCaption();
await demo.zoomOut(900);
await demo.caption(
  "見た目のまとまりと、押せる範囲をそろえる",
  "Match the visual group with the actual hit area"
);
await demo.wait(1500);
await demo.hideCaption();
await demo.wait(450);

const webm = await demo.finish();
const mp4 = await transcodeToMp4(webm, "exports/form-hit-area.mp4", {
  start: 3
});
console.log(mp4);
