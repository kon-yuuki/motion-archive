import { createDemo, transcodeToMp4 } from "./video-demo/runner.mjs";

const demo = await createDemo({
  url: "http://localhost:5173/ui-gallery/hover-intent/",
  output: "exports/hover-intent.webm",
  viewport: { width: 1980, height: 1114 },
  stageSelector: "main"
});

const { page } = demo;

await page.addStyleTag({
  content: `
    .gallery-header,
    .gallery-hero,
    .gallery-footer {
      display: none !important;
    }

    main {
      padding-top: 70px !important;
    }

    .gallery-section {
      padding-bottom: 42px !important;
    }
  `
});

const sections = page.locator(".gallery-section");
const buttons = (sectionIndex) => (
  sections.nth(sectionIndex).locator(".intent-target")
);

await demo.wait(600);
await demo.caption(
  "ツールチップの遅延設計を比較",
  "Comparing tooltip delay patterns"
);
await demo.wait(1300);
await demo.hideCaption();

await demo.moveTo(buttons(0).nth(0), {
  duration: 1050,
  zoom: 1.22,
  ja: "遅延なし：通過するだけでも表示",
  en: "No delay: every passing hover opens a tooltip"
});
await demo.wait(260);

for (let index = 1; index < 5; index += 1) {
  await demo.moveTo(buttons(0).nth(index), {
    duration: 280,
    zoom: 1.22
  });
  await demo.wait(180);
}
await demo.wait(450);

await demo.moveTo(buttons(1).nth(0), {
  duration: 1000,
  zoom: 1.22,
  ja: "一律で遅延：移動するたびに待たされる",
  en: "Fixed delay: every item makes you wait again"
});
await demo.wait(650);

for (let index = 1; index < 4; index += 1) {
  await demo.moveTo(buttons(1).nth(index), {
    duration: 430,
    zoom: 1.22
  });
  await demo.wait(650);
}
await demo.wait(350);

await demo.moveTo(buttons(2).nth(0), {
  duration: 1000,
  zoom: 1.22,
  ja: "初回のみ遅延：その後はすぐ切り替わる",
  en: "Intent delay: wait once, then move instantly"
});
await demo.wait(650);

for (let index = 1; index < 5; index += 1) {
  await demo.moveTo(buttons(2).nth(index), {
    duration: 430,
    zoom: 1.22
  });
  await demo.wait(240);
}
await demo.wait(550);

await demo.hideCaption();
await demo.zoomOut(900);
await demo.caption(
  "初回だけ待つ、グループ内は即時表示",
  "Delay once, then keep the group responsive"
);
await demo.wait(1300);
await demo.hideCaption();
await demo.wait(450);

const webm = await demo.finish();
const mp4 = await transcodeToMp4(webm, "exports/hover-intent.mp4");
console.log(mp4);
