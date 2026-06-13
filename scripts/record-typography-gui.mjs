import { createDemo, transcodeToMp4 } from "./video-demo/runner.mjs";

const demo = await createDemo({
  url: "http://localhost:5173/ui-gallery/typography/",
  output: "exports/typography-gui.webm",
  viewport: { width: 1980, height: 1114 },
  stageSelector: "main"
});

const { page } = demo;

await page.addStyleTag({
  content: `
    .gallery-header,
    .gallery-hero,
    .intro-spacer,
    .gallery-footer {
      display: none !important;
    }

    main {
      padding: 38px 90px 52px !important;
    }

    .type-study {
      padding-top: 18px !important;
    }

    .section-heading {
      margin-bottom: 16px !important;
    }

    .reveal-stage {
      min-height: 720px !important;
      padding: 42px !important;
    }

    .character-title {
      font-size: 112px !important;
    }

    .gui-panel {
      font-size: 14px !important;
      right: 24px !important;
      top: 24px !important;
      width: 310px !important;
    }

    .gui-title {
      font-size: 12px !important;
      padding: 12px 15px !important;
    }

    .gui-row {
      padding: 11px 15px !important;
    }

    .gui-row__range input {
      max-width: 125px !important;
    }

    .gui-actions {
      padding: 12px 15px !important;
    }

    .demo-caption {
      border-radius: 20px !important;
      bottom: 28px !important;
      max-width: 940px;
      padding: 16px 30px 17px !important;
    }

    .demo-caption strong {
      font-size: 28px !important;
      line-height: 1.3 !important;
    }

    .demo-caption span {
      font-size: 16px !important;
      line-height: 1.4 !important;
      margin-top: 5px !important;
    }
  `
});

const duration = page.locator('[data-control="duration"]');
const stagger = page.locator('[data-control="stagger"]');
const preview = page.locator("[data-controls-preview]");
const motionSpec = page.locator(".motion-spec");

async function setRange(locator, value) {
  await locator.evaluate((input, nextValue) => {
    input.value = String(nextValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}

await demo.wait(650);
await demo.caption(
  "モーションをGUIで調整できるプロトタイプ",
  "A prototype with GUI controls for motion tuning"
);
await demo.wait(1500);
await demo.hideCaption();

await demo.moveTo(duration, {
  duration: 1100,
  zoom: 1.12,
  ja: "Durationを動かして、速度感をその場で比較",
  en: "Adjust duration and compare the pacing in place"
});
await setRange(duration, 700);
await demo.wait(1200);
await preview.click();
await demo.wait(1200);

await demo.moveTo(stagger, {
  duration: 1050,
  zoom: 1.12,
  ja: "Staggerも数値で試しながら、良い間隔を探す",
  en: "Tune stagger numerically to find the right rhythm"
});
await setRange(stagger, 65);
await demo.wait(1100);
await preview.click();
await demo.wait(1500);

await setRange(duration, 480);
await setRange(stagger, 20);
await demo.moveTo(preview, {
  duration: 950,
  zoom: 1.12,
  ja: "候補をすぐ再生して、並べながら詰められる",
  en: "Replay candidates instantly and refine them side by side"
});
await preview.click();
await demo.wait(1500);

await demo.zoomOut(750);
await demo.moveTo(motionSpec, {
  position: { x: 0.5, y: 0.5 },
  duration: 950,
  zoom: 1,
  ja: "決まった値が仕様として残る",
  en: "The chosen values remain visible as a motion spec"
});
await demo.wait(1200);

await demo.hideCaption();
await demo.caption(
  "感覚だけでなく、数値でデザイナーと調整できる",
  "Align with designers using concrete values, not impressions alone"
);
await demo.wait(1700);
await demo.hideCaption();
await demo.wait(450);

const webm = await demo.finish();
const mp4 = await transcodeToMp4(webm, "exports/typography-gui.mp4", {
  start: 2
});
console.log(mp4);
